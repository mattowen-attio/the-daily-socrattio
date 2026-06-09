# 🧩 The Daily Socrattio

*Learn by asking. Answer to climb.*

A daily riddle game for the **#the-daily-socrattio** Slack channel, with a sleek live leaderboard on GitHub Pages. A play on "a daily Socratic" - after Socrates, who taught by asking questions - with **Attio** tucked right inside the name (So‑cr‑**attio**). Crack the daily riddle, climb the board, and get crowned each quarter. 👑

## Branding
The header pairs the **Attio coin** ([`assets/coin-logo.png`](assets/)) with a **Manrope** wordmark tuned to Attio's geometric type, and the channel handle links straight to Slack. Champions are marked with a custom geometric **crown**, and the **Attiani Illustres** page is a Roman-themed hall of fame. Light/dark themes both follow Attio's palette, with a subtle rising-"Particle" background.

**Two parts, both built:** a **static site** (this folder → GitHub Pages, the public
scoreboard) and a **backend** ([`backend/`](backend/) → Vercel, the game engine). The
site runs standalone on demo data today; set `apiBase` in [`data/config.json`](data/config.json)
to your deployed backend to render live data. **The only thing still needed is the Slack bot token.**

---

## How it works

```
  15:00 UTC                                                  20:00 UTC
 ┌──────────┐  tap 🔒 button   ┌─────────────┐  at reveal   ┌──────────────┐
 │ Bot posts│ ───────────────▶ │ private form│ ───────────▶ │ Claude judges│
 │ the riddle│  (modal, in     │ → answer    │              │ all answers  │
 │ + button │   Slack)         │   stored in │              │ → DM each    │
 │          │ ◀─── live "🧠 N  │   Redis     │              │ → announce # │
 └──────────┘    answered"     └─────────────┘              └──────┬───────┘
       │  💬 discuss in thread                                     │ aggregate
       ▼                                                           ▼
   GitHub Pages leaderboard  ◀───────────────────────────  /api/state (no answers)
```

1. **Morning** - the backend posts the riddle with a **"🔒 Submit your answer"** button. People debate in the thread.
2. **Answering** - tapping the button opens a **private form (modal)**; the answer is stored by `user_id` (latest wins → editable, no dupes). The bot edits the message to show a live *"🧠 N answered"* count.
3. **Reveal** - **Claude judges every answer in one batch**, awards a point per correct person, **DMs each player their result privately**, and posts a public announcement: the answer + how many got it right.
4. **Quarterly** the leaderboard resets; the top three earn gold / silver / bronze **Attios** (coins) and join the **Attiani Illustres** hall of fame, ranked by their coin haul.

Nothing is ever public until reveal. Full design, scopes, rate limits, and citations:
**[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)**. Judging rubric: [`backend/lib/judge.js`](backend/lib/judge.js).

## Seasons & Attios
Each quarter is a season. At the reset, the top three finishers are minted an **Attio** - the in-game coin: **gold** for 1st, **silver** for 2nd, **bronze** for 3rd. The **Ascendentes** leaderboard shows the live top-3 as coins, and **Attiani Illustres** (the hall of fame) ranks everyone by their coin haul (gold › silver › bronze). Click any coin to enlarge it and flip through the tiers. Coin art lives in [`assets/`](assets/) (`coin-{gold,silver,bronze}-*.png`).

## Why it looks "done" already
Everything you see - today's riddle, countdown, the private-answer mock, podium, leaderboard, recent riddles, hall of fame - renders from [`data/`](data/) (demo) or the live `/api/state`. That's the pitch: **it already works; it just needs a token.**

## Going live
1. **Deploy the backend** - see [`backend/README.md`](backend/README.md): create an Upstash Redis DB, `npm run seed`, deploy [`backend/`](backend/) to Vercel, set the env vars.
2. **Point the site at it** - set `apiBase` in [`data/config.json`](data/config.json) to your Vercel URL; enable GitHub Pages (Settings → Pages → deploy from `main`, root).
3. **Create the Slack app (last)** - bot scopes `chat:write`, `users:read`, `im:write`, `mpim:write` (`reactions:write` optional); enable Interactivity → Request URL `https://<vercel>/api/interactions`; add the bot to #the-daily-socrattio; drop `SLACK_BOT_TOKEN` + `SLACK_SIGNING_SECRET` into Vercel.

## Project layout
| Path | What |
|---|---|
| `index.html` · `illustres.html` | Home (Hodie / Ascendentes) + the Attiani Illustres hall of fame |
| `app.js` · `illustres.js` · `shared.js` | Page logic + shared helpers (coins, lightbox, data loader) |
| `styles.css` | Attio-themed styling, light + dark |
| `data/*.json` | Demo data: riddles, leaderboard, schedule, `hall-of-fame` (coin ledger), `config` |
| `assets/` | Coin art (gold/silver/bronze), logo, favicons |
| `backend/api/` | `interactions` (button→modal→store), `cron-post`, `cron-reveal`, `state` |
| `backend/lib/` | `slack`, `store` (Redis), `judge`, `blocks`, `riddles`, `quarter` |
| `backend/scripts/seed.mjs` | Load the riddle bank into Redis |
| `docs/ARCHITECTURE.md` | Full design + cited Slack docs |

## Run the site locally
```bash
python3 -m http.server 8000   # from this folder, then open http://localhost:8000
```
