/**
 * seed.mjs — load the riddle bank into Redis (run once, and again when you add
 * riddles). Initialises an empty leaderboard / schedule / hall-of-fame if absent.
 *
 *   UPSTASH_REDIS_REST_URL=... UPSTASH_REDIS_REST_TOKEN=... npm run seed
 *
 * Reads the bank from ../../data/riddles.json for convenience. IMPORTANT: before
 * running real scoring, keep the bank PRIVATE — once seeded, the backend reads
 * riddles (and answers) from Redis, so the answers never need to sit in the
 * public Pages repo. Strip answers from the public copy or move the bank out.
 */
import { readFile } from 'node:fs/promises';
import { redis, setRiddles } from '../lib/store.js';
import { freshBoard } from '../lib/quarter.js';

const { riddles } = JSON.parse(await readFile(new URL('../../data/riddles.json', import.meta.url)));
await setRiddles(riddles);
console.log(`✓ Seeded ${riddles.length} riddles into Redis.`);

if (!(await redis.get('leaderboard'))) { await redis.set('leaderboard', freshBoard()); console.log('✓ Initialised an empty leaderboard for this quarter.'); }
if (!(await redis.get('schedule')))    { await redis.set('schedule', { days: [] }); console.log('✓ Initialised the schedule log.'); }
if (!(await redis.get('hallOfFame')))  { await redis.set('hallOfFame', { champions: [] }); console.log('✓ Initialised the hall of fame.'); }

console.log('Done. The backend is ready — add the Slack bot token last.');
