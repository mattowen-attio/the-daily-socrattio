/**
 * /api/state — the only PUBLIC, read-only endpoint. The static GitHub Pages site
 * fetches this to render live data. It deliberately never exposes the current
 * answer until the riddle is revealed, and never exposes anyone's submission.
 */
import { riddleById } from '../lib/riddles.js';
import { getBoard, getFame, getSchedule, getCurrent, answerCount } from '../lib/store.js';
import { freshBoard } from '../lib/quarter.js';

const REVEAL = process.env.REVEAL_TIME_UTC || '20:00';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.SITE_ORIGIN || '*');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const [board, fame, schedule, current] = await Promise.all([getBoard(), getFame(), getSchedule(), getCurrent()]);
  const b = board || freshBoard();

  // today's riddle — text is public; the answer is withheld until revealed
  let today = null;
  if (current) {
    const riddle = await riddleById(current.riddleId);
    today = { date: current.date, status: 'open', text: riddle?.text, difficulty: riddle?.difficulty,
              answeredCount: await answerCount(current.riddleId), revealTime: REVEAL };
  } else {
    const last = schedule.days?.[0];
    if (last) {
      const riddle = await riddleById(last.riddleId);
      today = { date: last.date, status: 'revealed', text: riddle?.text, difficulty: riddle?.difficulty,
                answer: last.answer, answeredCount: last.answeredCount, correctCount: last.correctCount };
    }
  }

  const recent = await Promise.all(
    (schedule.days || []).filter(d => d.status === 'revealed').slice(0, 4).map(async d => {
      const riddle = await riddleById(d.riddleId);
      return { date: d.date, text: riddle?.text, answer: d.answer, answeredCount: d.answeredCount, correctCount: d.correctCount, winners: d.winners || [] };
    })
  );

  return res.status(200).json({
    quarter: b.quarter, quarterStart: b.quarterStart, quarterEnd: b.quarterEnd, lastUpdated: b.lastUpdated,
    players: b.players || [],
    hallOfFame: fame?.champions || [],
    today,
    recent,
  });
}
