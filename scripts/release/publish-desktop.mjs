import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';

const gh = (...args) =>
  execFileSync('gh', args, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'inherit'] }).trim();
const manifest = JSON.parse(readFileSync('release-artifacts/latest.json', 'utf8'));
const tag = `desktop-v${manifest.version}`;
const repo = 'andrelombardo/drawcircuit';
writeFileSync(
  'release-artifacts/notes.md',
  `DrawCircuit macOS ${manifest.version}\n\nCommit: ${process.env.GITHUB_SHA}\n\nPacchetti per Apple Silicon e Intel. Gli aggiornamenti nell’app richiedono conferma e salvano circuito, blocchi e preferenze prima dell’installazione.\n`,
);
let release;
try {
  release = JSON.parse(gh('release', 'view', tag, '--repo', repo, '--json', 'isDraft'));
} catch {
  /* First attempt. */
}
if (release && !release.isDraft) throw new Error('Refusing to replace a published release');
if (!release)
  gh(
    'release',
    'create',
    tag,
    '--repo',
    repo,
    '--target',
    process.env.GITHUB_SHA,
    '--draft',
    '--title',
    `DrawCircuit macOS ${manifest.version}`,
    '--notes-file',
    'release-artifacts/notes.md',
  );
const assets = readdirSync('release-artifacts').filter((name) =>
  /\.(dmg|tar\.gz|sig|json)$/.test(name),
);
gh(
  'release',
  'upload',
  tag,
  ...assets.map((name) => `release-artifacts/${name}`),
  '--repo',
  repo,
  '--clobber',
);
// Only completed, signature-verified packages become the public updater endpoint.
gh('release', 'edit', tag, '--repo', repo, '--draft=false', '--latest');
console.log(gh('release', 'view', tag, '--repo', repo, '--json', 'url'));
