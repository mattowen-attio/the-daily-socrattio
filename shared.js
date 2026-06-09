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

// Attio logomark - official PNG at assets/attio-logo.png when present, else a
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

/* ---- "Particle" background: tiny dots drifting upward (a nod to Attio's Particle) ----
 * Theme-aware via the --particle-rgb CSS var. Respects reduced-motion. */
function initParticles() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c = document.createElement('canvas');
  Object.assign(c.style, { position: 'fixed', inset: '0', zIndex: '-1', pointerEvents: 'none' });
  document.body.appendChild(c);
  const ctx = c.getContext('2d');
  let w, h, dpr, parts;
  const colour = () => (getComputedStyle(document.documentElement).getPropertyValue('--particle-rgb').trim() || '150,170,230');
  const spawn = (seed) => ({
    x: Math.random() * w,
    y: seed ? Math.random() * h : h + 8 * dpr,
    r: (Math.random() * 1.5 + 0.5) * dpr,
    sp: (Math.random() * 0.35 + 0.12) * dpr,
    sway: Math.random() * Math.PI * 2,
    swaySp: Math.random() * 0.015 + 0.004,
    a: Math.random() * 0.45 + 0.15,
  });
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = c.width = innerWidth * dpr; h = c.height = innerHeight * dpr;
    c.style.width = innerWidth + 'px'; c.style.height = innerHeight + 'px';
    parts = Array.from({ length: Math.round(Math.min(80, innerWidth / 20)) }, () => spawn(true));
  }
  function frame() {
    ctx.clearRect(0, 0, w, h);
    const col = colour();
    for (const p of parts) {
      p.y -= p.sp; p.sway += p.swaySp;
      if (p.y < -8 * dpr) Object.assign(p, spawn(false));
      ctx.beginPath();
      ctx.fillStyle = `rgba(${col},${p.a})`;
      ctx.arc(p.x + Math.sin(p.sway) * 0.4 * dpr, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    requestAnimationFrame(frame);
  }
  resize();
  addEventListener('resize', resize);
  frame();
}
initParticles();

/* ---- custom Attio-style symbol set (geometric, 24px grid, 2px rounded strokes) ----
 * Replaces generic emoji on the champions page. Inherit `currentColor`, so they
 * take the gold accent. The champion emblem is a geometric crown. */
// champion emblem - a clean geometric crown (gold). Bold, simple, unmistakable.
const ICONS = {
  emblem: `<svg class="sym sym-emblem" viewBox="0 0 64 64" role="img" aria-label="champion crown"><g fill="currentColor"><path d="M11 47 L11 26 L21.5 35.5 L32 16 L42.5 35.5 L53 26 L53 47 Z"/><rect x="9.5" y="45.5" width="45" height="8.5" rx="2.6"/><circle cx="11" cy="23" r="2.5"/><circle cx="32" cy="13" r="2.7"/><circle cx="53" cy="23" r="2.5"/></g></svg>`,
  check: `<svg class="sym" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 12.4l2.6 2.6L16 9"/></svg>`,
  flame: `<svg class="sym" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.7c2.7 3.2 4.8 5.7 4.8 9.1a4.8 4.8 0 0 1-9.6 0c0-1.9.9-3.5 2.1-4.8C10.7 7.8 11.6 6 12 2.7Z"/><path d="M12 13.4c1 1 1.6 1.8 1.6 2.8a1.6 1.6 0 0 1-3.2 0c0-1 .6-1.8 1.6-2.8Z"/></svg>`,
  calendar: `<svg class="sym" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 9.5h17M8 3.2v3.4M16 3.2v3.4"/></svg>`,
  trophy: `<svg class="sym" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.5 4.5h9V8a4.5 4.5 0 0 1-9 0V4.5Z"/><path d="M7.5 5.6H5.3a2 2 0 0 0 2.4 3.1M16.5 5.6h2.2a2 2 0 0 1-2.4 3.1"/><path d="M12 12.5v3M9 19.5l.7-4h4.6l.7 4M8.3 19.5h7.4"/></svg>`,
};

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
    } catch (e) { console.warn('Live API unavailable - using demo data.', e); }
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
