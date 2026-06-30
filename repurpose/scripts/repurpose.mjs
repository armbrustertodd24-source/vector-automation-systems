#!/usr/bin/env node
// Scaffold a repurposed content package from a source video.
// Zero dependencies — Node 18+ ESM. Fills templates/content-package.md and
// writes it under repurpose/batch/<week>/.
//
// Usage:
//   node repurpose/scripts/repurpose.mjs \
//     --title "AI chatbot that follows up with leads in 60 seconds" \
//     --source "https://youtube.com/@sabrina_ramonov" \
//     --framework "Instant, first-touch lead follow-up beats slow human follow-up" \
//     --lane niche \
//     --slug ai-chatbot-lead-followup \
//     [--week 2026-week-01]

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i]?.replace(/^--/, '');
    if (key) out[key] = argv[i + 1] ?? '';
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));

const required = ['title', 'slug', 'lane'];
const missing = required.filter((k) => !args[k]);
if (missing.length) {
  console.error(`Missing required flag(s): ${missing.map((m) => '--' + m).join(', ')}`);
  console.error('See repurpose/README.md for usage.');
  process.exit(1);
}

if (!['niche', 'general'].includes(args.lane)) {
  console.error(`--lane must be "niche" or "general" (got "${args.lane}")`);
  process.exit(1);
}

const week = args.week || '2026-week-01';
const isNiche = args.lane === 'niche';

const defaults = {
  source: args.source || 'https://youtube.com/@sabrina_ramonov',
  framework: args.framework || '<one-sentence framework — see prompt-library.md #1>',
  hook_1: `Most ${isNiche ? 'law firms' : 'people'} are doing this the slow way.`,
  hook_2: 'Here is the 2-minute version.',
  hook_3: 'I automated the boring part. Here is how.',
  caption: isNiche
    ? `The leads are already coming in. The problem is what happens in the next 5 minutes. Here's the AI fix.`
    : `One small automation that buys back an hour a day. Steal it.`,
  hashtags: isNiche
    ? '#aiautomation #lawfirmmarketing #personalinjurylawyer #legaltech #lawfirmgrowth #leadgeneration #automation #smallbusiness'
    : '#aiautomation #ai #automation #n8n #make #nocode #productivity #aitools',
  cta: 'See it running on your intake → vectorautomationsystems.com/demo',
};

const fill = (tpl) =>
  tpl
    .replaceAll('{{TITLE}}', args.title)
    .replaceAll('{{SLUG}}', args.slug)
    .replaceAll('{{LANE}}', args.lane)
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
console.log('  Next: fill the script beats (prompt-library.md #2), shoot, then');
console.log('  move it to Scheduled in repurpose/content-calendar.md');
