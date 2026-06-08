/* ============ The Daily Socrattio · shared helpers ============
 * Loaded by every page before its page-specific script. Provides DOM helpers,
 * avatars, the logo, the theme toggle, and the data loader (live API + demo fallback).
 */
const $ = (s) => document.querySelector(s);
const el = (t, c, h) => { const e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; };

// Deterministic, pleasant gradient from a name (for initials avatars).
const AV_PALETTE = [
  ['#6e7bff', '#a78bfa'], ['#22d3ee', '#3b82f6'], ['#34d399', '#10b981'],
  ['#f59e0b', '#ef4444'], ['#ec4899', '#8b5cf6'], ['#f5c451', '#f97316'],
  ['#60a5fa', '#818cf8'], ['#2dd4bf', '#06b6d4'], ['#fb7185', '#e11d48'],
];
const hash = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); };
const initials = (name) => name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();

function avatar(person, big) {
  const e = el('div', 'av' + (big ? ' lg' : ''));
  if (person.imageUrl) { e.style.backgroundImage = `url("${person.imageUrl}")`; e.setAttribute('aria-label', person.name); }
  else {
    const [a, b] = AV_PALETTE[hash(person.name) % AV_PALETTE.length];
    e.style.background = `linear-gradient(135deg, ${a}, ${b})`;
    e.textContent = initials(person.name);
  }
  return e;
}

const fmtDate = (iso) => new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

// Attio logomark — official PNG at assets/attio-logo.png when present, else a
// faithful Attio-style mark that adapts to light/dark.
const ATTIO_SVG = `<svg class="attio-mark" viewBox="0 0 100 100" role="img" aria-label="Attio">
  <g transform="rotate(-40 50 50)">
    <rect x="31" y="9" width="28" height="68" rx="13" fill="currentColor"/>
    <rect class="amk-cut" x="40.5" y="33" width="8" height="46" rx="4"/>
  </g>
  <path fill="currentColor" stroke-linejoin="round" stroke="currentColor" stroke-width="6" d="M73 56 L86 81 L57 81 Z"/>
</svg>`;
function mountLogo() {
  const slot = document.getElementById('brandLogo');
  if (!slot) return;
  const img = new Image();
  img.onload = () => { img.className = 'attio-mark'; img.alt = 'Attio'; slot.replaceChildren(img); };
  img.onerror = () => { slot.innerHTML = ATTIO_SVG; };
  img.src = 'assets/attio-logo.png';
}
mountLogo();

async function loadJSON(p) { const r = await fetch(p, { cache: 'no-store' }); if (!r.ok) throw new Error(p); return r.json(); }

// Normalize either the live API or the local demo files into one model shape.
async function loadData() {
  const cfg = await loadJSON('data/config.json');

  if (cfg.apiBase) {
    try {
      const base = cfg.apiBase.replace(/\/$/, '');
      const s = await (await fetch(base + '/api/state', { cache: 'no-store' })).json();
      return {
        cfg, live: true,
        quarter: s.quarter, quarterStart: s.quarterStart, quarterEnd: s.quarterEnd, lastUpdated: s.lastUpdated,
        players: s.players || [], champions: s.hallOfFame || [],
        today: s.today, recent: s.recent || [],
      };
    } catch (e) { console.warn('Live API unavailable — using demo data.', e); }
  }

  // Demo mode: local JSON files.
  const [riddlesDoc, board, schedule, fame] = await Promise.all([
    loadJSON('data/riddles.json'), loadJSON('data/leaderboard.json'),
    loadJSON('data/schedule.json'), loadJSON('data/hall-of-fame.json'),
  ]);
  const riddles = Object.fromEntries(riddlesDoc.riddles.map(r => [r.id, r]));
  const td = schedule.days[0];
  const tr = riddles[td.riddleId];
  return {
    cfg, live: false,
    quarter: board.quarter, quarterStart: board.quarterStart, quarterEnd: board.quarterEnd, lastUpdated: board.lastUpdated,
    players: board.players, champions: fame.champions,
    today: { date: td.date, text: tr.text, difficulty: tr.difficulty, status: td.status, answer: tr.answer },
    recent: schedule.days.filter(d => d.status === 'revealed').slice(0, 4).map(d => {
      const rr = riddles[d.riddleId];
      return { date: d.date, text: rr.text, answer: rr.answer, winners: d.winners || [], correctCount: (d.winners || []).length };
    }),
  };
}

// ---- theme toggle (shared across pages) ----
(() => {
  const btn = $('#themeToggle');
  if (btn) btn.addEventListener('click', () => {
    const root = document.documentElement;
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('riddle-theme', next); } catch {}
  });
  try { const t = localStorage.getItem('riddle-theme'); if (t) document.documentElement.setAttribute('data-theme', t); } catch {}
})();
