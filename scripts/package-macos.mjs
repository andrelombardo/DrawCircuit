import { cp, mkdir, mkdtemp, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

if (process.platform !== 'darwin') throw new Error('Il pacchetto macOS richiede un Mac.');
const { version: configuredVersion } = JSON.parse(
  readFileSync(new URL('../src-tauri/tauri.conf.json', import.meta.url), 'utf8'),
);
const version = process.env.DRAWCIRCUIT_VERSION ?? configuredVersion;
const app = resolve('src-tauri/target/release/bundle/macos/DrawCircuit.app');
const output = resolve('src-tauri/target/release/bundle/dmg');
const staging = await mkdtemp(join(tmpdir(), 'drawcircuit-dmg-'));
try {
  await mkdir(output, { recursive: true });
  await cp(app, join(staging, 'DrawCircuit.app'), { recursive: true });
  await symlink('/Applications', join(staging, 'Applications'));
  const image = join(output, `DrawCircuit-${version}-${process.arch}.dmg`);
  execFileSync(
    'hdiutil',
    ['create', '-ov', '-volname', 'DrawCircuit', '-srcfolder', staging, '-format', 'UDZO', image],
    { stdio: 'inherit' },
  );
  console.log(image);
} finally {
  await rm(staging, { recursive: true, force: true });
}
