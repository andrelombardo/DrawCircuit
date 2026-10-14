import { describe, expect, it, vi } from 'vitest';
import { DesktopUpdateController, isDesktopUpdateBusy } from '../src/desktop/updateController';
import { DesktopStorage } from '../src/desktop/storage';

function fixture() {
  const update = {
    version: '1.0.2',
    download: vi.fn().mockResolvedValue(undefined),
    install: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
  };
  const dependencies = {
    check: vi.fn().mockResolvedValue(update),
    confirm: vi.fn().mockResolvedValue(true),
    assertReady: vi.fn(),
    save: vi.fn().mockResolvedValue(undefined),
    restart: vi.fn().mockResolvedValue(undefined),
    lock: vi.fn(),
  };
  return { update, dependencies, controller: new DesktopUpdateController(dependencies) };
}

describe('signed desktop update lifecycle', () => {
  it('offers an update without downloading, and honours refusal and postponement', async () => {
    const { update, dependencies, controller } = fixture();
    await controller.check();
    expect(controller.snapshot()).toMatchObject({ phase: 'available', version: '1.0.2' });
    expect(update.download).not.toHaveBeenCalled();
    controller.dismiss();
    expect(controller.snapshot().phase).toBe('idle');
    await controller.check(true);
    dependencies.confirm.mockResolvedValue(false);
    await controller.apply();
    expect(dependencies.save).not.toHaveBeenCalled();
    expect(update.install).not.toHaveBeenCalled();
    expect(dependencies.lock).not.toHaveBeenCalled();
  });
  it('waits for durable disk writes, including blocks and preferences, before installing', async () => {
    const { update, dependencies, controller } = fixture();
    const order: string[] = [];
    const initial = {
      'drawcircuit.document.v1': 'circuit',
      'drawcircuit.personalBlocks.v1': 'blocks',
      'drawcircuit.zoom.v1': '125',
      'drawcircuit.document.v1.recovery.1': 'original',
    };
    const write = vi.fn(async (entries: Record<string, string>) => {
      order.push('disk');
      expect(entries['drawcircuit.personalBlocks.v1']).toBe('blocks');
    });
    const storage = new DesktopStorage(initial, write, vi.fn());
    dependencies.save.mockImplementation(async () => {
      storage.setItem('drawcircuit.document.v1', 'current');
      await storage.flush();
      order.push('saved');
    });
    update.download.mockImplementation(async () => {
      order.push('verified download');
      storage.setItem('drawcircuit.zoom.v1', '150');
    });
    update.install.mockImplementation(async () => {
      expect(isDesktopUpdateBusy()).toBe(true);
      order.push('install');
    });
    dependencies.restart.mockImplementation(async () => {
      order.push('restart');
    });
    await controller.check();
    await controller.apply();
    expect(order).toEqual([
      'disk',
      'saved',
      'verified download',
      'disk',
      'saved',
      'install',
      'restart',
    ]);
    expect(write.mock.calls.at(-1)?.[0]).toEqual({
      ...initial,
      'drawcircuit.document.v1': 'current',
      'drawcircuit.zoom.v1': '150',
    });
    expect(storage.getItem('drawcircuit.personalBlocks.v1')).toBe('blocks');
    expect(storage.getItem('drawcircuit.document.v1.recovery.1')).toBe('original');
    expect(dependencies.lock.mock.calls).toEqual([[true], [false]]);
    expect(isDesktopUpdateBusy()).toBe(false);
  });
  it.each(['save', 'download', 'install'] as const)(
    'keeps the app open and unlocks after %s failure',
    async (stage) => {
      const { update, dependencies, controller } = fixture();
      const fn = stage === 'save' ? dependencies.save : update[stage];
      fn.mockRejectedValueOnce(
        new Error(stage === 'download' ? 'Invalid signature' : 'disk unavailable'),
      );
      await controller.check();
      await controller.apply();
      expect(controller.snapshot().phase).toBe('error');
      expect(dependencies.restart).not.toHaveBeenCalled();
      if (stage !== 'install') expect(update.install).not.toHaveBeenCalled();
      expect(isDesktopUpdateBusy()).toBe(false);
      expect(dependencies.lock).toHaveBeenLastCalledWith(false);
    },
  );
  it('refuses to interrupt gestures or inline edits', async () => {
    const { update, dependencies, controller } = fixture();
    dependencies.assertReady.mockImplementation(() => {
      throw new Error('Concludi la modifica');
    });
    await controller.check();
    await controller.apply();
    expect(dependencies.confirm).not.toHaveBeenCalled();
    expect(update.download).not.toHaveBeenCalled();
  });
  it('serializes repeated actions and leaves an installed app restartable without reinstalling', async () => {
    const { update, dependencies, controller } = fixture();
    let release!: () => void;
    dependencies.confirm.mockImplementation(
      () =>
        new Promise((resolve) => {
          release = () => resolve(true);
        }),
    );
    dependencies.restart.mockRejectedValueOnce(new Error('relaunch failed'));
    await controller.check();
    const applying = controller.apply();
    await controller.apply();
    await controller.check();
    release();
    await applying;
    expect(dependencies.confirm).toHaveBeenCalledOnce();
    expect(controller.snapshot().phase).toBe('installed');
    await controller.apply();
    expect(update.install).toHaveBeenCalledOnce();
    expect(update.download).toHaveBeenCalledOnce();
    expect(dependencies.restart).toHaveBeenCalledTimes(2);
  });
  it('handles offline checks silently until a manual request and closes superseded resources', async () => {
    const { update, dependencies, controller } = fixture();
    dependencies.check.mockRejectedValueOnce(new Error('offline'));
    await controller.check();
    expect(controller.snapshot()).toEqual({ phase: 'idle', message: undefined });
    dependencies.check.mockRejectedValueOnce(new Error('offline'));
    await controller.check(true);
    expect(controller.snapshot().message).toContain('online');
    await controller.check();
    dependencies.check.mockResolvedValueOnce(null);
    await controller.check(true);
    expect(update.close).toHaveBeenCalledOnce();
    expect(controller.snapshot().message).toContain('aggiornato');
  });
});
