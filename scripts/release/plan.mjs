import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export function affectedChannels(paths) {
  const affected = { web: false, desktop: false };
  for (const path of paths) {
    if (/^(src-tauri\/|src\/desktop\/|scripts\/package-macos\.mjs$)/.test(path)) {
      affected.desktop = true;
    } else if (/^(src\/pwa\/|public\/|index\.html$)/.test(path)) {
      affected.web = true;
    } else if (
      /^(docs\/|tests\/|examples\/|assets\/|AGENTS\.md$|README\.md$|\.gitignore$|\.prettier|eslint\.config\.)/.test(
        path,
      ) ||
      /\.(md|test\.mjs)$/.test(path)
    ) {
      continue;
    } else {
      // Shared source, dependencies, build/release tools and unclassified files
      // reach both products. Unknown files must never silently miss a release.
      affected.web = affected.desktop = true;
    }
  }
  return affected;
}

export function compareVersions(a, b) {
  const left = a.split('.').map(Number);
  const right = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) if (left[i] !== right[i]) return left[i] - right[i];
  return 0;
}

export function nextVersion(version) {
  if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error('Invalid release version');
  const [major, minor, patch] = version.split('.').map(Number);
  return `${major}.${minor}.${patch + 1}`;
}

export function releasePlan({ tags, changedSince, config, force = 'auto' }) {
  if (!['auto', 'web', 'desktop', 'both'].includes(force)) throw new Error('Invalid channel');
  return Object.fromEntries(
    ['web', 'desktop'].flatMap((channel) => {
      const prefix = `${channel}-v`;
      const latest = tags
        .filter((tag) => tag.startsWith(prefix) && /^\d+\.\d+\.\d+$/.test(tag.slice(prefix.length)))
        .sort((a, b) => compareVersions(b.slice(prefix.length), a.slice(prefix.length)))[0];
      const base = latest ?? config.bootstrapCommit;
      const published = latest?.slice(prefix.length) ?? config[`${channel}Version`];
      const baseline = config[`${channel}Version`];
      const version = compareVersions(baseline, published) > 0 ? baseline : nextVersion(published);
      const affected = affectedChannels(changedSince(base))[channel];
      const selected = force === 'both' || force === channel || (force === 'auto' && affected);
      return [
        [channel, selected],
        [`${channel}_version`, version],
        [`${channel}_base`, base],
      ];
    }),
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
  const plan = releasePlan({
    tags: git('tag', '--list').split('\n'),
    changedSince: (base) =>
      git('diff', '--name-only', '--no-renames', base, 'HEAD').split('\n').filter(Boolean),
    config: JSON.parse(readFileSync('release.config.json', 'utf8')),
    force: process.env.RELEASE_CHANNEL ?? 'auto',
  });
  console.log(JSON.stringify(plan, null, 2));
  if (process.env.GITHUB_OUTPUT)
    appendFileSync(
      process.env.GITHUB_OUTPUT,
      Object.entries(plan)
        .map(([key, value]) => `${key}=${value}\n`)
        .join(''),
    );
  if (process.env.GITHUB_STEP_SUMMARY)
    appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      `| Channel | Publish | Version | Since |\n|---|---|---|---|\n${['web', 'desktop'].map((c) => `| ${c} | ${plan[c]} | ${plan[`${c}_version`]} | ${plan[`${c}_base`]} |`).join('\n')}\n`,
    );
}
