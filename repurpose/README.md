# Content Repurposing System

Turn **Sabrina Ramonov's full catalog** of AI-automation content into original
short-form videos (Instagram Reels · TikTok · YouTube Shorts) for **Vector
Automation Systems**.

The through-line is **"make money with AI automation"** — for everyone who wants
to: creators, solopreneurs, agencies/freelancers, local businesses, and total
beginners. Personal-injury firms are just *one* example audience, not the focus.

Sabrina has publicly granted permission to repurpose her content
("btw you have permission to repurpose all my content :) enjoy!" —
[source](https://substack.com/@sabrinaramonov/note/c-242243787)). This system
*transforms* her publicly-taught frameworks into our own scripts and voice — it
never re-uploads her videos verbatim.

## Folder map

```
repurpose/
├─ README.md                ← you are here (the operating manual)
├─ content-map.md           ← Sabrina's WHOLE catalog → angles → segments (the backbone)
├─ SYSTEM.md                ← the automation pipeline (Make · Notion · Canva · Blotato)
├─ content-calendar.md      ← the rolling posting schedule
├─ templates/
│  ├─ content-package.md    ← the shape of one repurposed video's output
│  └─ prompt-library.md     ← the AI prompts that drive generation
├─ scripts/
│  ├─ repurpose.mjs         ← scaffolds a content package from a source video
│  └─ voiceover.mjs         ← extracts a clean voiceover-only .txt from a package
├─ voiceover/               ← generated .txt scripts (voice tool / teleprompter ready)
│  ├─ 2026-week-01/
│  └─ 2026-week-02/
└─ batch/
   ├─ 2026-week-01/         ← localbiz + creator + beginner starter set
   └─ 2026-week-02/         ← creator / agency / solopreneur / beginner monetization set
```

## Audience segments (the new "lanes")

Every piece is tagged with **who it helps make money**:

| Segment | Who | Sample angle |
|---------|-----|--------------|
| `creator` | Content creators growing/monetizing an audience | Faceless video factory, repurposing, AI social agent |
| `solopreneur` | Solo founders & side-hustlers building income | Build & sell a micro-tool, a prompt that prints money |
| `agency` | Freelancers/agencies selling automation (our own model) | "Learn it, then sell it" — productize an automation |
| `localbiz` | Local & service businesses (incl. PI firms) | AI receptionist, instant lead follow-up, review engine |
| `beginner` | Total beginners earning their first dollar with AI | First automation, ChatGPT to first $100 |

Aim for a rolling **mix across all five** so the feed isn't one-note.

## The rules (read once, follow always)

1. **Transform, don't copy.** Scripts are written from scratch around a
   *framework*, never lifted from her transcript. If a line could paste back into
   her video unchanged, rewrite it.
2. **Always credit.** Every caption ends with `Framework inspired by
   @sabrina_ramonov 🍄`. Right thing to do, and it helps the algorithm.
3. **Cover the whole catalog.** Work the backlog in `content-map.md` top to
   bottom so we genuinely incorporate all of her content over time — not just the
   greatest hits.
4. **One source → many cuts.** Each source video yields a Reel, a TikTok variant,
   and a YouTube Short — same core, platform-tuned hooks and captions.

## Quick start

```bash
# Scaffold a new content package from a source video
node repurpose/scripts/repurpose.mjs \
  --title "Build a $200 automation you can sell in a weekend" \
  --source "https://youtube.com/@sabrina_ramonov" \
  --segment agency \
  --slug sell-automations-as-a-service
```

This drops a filled-in template under `repurpose/batch/`. Fill the script beats
(`prompt-library.md` #2), shoot it, then move the row to **Scheduled** in
`content-calendar.md`.

```bash
# Extract clean voiceover-only .txt files (voice tool / teleprompter ready)
node repurpose/scripts/voiceover.mjs --all
```

This regenerates `repurpose/voiceover/**` from each package's Script section —
run it whenever you add or edit a package.

See `content-map.md` for the full backlog and `SYSTEM.md` for the automated
version (new video → drafts in Notion → visuals → scheduled posts).
