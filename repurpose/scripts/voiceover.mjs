#!/usr/bin/env node
// Extract a clean voiceover-only .txt from a content package's Script section.
// Strips markdown, timestamps, and beat labels — leaving just the spoken words,
// one line per beat, ready to paste into an AI voice tool or a teleprompter.
//
// Usage:
//   node repurpose/scripts/voiceover.mjs repurpose/batch/2026-week-01/01-ai-chatbot-lead-followup.md
//   node repurpose/scripts/voiceover.mjs --all     # regenerate for every package in batch/

import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { dirname, join, relative, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const BATCH = join(ROOT, 'batch');
const OUT = join(ROOT, 'voiceover');

// Pull the spoken lines from the "## Script" section. Each beat looks like:
//   - **[0:06 – Problem]** Speed-to-lead is the whole game...
// We keep only the words after the bracketed label.
// Remove inline markdown (**bold**, *italic*, `code`) so the spoken line reads
// clean in a teleprompter or voice tool.
function stripInlineMarkdown(s) {
  return s.replace(/\*\*/g, '').replace(/\*/g, '').replace(/`/g, '');
}

function extractVoiceover(md) {
  const out = [];
  let inScript = false;
  for (const line of md.split('\n')) {
    if (/^##\s+Script\b/.test(line)) { inScript = true; continue; }
    if (inScript && /^##\s+/.test(line)) break;
    if (!inScript) continue;
    const m = line.match(/^\s*-\s+\*\*\[[^\]]*\]\*\*\s*(.+)$/);
    if (m) out.push(stripInlineMarkdown(m[1].trim()));
  }
  return out.join('\n') + '\n';
}

async function walk(dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(p)));
    else if (entry.name.endsWith('.md')) files.push(p);
  }
  return files;
}

async function convert(mdPath) {
  const md = await readFile(mdPath, 'utf8');
  const vo = extractVoiceover(md);
  if (vo.trim() === '') {
    console.warn(`⚠ no script beats found in ${relative(ROOT, mdPath)} — skipped`);
    return false;
  }
  const rel = relative(BATCH, mdPath).replace(/\.md$/, '.txt');
  const outPath = join(OUT, rel);
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, vo);
  console.log(`✓ ${relative(ROOT, outPath)}`);
  return true;
}

const arg = process.argv[2];
if (!arg) {
  console.error('Pass a package .md path, or --all. See repurpose/README.md.');
  process.exit(1);
}

if (arg === '--all') {
  const files = await walk(BATCH);
  let n = 0;
  for (const f of files) if (await convert(f)) n++;
  console.log(`\nDone — ${n} voiceover file(s) in repurpose/voiceover/`);
} else {
  await convert(arg);
}
