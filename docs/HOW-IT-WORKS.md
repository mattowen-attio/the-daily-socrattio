# The Daily Socrattio - how it works

## In one line
A daily riddle game in **#the-daily-socrattio**: people answer **privately**, an AI grades
them **fairly**, and a live leaderboard + seasonal coins keep it fun. The website is
already built and live - the only thing left is a Slack bot so it can post and read answers.

## The daily loop (what people experience)
1. **Morning** - a riddle is posted in the channel with a **"Submit your answer"** button.
2. **Banter in the thread, answer in private** - people can discuss in the thread, but they
   submit their real answer through a private pop-up form that only they can see.
3. **Live momentum** - the riddle message shows a running count ("14 answered") so people
   can see it's active, without anyone's guess being revealed.
4. **Evening reveal** - everyone who got it right scores a point. Each person gets a
   **private DM** telling them if they were right or wrong (so no one feels silly in public).
5. **Public announcement** - the channel gets the correct answer + how many people got it.
6. **Leaderboard + seasons** - the board updates daily and resets each quarter (a "season").
   The top three each season earn **gold / silver / bronze coins ("Attios")** and a place in
   the **Attiani Illustres** hall of fame.

## Why we need a Slack "bot token"
- A bot token is simply a **secure key** that lets a small app act in Slack on our behalf:
  post the riddle, show the answer form, read the submitted answers, and send result DMs.
- Our website is hosted on **GitHub Pages**, which can only *display* pages - it can't post
  to Slack or read replies. Slack requires an **approved app + token** to do that.
- **Without the token:** it's a polished demo (what you're seeing today).
  **With the token:** it goes fully live and runs itself every day, no manual work.

## What Slack actually does (the answering bit)
- **Posts** the daily riddle with the Submit button.
- When someone taps Submit, Slack shows them a **private form** and passes our app just
  **their name + their typed answer** - no one else can see it.
- **Stores** each person's latest answer (they can edit it until the deadline; no duplicates).
- At reveal, our app sends the answers to **Claude (AI)** to grade - lenient on typos and
  synonyms, strict on genuinely wrong answers, and everyone judged by the same standard.
- Slack then **DMs each person** their result and **posts** the public answer + count.

## Privacy and what we're asking to approve
- Answers are **never visible to other players**. They go only to a small secure service;
  the public website only ever stores **aggregate scores**, never raw answers.
- The Slack app needs a **minimal, standard set of permissions**:
  - `chat:write` - post messages and send DMs
  - `users:read` - read display names + profile photos (for the leaderboard)
  - `im:write` - open a direct message to send results
- That's the whole ask. No access to other channels, files, or message history beyond this game.

## Status
- ✅ **Built and live:** the full website - riddle, private-answer flow, leaderboard,
  seasons, coins, hall of fame (all visible in the demo).
- ✅ **Built, waiting:** the backend "engine" that talks to Slack and grades answers.
- ⏳ **Needs approval:** a Slack app + bot token in the Attio workspace. Once approved,
  it's about **15 minutes** to go live.

## Cost
- **Hosting:** free tiers (GitHub Pages + a small Vercel service + a free database).
- **AI grading:** a few cents per day (one small request at reveal time).
