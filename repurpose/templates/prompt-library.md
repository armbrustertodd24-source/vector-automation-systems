# Prompt Library

These are the prompts the automation (or you, by hand) runs to turn a source
video into original repurposed content. They are written to **transform** —
extract the framework, then rebuild it in our voice. They never ask the model to
reproduce the source script.

---

## 1. Extract the framework (not the words)

```
You are a content strategist. Below is a transcript of an AI-automation video.
Do NOT quote or paraphrase it line-by-line. Instead, extract:

1. The single core idea (one sentence).
2. The underlying framework or steps (3–6 bullets, in your own words).
3. The "aha" that makes it shareable.
4. Which of these money-making audiences it best serves (pick 1–2):
   creator · solopreneur · agency · localbiz · beginner — and the specific
   payoff for each.

Transcript:
{{TRANSCRIPT}}
```

## 2. Write the short-form script (per lane)

```
Write an original 35-second short-form video script for {{PLATFORM}} in the
voice of Vector Automation Systems — direct, practical, no hype, speaks to
{{SEGMENT_AUDIENCE}} and how this makes them money.

Base it ONLY on this framework (your own words, not the source's):
{{FRAMEWORK}}

Structure: Hook (3s) → Problem → Insight → How (concrete) → Payoff → CTA.
Constraints: spoken aloud in under 45s; one idea; end with a CTA to book a demo
at vectorautomationsystems.com. Output the script plus 3 alternate hooks.
```

## 3. Platform packaging

```
Given this script, produce:
- A caption for {{PLATFORM}} (≤ 125 chars before the fold, then detail).
- 8–12 hashtags mixing broad (#aiautomation) and niche
  ({{NICHE_TAGS}}).
- 3 on-screen text beats with timestamps.
Always append: "Framework inspired by @sabrina_ramonov 🍄"
```

## 4. Repurpose-safety check (run before posting)

```
Compare this script to the source framework. Flag any sentence that is
substantially identical to how the source phrased it. Rewrite flagged lines so
the idea is preserved but the expression is original. Confirm the credit line is
present.
```

---

### Variables

| Variable | Meaning |
|----------|---------|
| `{{PLATFORM}}` | Instagram Reels / TikTok / YouTube Shorts |
| `{{SEGMENT_AUDIENCE}}` | The audience for the chosen segment (see table below) |
| `{{FRAMEWORK}}` | Output of prompt #1 |
| `{{NICHE_TAGS}}` | Segment-specific tags (see table below) |

### Segment → audience & tags

| Segment | `{{SEGMENT_AUDIENCE}}` | `{{NICHE_TAGS}}` |
|---------|------------------------|------------------|
| creator | content creators growing/monetizing an audience | #contentcreator #faceless #creatoreconomy |
| solopreneur | solo founders & side-hustlers building income | #solopreneur #sidehustle #buildinpublic |
| agency | freelancers/agencies selling automation services | #agencyowner #freelance #servicebusiness |
| localbiz | local & service-business owners (incl. law firms) | #smallbusiness #localbusiness #leadgeneration |
| beginner | total beginners earning their first dollar with AI | #learnai #aiforbeginners #makemoneyonline |
