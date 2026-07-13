#!/usr/bin/env node
// Turn a voiceover .txt into an audio file narrated in YOUR cloned voice.
// Reads the clean scripts under repurpose/voiceover/ and calls a text-to-speech
// API, writing .mp3 files to repurpose/audio/.
//
// Zero npm deps (Node 18+ fetch). Provider defaults to ElevenLabs.
//
// Setup (once):
//   1. Clone your voice with the provider (see repurpose/VOICE.md).
//   2. export ELEVENLABS_API_KEY=sk_...
//   3. export ELEVEN_VOICE_ID=<your cloned voice id>
//
// Usage:
//   node repurpose/scripts/narrate.mjs repurpose/voiceover/2026-week-01/01-ai-chatbot-lead-followup.txt
//   node repurpose/scripts/narrate.mjs --all      # narrate every .txt in voiceover/

import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const VO = join(ROOT, 'voiceover');
const OUT = join(ROOT, 'audio');

const API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = process.env.ELEVEN_VOICE_ID;
const MODEL_ID = process.env.ELEVEN_MODEL_ID || 'eleven_multilingual_v2';

function requireEnv() {
  const missing = [];
  if (!API_KEY) missing.push('ELEVENLABS_API_KEY');
  if (!VOICE_ID) missing.push('ELEVEN_VOICE_ID');
  if (missing.length) {
    console.error(`Missing env var(s): ${missing.join(', ')}`);
    console.error('This is where YOUR cloned voice plugs in. See repurpose/VOICE.md for setup.');
    process.exit(1);
  }
}

async function synth(text) {
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': API_KEY,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: MODEL_ID,
        // Tuned for a natural, consistent spoken delivery. Adjust to taste.
        voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.0 },
      }),
    }
  );
  if (!res.ok) {
    throw new Error(`TTS API ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

async function walk(dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(p)));
    else if (entry.name.endsWith('.txt')) files.push(p);
  }
  return files;
}

async function narrate(txtPath) {
  const text = (await readFile(txtPath, 'utf8')).trim();
  if (!text) {
    console.warn(`⚠ empty ${relative(ROOT, txtPath)} — skipped`);
    return false;
  }
  const audio = await synth(text);
  const rel = relative(VO, txtPath).replace(/\.txt$/, '.mp3');
  const outPath = join(OUT, rel);
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, audio);
  console.log(`✓ ${relative(ROOT, outPath)}  (${(audio.length / 1024).toFixed(0)} KB)`);
  return true;
}

const arg = process.argv[2];
if (!arg) {
  console.error('Pass a voiceover .txt path, or --all. See repurpose/VOICE.md.');
  process.exit(1);
}
requireEnv();

if (arg === '--all') {
  const files = await walk(VO);
  let n = 0;
  for (const f of files) {
    try {
      if (await narrate(f)) n++;
    } catch (e) {
      console.error(`✗ ${relative(ROOT, f)} — ${e.message}`);
    }
  }
  console.log(`\nDone — ${n} audio file(s) in repurpose/audio/`);
} else {
  await narrate(arg);
}
