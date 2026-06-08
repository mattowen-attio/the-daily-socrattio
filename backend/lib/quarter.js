/**
 * quarter.js — quarter boundaries + rollover helpers for the leaderboard reset.
 */
export const ymd = (d = new Date()) => d.toISOString().slice(0, 10);

export function quarterOf(date = new Date()) {
  const y = date.getUTCFullYear();
  const q = Math.floor(date.getUTCMonth() / 3); // 0..3
  const startMonth = q * 3;
  const start = new Date(Date.UTC(y, startMonth, 1));
  const end = new Date(Date.UTC(y, startMonth + 3, 0)); // last day of quarter
  return {
    label: `Q${q + 1} ${y}`,
    quarterStart: ymd(start),
    quarterEnd: ymd(end),
  };
}

/** A fresh, empty leaderboard for the given (or current) quarter. */
export function freshBoard(date = new Date()) {
  const q = quarterOf(date);
  return { quarter: q.label, quarterStart: q.quarterStart, quarterEnd: q.quarterEnd, lastUpdated: ymd(date), players: [] };
}

export const prevYmd = (iso) => {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() - 1);
  return ymd(d);
};
