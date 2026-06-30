#!/usr/bin/env node
// Scaffold a repurposed content package from a source video.
// Zero dependencies — Node 18+ ESM. Fills templates/content-package.md and
// writes it under repurpose/batch/<week>/.
//
// Usage:
//   node repurpose/scripts/repurpose.mjs \
//     --title "Build a $200 automation you can sell in a weekend" \
//     --source "https://youtube.com/@sabrina_ramonov" \
//     --framework "Learn one automation, then sell it as a service" \
//     --segment agency \
//     --slug sell-automations-as-a-service \
//     [--week 2026-week-02]

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// Money-making audience segments. Keep in sync with content-map.md + README.
const SEGMENTS = {
  creator: {
    audience: 'content creators growing/monetizing an audience',
    hook: 'Most creators are doing this the slow, manual way.',
    caption: 'Turn one idea into a week of content — without living in the editor.',
    tags: '#aiautomation #contentcreator #faceless #creatoreconomy #ai #automation #aitools #contentmarketing',
  },
  solopreneur: {
    audience: 'solo founders & side-hustlers building income',
    hook: 'You can build this in a weekend and it pays you while you sleep.',
    caption: 'A small AI build that turns into real income. Steal the playbook.',
    tags: '#aiautomation #solopreneur #sidehustle #buildinpublic #ai #automation #nocode #makemoneyonline',
  },
  agency: {
    audience: 'freelancers & agencies selling automation services',
    hook: "You can learn this in a day and sell it for $2,000.",
    caption: 'Learn one automation, then sell it. The whole agency model in 30s.',
    tags: '#aiautomation #agencyowner #freelance #servicebusiness #ai #automation #smma #makemoney',
  },
  localbiz: {
    audience: 'local & service-business owners (incl. law firms)',
    hook: 'Most local businesses are leaving money on the table every single night.',
    caption: "The leads are already coming in. It's what happens next that costs you.",
    tags: '#aiautomation #smallbusiness #localbusiness #leadgeneration #automation #ai #aitools #marketing',
  },
  beginner: {
    audience: 'total beginners earning their first dollar with AI',
    hook: "If you've never automated anything, start embarrassingly simple.",
    caption: 'Your first automation should save 30 minutes, not impress anyone.',
    tags: '#aiautomation #learnai #aiforbeginners #makemoneyonline #automation #ai #nocode #productivity',
  },
};

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i]?.replace(/^--/, '');
    if (key) out[key] = argv[i + 1] ?? '';
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));

const required = ['title', 'slug', 'segment'];
const missing = required.filter((k) => !args[k]);
if (missing.length) {
  console.error(`Missing required flag(s): ${missing.map((m) => '--' + m).join(', ')}`);
  console.error('See repurpose/README.md for usage.');
  process.exit(1);
}

const seg = SEGMENTS[args.segment];
if (!seg) {
  console.error(`--segment must be one of: ${Object.keys(SEGMENTS).join(', ')} (got "${args.segment}")`);
  process.exit(1);
}

const week = args.week || '2026-week-02';

const defaults = {
  source: args.source || 'https://youtube.com/@sabrina_ramonov',
  framework: args.framework || '<one-sentence framework — see prompt-library.md #1>',
  hook_1: seg.hook,
  hook_2: 'Here is the 2-minute version.',
  hook_3: 'I automated the boring part. Here is how it makes money.',
  caption: seg.caption,
  hashtags: seg.tags,
  cta: 'Want it built for you? → vectorautomationsystems.com/demo',
};

const fill = (tpl) =>
  tpl
    .replaceAll('{{TITLE}}', args.title)
    .replaceAll('{{SLUG}}', args.slug)
    .replaceAll('{{LANE}}', `${args.segment} — ${seg.audience}`)
    .replaceAll('{{SOURCE}}', defaults.source)
    .replaceAll('{{FRAMEWORK}}', defaults.framework)
    .replaceAll('{{HOOK_1}}', defaults.hook_1)
    .replaceAll('{{HOOK_2}}', defaults.hook_2)
    .replaceAll('{{HOOK_3}}', defaults.hook_3)
    .replaceAll('{{CAPTION}}', defaults.caption)
    .replaceAll('{{HASHTAGS}}', defaults.hashtags)
    .replaceAll('{{CTA}}', defaults.cta);

const tplPath = join(ROOT, 'templates', 'content-package.md');
const outDir = join(ROOT, 'batch', week);
const outPath = join(outDir, `${args.slug}.md`);

const tpl = await readFile(tplPath, 'utf8');
await mkdir(outDir, { recursive: true });
await writeFile(outPath, fill(tpl), { flag: 'wx' }).catch((e) => {
  if (e.code === 'EEXIST') {
    console.error(`Refusing to overwrite existing file: ${outPath}`);
    process.exit(1);
  }
  throw e;
});

console.log(`✓ Scaffolded ${outPath}`);
console.log(`  Segment: ${args.segment} (${seg.audience})`);
console.log('  Next: fill the script beats (prompt-library.md #2), shoot, then');
console.log('  move it to Scheduled in repurpose/content-calendar.md');
