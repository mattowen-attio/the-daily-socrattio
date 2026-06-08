/**
 * /api/cron-post — posts the daily riddle (Vercel Cron fires this at 15:00 UTC;
 * an external scheduler can also hit it with the CRON_SECRET bearer token).
 * Picks an unused riddle, posts it with the Submit button + live counter, and
 * records it as the open riddle.
 */
import { slack } from '../lib/slack.js';
import { pickNext } from '../lib/riddles.js';
import { getCurrent, setCurrent, markUsed, getSchedule, setSchedule } from '../lib/store.js';
import { riddleMessage } from '../lib/blocks.js';
import { ymd } from '../lib/quarter.js';

const REVEAL = process.env.REVEAL_TIME_UTC || '20:00';

export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) return res.status(401).end();

  const today = ymd();
  const current = await getCurrent();
  if (current?.date === today) return res.status(200).json({ skipped: 'already posted today' });

  const riddle = await pickNext();
  const posted = await slack('chat.postMessage', {
    channel: process.env.SLACK_CHANNEL_ID,
    ...riddleMessage({ riddle, count: 0, revealTime: REVEAL }),
  });

  await setCurrent({ riddleId: riddle.id, channel: posted.channel, ts: posted.ts, date: today });
  await markUsed(riddle.id);

  const schedule = await getSchedule();
  schedule.days.unshift({ date: today, riddleId: riddle.id, status: 'open', answeredCount: 0, correctCount: 0, winners: [] });
  await setSchedule(schedule);

  return res.status(200).json({ posted: riddle.id, ts: posted.ts });
}
