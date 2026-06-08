/**
 * riddles.js — choose the next unused riddle for the quarter. The bank (with
 * answers) lives privately in Redis, seeded by scripts/seed.mjs.
 */
import { getRiddles, getUsed } from './store.js';

export async function pickNext() {
  const bank = (await getRiddles()) || [];
  if (!bank.length) throw new Error('Riddle bank is empty — run `npm run seed`.');
  const used = await getUsed();
  const pool = bank.filter(r => !used.has(r.id));
  const choices = pool.length ? pool : bank; // if all used this quarter, recycle
  return choices[Math.floor(Math.random() * choices.length)];
}

export async function riddleById(id) {
  const bank = (await getRiddles()) || [];
  return bank.find(r => r.id === id);
}
