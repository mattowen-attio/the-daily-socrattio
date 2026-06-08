/**
 * slack.js — thin Slack Web API client + request-signature verification.
 * Signing follows https://docs.slack.dev/authentication/verifying-requests-from-slack
 */
import crypto from 'node:crypto';

const TOKEN = process.env.SLACK_BOT_TOKEN;

/** Call any Slack Web API method with a JSON body. Throws on { ok: false }. */
export async function slack(method, body) {
  const r = await fetch(`https://slack.com/api/${method}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify(body),
  });
  const j = await r.json();
  if (!j.ok) throw new Error(`slack ${method}: ${j.error}`);
  return j;
}

/** HMAC-SHA256 verification of an inbound Slack request. rawBody must be the
 *  unparsed request body string. Rejects requests older than 5 minutes (replay). */
export function verifySlack(rawBody, headers) {
  const ts = headers['x-slack-request-timestamp'];
  const sig = headers['x-slack-signature'];
  const secret = process.env.SLACK_SIGNING_SECRET;
  if (!ts || !sig || !secret) return false;
  if (Math.abs(Date.now() / 1000 - Number(ts)) > 60 * 5) return false;
  const base = `v0:${ts}:${rawBody}`;
  const mine = 'v0=' + crypto.createHmac('sha256', secret).update(base).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(mine), Buffer.from(sig));
  } catch {
    return false;
  }
}

/** Open (or resume) a 1:1 DM and return its channel id. */
export async function dmChannel(userId) {
  const { channel } = await slack('conversations.open', { users: userId });
  return channel.id;
}

/** Display name + avatar for a user. */
export async function userProfile(userId) {
  const { user } = await slack('users.info', { user: userId });
  return { name: user.profile.real_name || user.real_name || user.name, imageUrl: user.profile.image_192 || null };
}
