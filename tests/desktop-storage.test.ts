import { afterEach, describe, expect, it, vi } from 'vitest';
import { DesktopStorage } from '../src/desktop/storage';

afterEach(() => vi.useRealTimers());
describe('durable desktop storage', () => {
  it('batches preferences without rewriting unchanged data and flushes the newest snapshot', async () => {
    vi.useFakeTimers();
    const write = vi.fn().mockResolvedValue(undefined);
    const storage = new DesktopStorage({ 'drawcircuit.document.v1': 'original' }, write, vi.fn());
    storage.setItem('drawcircuit.document.v1', 'original');
    await storage.flush();
    expect(write).not.toHaveBeenCalled();
    storage.setItem('drawcircuit.document.v1', 'changed');
    storage.setItem('drawcircuit.zoom.v1', '100');
    await vi.advanceTimersByTimeAsync(100);
    expect(write).toHaveBeenCalledExactlyOnceWith({
      'drawcircuit.document.v1': 'changed',
      'drawcircuit.zoom.v1': '100',
    });
  });
  it('serializes writes arriving while an earlier save is in flight', async () => {
    vi.useFakeTimers();
    let release!: () => void;
    const first = new Promise<void>((resolve) => {
      release = resolve;
    });
    const write = vi.fn().mockReturnValueOnce(first).mockResolvedValue(undefined);
    const storage = new DesktopStorage({}, write, vi.fn());
    storage.setItem('drawcircuit.document.v1', 'first');
    const saving = storage.flush();
    storage.setItem('drawcircuit.document.v1', 'last');
    release();
    await saving;
    expect(write.mock.calls.map(([snapshot]) => snapshot['drawcircuit.document.v1'])).toEqual([
      'first',
      'last',
    ]);
    await storage.flush();
    expect(write).toHaveBeenCalledTimes(2);
  });
  it('keeps failed data available for export and retries before allowing close', async () => {
    vi.useFakeTimers();
    const write = vi
      .fn()
      .mockRejectedValueOnce(new Error('Disk full'))
      .mockResolvedValue(undefined);
    const saved = vi.fn();
    const storage = new DesktopStorage({}, write, vi.fn(), saved);
    storage.setItem('drawcircuit.document.v1', 'last committed circuit');
    await expect(storage.flush()).rejects.toThrow('Disk full');
    expect(storage.getItem('drawcircuit.document.v1')).toBe('last committed circuit');
    expect(saved).not.toHaveBeenCalled();
    await storage.flush();
    expect(saved).toHaveBeenCalledOnce();
  });
  it('rejects unrelated keys and preserves recovery entries when editing the circuit', async () => {
    vi.useFakeTimers();
    const storage = new DesktopStorage(
      { 'drawcircuit.document.v1.recovery.1': 'unreadable original' },
      vi.fn().mockResolvedValue(undefined),
      vi.fn(),
    );
    expect(() => storage.setItem('unrelated', 'value')).toThrow();
    storage.setItem('drawcircuit.document.v1', 'repaired');
    await storage.flush();
    expect(storage.getItem('drawcircuit.document.v1.recovery.1')).toBe('unreadable original');
  });
});
