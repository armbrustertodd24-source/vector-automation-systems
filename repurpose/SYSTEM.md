# The Automation Pipeline

This turns the manual workflow into a repeatable system: a new Sabrina video
becomes a batch of platform-ready drafts in your content calendar, with visuals,
ready for a 10-minute human approval before scheduling.

You already have the integrations connected for every stage (Make, Notion,
Canva, Gamma, Google Drive). This doc is the blueprint; the live build is the
next step — see "Build status" at the bottom.

## Flow

```
 ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
 │ 1. TRIGGER   │──▶│ 2. EXTRACT   │──▶│ 3. GENERATE  │──▶│ 4. REVIEW    │
 │ new video    │   │ transcript + │   │ scripts +    │   │ Notion board │
 │ (RSS/manual) │   │ framework    │   │ captions     │   │ (human edit) │
 └──────────────┘   └──────────────┘   └──────────────┘   └──────┬───────┘
                                                                  │ approve
                                          ┌──────────────┐   ┌────▼─────────┐
                                          │ 6. PUBLISH   │◀──│ 5. VISUALS   │
                                          │ IG/TT/YT     │   │ Canva/Gamma  │
                                          │ (scheduled)  │   │ + voice/video│
                                          └──────────────┘   └──────────────┘
```

## Stage by stage

| # | Stage | Tool (you have it) | What happens |
|---|-------|--------------------|--------------|
| 1 | Trigger | Make (YouTube/RSS watch) or manual | Fires when Sabrina posts, or when you paste a URL. |
| 2 | Extract | Make + transcript API | Pull transcript; run **prompt #1** → one-sentence idea + framework. |
| 3 | Generate | Make + Claude (Anthropic) | Run **prompts #2–#4** per lane → 1 niche + 1 general package, each with Reel/TikTok/Short variants. |
| 4 | Review | **Notion** content-calendar DB | Drafts land as cards (Status = Review). You edit voice, pick the hook. |
| 5 | Visuals | **Canva** / **Gamma** | Auto-generate the cover frame, on-screen-text slides, optional AI voice/video. |
| 6 | Publish | **Blotato** / Make scheduler | Approved cards (Status = Scheduled) post to IG Reels, TikTok, YT Shorts. |

## Notion content-calendar DB (proposed schema)

| Property | Type | Notes |
|----------|------|-------|
| Title | Title | Video hook |
| Slug | Text | Matches the batch filename |
| Lane | Select | `niche` / `general` |
| Source | URL | Sabrina video |
| Platforms | Multi-select | Reels / TikTok / Shorts |
| Status | Status | Draft → Review → Scheduled → Posted |
| Script | Text | From prompt #2 |
| Caption | Text | Ends with credit line |
| Post date | Date | Drives the scheduler |
| Asset | Files | Canva/Gamma export |

The credit line `Framework inspired by @sabrina_ramonov 🍄` is enforced in the
prompt-3 template and re-checked in prompt-4, so it can't be dropped.

## Why human-in-the-loop at stage 4 (non-negotiable)

- **Voice:** auto-drafts read generic; the 10-min edit is what makes them *yours*.
- **Repurpose-safety:** the prompt-4 check flags any line too close to the source.
- **Accuracy:** you're claiming these systems to PI buyers — facts get a human check.

## Build status

The blueprint and the manual workflow (scripts + first batch) are **done and in
this repo**. The live automation touches your external accounts (Notion DB, Make
scenario, Blotato connection), so I haven't created anything in them yet.

**To stand up the live pipeline, say the word and I'll, in order:**
1. Create the Notion content-calendar database with the schema above.
2. Build the Make scenario for stages 1–3 (trigger → extract → generate → write to Notion).
3. Wire Canva/Gamma for stage 5 and the scheduler for stage 6.

Each step is reversible and I'll confirm before touching a connected account.
