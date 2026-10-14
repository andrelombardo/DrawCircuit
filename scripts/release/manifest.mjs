import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const version = process.env.DRAWCIRCUIT_VERSION;
const commit = process.env.GITHUB_SHA;
if (!/^\d+\.\d+\.\d+$/.test(version ?? '') || !/^[a-f0-9]{40}$/.test(commit ?? ''))
  throw new Error('Missing release identity');
const { plugins } = JSON.parse(readFileSync('src-tauri/tauri.conf.json', 'utf8'));
const staging = mkdtempSync(join(tmpdir(), 'drawcircuit-signature-'));
try {
  writeFileSync(join(staging, 'updater.pub'), Buffer.from(plugins.updater.pubkey, 'base64'));
  const platforms = {};
  for (const arch of ['aarch64', 'x86_64']) {
    const metadata = JSON.parse(readFileSync(`release-artifacts/build-${arch}.json`, 'utf8'));
    if (
      metadata.version !== version ||
      metadata.commit !== commit ||
      metadata.arch !== arch ||
      metadata.channel !== 'desktop'
    )
      throw new Error(`Mismatched ${arch} artifact`);
    const name = `DrawCircuit_${version}_darwin-${arch}.app.tar.gz`;
    const signature = readFileSync(`release-artifacts/${name}.sig`, 'utf8').trim();
    writeFileSync(join(staging, `${arch}.sig`), Buffer.from(signature, 'base64'));
    execFileSync(
      'minisign',
      [
        '-V',
        '-p',
        join(staging, 'updater.pub'),
        '-m',
        `release-artifacts/${name}`,
        '-x',
        join(staging, `${arch}.sig`),
      ],
      { stdio: 'inherit' },
    );
    platforms[`darwin-${arch}`] = {
      signature,
      url: `https://github.com/andrelombardo/drawcircuit/releases/download/desktop-v${version}/${name}`,
    };
  }
  writeFileSync(
    'release-artifacts/latest.json',
    JSON.stringify(
      {
        version,
        notes: `DrawCircuit macOS ${version}. Commit ${commit}.`,
        pub_date: new Date().toISOString(),
        platforms,
      },
      null,
      2,
    ) + '\n',
  );
} finally {
  rmSync(staging, { recursive: true, force: true });
}
