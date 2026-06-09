# The Daily Socrattio - backend

The game engine: receives Slack button/modal events, stores answers privately,
posts + reveals on a schedule, judges with Claude, and serves aggregate data to the
static site. Runs on **Vercel** (serverless) with **Upstash Redis** for state.

Everything here works **once the Slack bot token is added** - that's the final step.

## What's inside
```
api/
  interactions.js   Slack Request URL - button → modal (views.open), submit → store + live count (chat.update)
  cron-post.js      posts the daily riddle with the button         (cron: 15:00 UTC)
  cron-reveal.js    judges, DMs results, announces, updates board   (cron: 20:00 UTC)
  state.js          PUBLIC read-only API the site fetches (never exposes unrevealed answers)
lib/
  slack.js   judge.js   store.js   blocks.js   riddles.js   quarter.js
scripts/
  seed.mjs          loads the riddle bank into Redis
```

## Why a backend (and not just GitHub Pages)
Slack sends button/modal events to a live HTTPS URL and replies must come back within
**3 seconds** - a static site can't do that, and it can't safely hold the bot token or
store private answers. So this small service holds the secrets + Redis; the public
repo only ever sees **aggregate** data via `/api/state`.

## Deploy (≈15 min, no local tooling needed)
1. **Redis** - create a free [Upstash](https://upstash.com) Redis database; copy its
   REST URL + token.
2. **Deploy to Vercel** - in the Vercel dashboard, **Add New → Project → import this repo**,
   set **Root Directory = `backend`**, and add the env vars from [`.env.example`](.env.example)
   (Upstash URL/token, `ANTHROPIC_API_KEY`, `CRON_SECRET`, `SITE_ORIGIN`). Deploy.
   *(Slack vars can be left blank for now - they're added once the bot token exists.)*
3. **Seed the database (once)** - hit the protected seed endpoint:
   ```bash
   curl -X POST https://<your-backend>.vercel.app/api/seed -H "Authorization: Bearer <CRON_SECRET>"
   ```
   (Or, if you have Node locally, `npm install && npm run seed`.)
4. **Point the site at it** - set `apiBase` in `../data/config.json` to your Vercel URL.
5. **Slack app (last)** - see [`../docs/SLACK-APP-SPEC.md`](../docs/SLACK-APP-SPEC.md). Bot
   scopes `chat:write`, `users:read`, `im:write`; **Interactivity → Request URL**
   `https://<your-backend>/api/interactions`; invite the bot to **#the-daily-socrattio**;
   then add `SLACK_BOT_TOKEN`, `SLACK_SIGNING_SECRET`, `SLACK_CHANNEL_ID` in Vercel.

## Scheduling note
`vercel.json` defines the 15:00 / 20:00 UTC crons. Vercel's Hobby plan limits cron
frequency - if that's a constraint, leave the endpoints and trigger them from any free
scheduler (e.g. cron-job.org or a GitHub Action) with an
`Authorization: Bearer $CRON_SECRET` header instead.

## Privacy of answers ⚠️
The riddle bank (with answers) and every submission live **only in Redis** - never in
the public Pages repo. `seed.mjs` reads `../data/riddles.json` for convenience; before
real scoring, keep the canonical bank private (or strip answers from the public copy).
`/api/state` withholds the current answer until the riddle is revealed.

## Data model (Redis keys)
`riddles` · `used` (set) · `riddle:current` · `answers:<riddleId>` (hash user→answer) ·
`leaderboard` · `schedule` · `hallOfFame`. See [`lib/store.js`](lib/store.js).
