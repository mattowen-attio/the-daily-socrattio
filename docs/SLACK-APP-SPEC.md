# Slack app spec - "The Daily Socrattio"

Everything the IT team needs to create the Slack app, and everything to hand back
so it can go live. The app is for an internal daily-riddle game in
**#the-daily-socrattio**.

---

## What the app does (plain summary)
- Posts a daily riddle in **#the-daily-socrattio** with a "Submit your answer" button.
- When someone taps the button, it opens a **private form** (a Slack modal); the person's
  answer is sent to our small backend service and stored privately.
- At a set time it posts the answer publicly and **direct-messages each participant** their
  result.
- It does **not** read channel history, files, or anything outside this game.

---

## Easiest path: create from a manifest
In Slack: **api.slack.com/apps → Create New App → From an app manifest →** pick the Attio
workspace → paste this (YAML), then **replace the `request_url`** with the backend URL Matt
provides:

```yaml
display_information:
  name: The Daily Socrattio
  description: Internal daily riddle game - posts a riddle, collects private answers, grades them, and posts results.
  background_color: "#0a0a0f"
features:
  bot_user:
    display_name: The Daily Socrattio
    always_online: true
oauth_config:
  scopes:
    bot:
      - chat:write
      - users:read
      - im:write
settings:
  interactivity:
    is_enabled: true
    request_url: https://REPLACE-WITH-BACKEND-URL/api/interactions
  org_deploy_enabled: false
  socket_mode_enabled: false
  token_rotation_enabled: false
```

(Equivalent to doing it by hand: add the 3 bot scopes under **OAuth & Permissions**, turn on
**Interactivity & Shortcuts** with that Request URL, then install.)

---

## Bot token scopes (the exact, minimal set)
| Scope | Why it's needed |
|---|---|
| `chat:write` | Post the daily riddle, update the "N answered" count, post the answer, and send result DMs |
| `users:read` | Read display names + profile photos for the leaderboard |
| `im:write` | Open a direct message to send each person their result |

No other scopes are required. Specifically **not** needed: message history
(`channels:history`), files, reactions, slash commands, or Events API.

---

## Steps for IT
1. Create the app (manifest above) in the **Attio** workspace.
2. Confirm **Interactivity** is on, with Request URL `https://<backend>/api/interactions`
   (Matt will provide the exact backend URL).
3. **Install the app** to the workspace.
4. **Invite the bot to the channel:** in **#the-daily-socrattio**, type
   `/invite @The Daily Socrattio`.

## What to hand back to Matt
1. **Bot User OAuth Token** - starts with `xoxb-...` (OAuth & Permissions page).
2. **Signing Secret** - Basic Information → App Credentials (used to verify requests are
   genuinely from Slack).
3. Confirmation the app is **installed** and the bot is **in #the-daily-socrattio**.

---

## What Matt provides to wire it up
- The **bot token** + **signing secret** from IT (above).
- The **channel ID** for #the-daily-socrattio (right-click the channel → Copy link → the
  `C0XXXXXXX` in the URL).
- (Handled separately, not IT: a Claude API key for grading + a free Upstash database.)

## Order of operations
1. Matt deploys the backend → produces the URL (e.g. `https://daily-socrattio.vercel.app`).
2. Matt gives IT this spec **with that Request URL filled in**.
3. IT creates + installs the app and returns the token + signing secret.
4. Matt adds those secrets to the backend → it's live (~15 minutes).

## Security notes (for review)
- **Minimal scopes** (3). No access to message history, files, DMs the bot isn't part of,
  or any channel other than where it's invited.
- The app only **posts in #the-daily-socrattio** and **DMs results** to participants.
- Player answers are **private** - collected via the Slack modal, stored in our backend,
  and never posted publicly. Only aggregate scores are shown.
- Every request from Slack is **verified** with the signing secret (HMAC-SHA256).
