/**
 * /api/cron-reveal - runs at reveal time (20:00 UTC). Judges every answer in one
 * batch, awards points, DMs each participant privately, posts a count-only public
 * announcement, updates the leaderboard, and rolls the quarter over when due.
 */
import { slack, dmChannel, userProfile } from '../lib/slack.js';
import { riddleById } from '../lib/riddles.js';
import { judgeBatch, isCorrect } from '../lib/judge.js';
import {
  getCurrent, clearCurrent, getAnswers,
  getBoard, setBoard, getSchedule, setSchedule, getFame, setFame,
} from '../lib/store.js';
import { ymd, prevYmd, quarterOf, freshBoard } from '../lib/quarter.js';

export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) return res.status(401).end();

  const current = await getCurrent();
  if (!current) return res.status(200).json({ skipped: 'nothing open' });

  const today = ymd();
  const riddle = await riddleById(current.riddleId);
  const answers = await getAnswers(current.riddleId);           // { userId: answer }
  const submissions = Object.entries(answers).map(([id, answer]) => ({ id, answer }));

  // 1. judge the whole batch
  const verdicts = submissions.length ? await judgeBatch(riddle, submissions) : {};
  const correct = new Set(submissions.filter(s => isCorrect(verdicts[s.id])).map(s => s.id));

  // 2. quarterly rollover: mint Attios for the top 3 (gold/silver/bronze) + reset
  let board = (await getBoard()) || freshBoard();
  const nowQ = quarterOf();
  if (board.quarter !== nowQ.label) {
    const podium = [...board.players].sort((a, b) => b.points - a.points).slice(0, 3);
    if (podium.length) {
      const fame = await getFame();
      const people = fame.people || [];
      const tiers = ['gold', 'silver', 'bronze'];
      podium.forEach((p, idx) => {
        let person = people.find(x => x.id === p.id);
        if (!person) { person = { id: p.id, name: p.name, imageUrl: p.imageUrl, gold: 0, silver: 0, bronze: 0, correct: 0, bestStreak: 0, daysPlayed: 0, seasons: [] }; people.push(person); }
        person[tiers[idx]] += 1;
        person.correct = p.points; person.bestStreak = Math.max(person.bestStreak, p.bestStreak || 0); person.daysPlayed = p.daysPlayed || person.daysPlayed;
        person.seasons.unshift({ quarter: board.quarter, place: idx + 1 });
      });
      await setFame({ people });
    }
    board = freshBoard();
  }

  // 3. score: everyone who answered counts as having played; points only for correct
  const byId = Object.fromEntries(board.players.map(p => [p.id, p]));
  for (const s of submissions) {
    if (!byId[s.id]) {
      const { name, imageUrl } = await userProfile(s.id);
      byId[s.id] = { id: s.id, name, points: 0, streak: 0, bestStreak: 0, daysPlayed: 0, lastCorrect: null, imageUrl };
      board.players.push(byId[s.id]);
    }
    const p = byId[s.id];
    p.daysPlayed += 1;
    if (correct.has(s.id)) {
      p.points += 1;
      p.streak = p.lastCorrect === prevYmd(today) ? p.streak + 1 : 1;
      p.bestStreak = Math.max(p.bestStreak || 0, p.streak);
      p.lastCorrect = today;
    } else {
      p.streak = 0;
    }
  }
  board.lastUpdated = today;

  // 4. DM each participant their personal result (private)
  for (const s of submissions) {
    const won = correct.has(s.id);
    const dm = await dmChannel(s.id);
    await slack('chat.postMessage', {
      channel: dm,
      text: won
        ? `✅ *Correct!* The answer was *${riddle.answer}*. +1 point - see the board 🏆`
        : `❌ *Not quite.* The answer was *${riddle.answer}*.${verdicts[s.id]?.reason ? ` (${verdicts[s.id].reason})` : ''} Back tomorrow! 🧩`,
    });
  }

  // 5. public announcement: answer + how many got it right (no names)
  await slack('chat.postMessage', {
    channel: current.channel,
    text: `🔓 *Today's answer:* ${riddle.answer}\n\n🧠 *${correct.size} of ${submissions.length}* sleuths got it right today. Standings → the leaderboard 🏆`,
  });

  // 6. persist aggregate state (raw answers stay in Redis, never published)
  const schedule = await getSchedule();
  const day = schedule.days.find(d => d.date === current.date) || schedule.days[0];
  if (day) {
    day.status = 'revealed';
    day.answer = riddle.answer;
    day.answeredCount = submissions.length;
    day.correctCount = correct.size;
    day.winners = [...correct];
  }
  await Promise.all([setBoard(board), setSchedule(schedule), clearCurrent()]);

  return res.status(200).json({ revealed: riddle.id, answered: submissions.length, correct: correct.size });
}
