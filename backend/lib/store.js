/**
 * store.js - all game state lives in Upstash Redis (private). Raw answers NEVER
 * touch the public GitHub Pages repo; only aggregate state is exposed via /api/state.
 *
 * Keys:
 *   riddles                  → full riddle bank (array, incl. answers) - seeded once
 *   used                     → Set of riddle ids already played this quarter
 *   riddle:current           → { riddleId, channel, ts, date } for the open riddle
 *   answers:<riddleId>       → Hash userId → answer text (latest wins = editable)
 *   leaderboard              → { quarter, quarterStart, quarterEnd, lastUpdated, players[] }
 *   schedule                 → { days: [...] }   (aggregate log shown on the site)
 *   hallOfFame               → { people: [...] }  (coin ledger: gold/silver/bronze per person)
 */
import { Redis } from '@upstash/redis';

export const redis = Redis.fromEnv(); // reads UPSTASH_REDIS_REST_URL / _TOKEN

export const getRiddles = () => redis.get('riddles');
export const setRiddles = (r) => redis.set('riddles', r);

export const getUsed = async () => new Set((await redis.smembers('used')) || []);
export const markUsed = (id) => redis.sadd('used', id);
export const clearUsed = () => redis.del('used');

export const getCurrent = () => redis.get('riddle:current');
export const setCurrent = (c) => redis.set('riddle:current', c);
export const clearCurrent = () => redis.del('riddle:current');

export const saveAnswer = (riddleId, userId, answer) => redis.hset(`answers:${riddleId}`, { [userId]: answer });
export const getAnswer = (riddleId, userId) => redis.hget(`answers:${riddleId}`, userId);
export const getAnswers = async (riddleId) => (await redis.hgetall(`answers:${riddleId}`)) || {};
export const answerCount = (riddleId) => redis.hlen(`answers:${riddleId}`);

export const getBoard = () => redis.get('leaderboard');
export const setBoard = (b) => redis.set('leaderboard', b);

export const getSchedule = async () => (await redis.get('schedule')) || { days: [] };
export const setSchedule = (s) => redis.set('schedule', s);

export const getFame = async () => (await redis.get('hallOfFame')) || { people: [] };
export const setFame = (f) => redis.set('hallOfFame', f);
