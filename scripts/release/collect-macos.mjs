import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const version = process.env.DRAWCIRCUIT_VERSION;
const arch = process.arch === 'arm64' ? 'aarch64' : 'x86_64';
if (!/^\d+\.\d+\.\d+$/.test(version ?? '')) throw new Error('Missing release version');
const bundle = 'src-tauri/target/release/bundle';
const app = join(bundle, 'macos/DrawCircuit.app');
const actualVersion = execFileSync(
  '/usr/libexec/PlistBuddy',
  ['-c', 'Print :CFBundleShortVersionString', join(app, 'Contents/Info.plist')],
  { encoding: 'utf8' },
).trim();
if (actualVersion !== version) throw new Error(`Bundle has ${actualVersion}, expected ${version}`);
execFileSync('codesign', ['--verify', '--deep', '--strict', app], { stdio: 'inherit' });
mkdirSync('release-artifacts', { recursive: true });
const name = `DrawCircuit_${version}_darwin-${arch}`;
for (const [source, destination] of [
  [join(bundle, 'macos/DrawCircuit.app.tar.gz'), `${name}.app.tar.gz`],
  [join(bundle, 'macos/DrawCircuit.app.tar.gz.sig'), `${name}.app.tar.gz.sig`],
  [join(bundle, `dmg/DrawCircuit-${version}-${process.arch}.dmg`), `${name}.dmg`],
])
  copyFileSync(source, join('release-artifacts', destination));
const metadata = JSON.parse(readFileSync('dist-desktop/version.json', 'utf8'));
if (metadata.version !== version || metadata.channel !== 'desktop')
  throw new Error('Incorrect frontend version');
writeFileSync(`release-artifacts/build-${arch}.json`, JSON.stringify({ ...metadata, arch }));
