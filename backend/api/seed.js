/**
 * /api/seed - one-time setup: load the riddle bank into Redis and initialise the
 * leaderboard / schedule / hall-of-fame if they don't exist yet. Protected by
 * CRON_SECRET so only you can call it. Run once after the first deploy:
 *
 *   curl -X POST https://<your-backend>/api/seed -H "Authorization: Bearer <CRON_SECRET>"
 *
 * Safe to run again (re-seeds the bank, leaves existing game state untouched).
 */
import { redis, setRiddles } from '../lib/store.js';
import { freshBoard } from '../lib/quarter.js';
import { RIDDLES } from '../lib/riddle-bank.js';

export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) return res.status(401).end();

  await setRiddles(RIDDLES);
  const init = {};
  if (!(await redis.get('leaderboard'))) { await redis.set('leaderboard', freshBoard()); init.leaderboard = true; }
  if (!(await redis.get('schedule')))    { await redis.set('schedule', { days: [] }); init.schedule = true; }
  if (!(await redis.get('hallOfFame')))  { await redis.set('hallOfFame', { people: [] }); init.hallOfFame = true; }

  return res.status(200).json({ ok: true, riddles: RIDDLES.length, initialised: init });
}
