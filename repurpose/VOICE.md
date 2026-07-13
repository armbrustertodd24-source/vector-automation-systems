# Narrate in Your Own Voice

Put *your* voice on the repurposed videos instead of a generic AI voice. This is
the narration stage of the pipeline — it turns each clean `voiceover/*.txt`
script into an `.mp3` spoken in your cloned voice.

> **Consent rule:** only clone a voice you have the right to use — your own, or
> someone who has explicitly permitted it. Don't clone Sabrina's or anyone
> else's voice; her permission covers *content*, not her likeness/voice.

## One-time setup

1. **Record a sample.** 1–3 minutes of clean speech (quiet room, consistent
   mic). Read naturally — the clone inherits your pace and energy.
2. **Clone it.** In [ElevenLabs](https://elevenlabs.io) → Voices →
   *Instant Voice Clone* (or *Professional Voice Clone* for best quality). Upload
   the sample; it produces a **voice ID**.
   - *Alternative:* [fal.ai](https://fal.ai) also hosts TTS/voice models (same
     platform as the `nano-banana-pro` image model). Swap the endpoint in
     `scripts/narrate.mjs` if you prefer to keep everything on fal.
3. **Set your keys** (never commit these):
   ```bash
   export ELEVENLABS_API_KEY=sk_...
   export ELEVEN_VOICE_ID=<your cloned voice id>
   # optional: export ELEVEN_MODEL_ID=eleven_multilingual_v2
   ```

## Run it

```bash
# One script
node repurpose/scripts/narrate.mjs repurpose/voiceover/2026-week-01/01-ai-chatbot-lead-followup.txt

# Every script
node repurpose/scripts/narrate.mjs --all
```

Output lands in `repurpose/audio/<week>/<slug>.mp3`, mirroring the voiceover
folders. Those `.mp3`s are git-ignored (they're regenerable binaries) — keep the
scripts in version control, not the audio.

## Where it fits

```
package .md → voiceover .txt (voiceover.mjs) → YOUR voice .mp3 (narrate.mjs)
            → lay under nano-banana-pro visuals → animate → captions → schedule
```

## Tuning

In `narrate.mjs`, `voice_settings`:
- `stability` (0–1): higher = steadier/flatter, lower = more expressive/variable.
- `similarity_boost` (0–1): how tightly it hugs your original sample.
- `style` (0–1): exaggeration of your speaking style; keep low for clean reads.

Do a one-line test before batch-running 11 files so you like the settings.
