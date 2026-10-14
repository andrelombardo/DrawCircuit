import { test } from 'node:test';
import assert from 'node:assert/strict';
import { affectedChannels, releasePlan } from './plan.mjs';

test('routes desktop, web, shared, renamed/deleted and documentation paths', () => {
  for (const path of [
    'src/desktop/bootstrap.ts',
    'src-tauri/src/main.rs',
    'src-tauri/icons/icon.icns',
    'scripts/package-macos.mjs',
  ])
    assert.deepEqual(affectedChannels([path]), { web: false, desktop: true });
  for (const path of ['src/pwa/PwaStatus.tsx', 'public/icons/icon.png', 'index.html'])
    assert.deepEqual(affectedChannels([path]), { web: true, desktop: false });
  for (const path of [
    'src/model/types.ts',
    'src/store/editorStore.ts',
    'src/styles.css',
    'package-lock.json',
    'vite.config.ts',
    '.github/workflows/deploy-pages.yml',
    'scripts/release/plan.mjs',
    'unknown-runtime-file',
  ])
    assert.deepEqual(affectedChannels([path]), { web: true, desktop: true });
  assert.deepEqual(
    affectedChannels(['docs/desktop.md', 'README.md', 'tests/desktop-storage.test.ts']),
    { web: false, desktop: false },
  );
  assert.deepEqual(affectedChannels(['src/pwa/deleted.ts', 'src/desktop/renamed.ts']), {
    web: true,
    desktop: true,
  });
});

const config = { bootstrapCommit: 'initial', webVersion: '1.0.0', desktopVersion: '1.0.0' };
test('increments independent channel versions numerically, from their successful releases', () => {
  const plan = releasePlan({
    tags: ['web-v1.0.9', 'web-v1.0.10', 'desktop-v1.2.3', 'other-v9.0.0'],
    config,
    changedSince: () => ['src/desktop/bootstrap.ts'],
  });
  assert.equal(plan.web, false);
  assert.equal(plan.web_version, '1.0.11');
  assert.equal(plan.desktop, true);
  assert.equal(plan.desktop_version, '1.2.4');
});
test('uses each channel baseline so failed, skipped and coalesced runs cannot lose changes', () => {
  const plan = releasePlan({
    tags: ['web-v1.0.1', 'desktop-v1.0.1'],
    config,
    changedSince: (base) => (base.startsWith('web-') ? ['src/model/types.ts'] : ['docs/report.md']),
  });
  assert.equal(plan.web, true);
  assert.equal(plan.desktop, false);
});
test('initializes from the deployed bootstrap and allows deliberate channel releases', () => {
  const plan = releasePlan({ tags: [], config, force: 'desktop', changedSince: () => [] });
  assert.equal(plan.web, false);
  assert.equal(plan.desktop, true);
  assert.equal(plan.desktop_version, '1.0.1');
  assert.equal(plan.desktop_base, 'initial');
  assert.throws(() => releasePlan({ tags: [], config, force: 'oops', changedSince: () => [] }));
});
test('permits a configured major/minor bump while preserving monotonic versions', () => {
  const plan = releasePlan({
    tags: ['web-v1.0.9'],
    config: { ...config, webVersion: '2.0.0' },
    changedSince: () => ['src/model/types.ts'],
  });
  assert.equal(plan.web_version, '2.0.0');
});
