# Content Repurposing System

Turn Sabrina Ramonov's AI-automation videos into original short-form content
(Instagram Reels · TikTok · YouTube Shorts) for **Vector Automation Systems**.

Sabrina has publicly granted permission to repurpose her content
("btw you have permission to repurpose all my content :) enjoy!" —
[source](https://substack.com/@sabrinaramonov/note/c-242243787)). This system
is built to *transform* her publicly-taught frameworks into our own scripts and
voice — not to re-upload her videos verbatim.

## Folder map

```
repurpose/
├─ README.md                ← you are here (the operating manual)
├─ SYSTEM.md                ← the automation pipeline (Make · Notion · Canva · Blotato)
├─ content-calendar.md      ← the posting schedule for the first batch
├─ templates/
│  ├─ content-package.md    ← the shape of one repurposed video's output
│  └─ prompt-library.md     ← the AI prompts that drive generation
├─ scripts/
│  └─ repurpose.mjs         ← scaffolds a content package from a source video
└─ batch/
   └─ 2026-week-01/         ← 5 ready-to-shoot content packages
```

## The rules (read once, follow always)

1. **Transform, don't copy.** Every script is written from scratch around a
   *framework* or *idea*, never lifted from her transcript. If a sentence could
   be pasted back into her video unchanged, rewrite it.
2. **Always credit.** Every caption ends with `Framework inspired by
   @sabrina_ramonov 🍄`. It's the right thing to do and it helps the algorithm
   (tagging an established creator in the niche).
3. **Two lanes, mixed.** Some pieces are *niche* (reframed for personal-injury /
   law-firm owners — our actual buyer); some are *general* (top-of-funnel
   AI-automation). The first batch is 2 niche + 3 general.
4. **One source → many cuts.** Each source video yields a Reel, a TikTok variant,
   and a YouTube Short — same core script, platform-tuned hooks and captions.

## Quick start

```bash
# Scaffold a new content package from a source video
node repurpose/scripts/repurpose.mjs \
  --title "AI chatbot that follows up with leads in 60 seconds" \
  --source "https://youtube.com/@sabrina_ramonov" \
  --lane niche \
  --slug ai-chatbot-lead-followup
```

This drops a filled-in template under `repurpose/batch/`. Edit the script beats,
shoot it, then move the row to **Scheduled** in `content-calendar.md`.

See `SYSTEM.md` for the fully-automated version (new video → drafts in your
Notion calendar → visuals → scheduled posts).
