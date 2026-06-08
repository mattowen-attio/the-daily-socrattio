/* ============ The Daily Socrattio · front-end ============
 * Renders from a single normalized `model`. When data/config.json has an
 * "apiBase", it fetches live state from the backend (/api/state); otherwise it
 * reads the local demo JSON in data/. Live mode falls back to demo on any error.
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

// Attio logomark — uses the official PNG at assets/attio-logo.png when present,
// otherwise falls back to this faithful Attio-style mark (adapts to light/dark).
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

async function init() {
  let m;
  try { m = await loadData(); } catch (e) { console.error('Data load failed', e); return; }
  const { cfg } = m;
  const players = Object.fromEntries(m.players.map(p => [p.id, p]));

  // ---- header ----
  $('#quarterLabel').textContent = m.quarter;
  const end = new Date(m.quarterEnd + 'T23:59:59');
  const daysLeft = Math.max(0, Math.ceil((end - new Date()) / 86400000));
  $('#daysLeft').textContent = `${daysLeft} days left`;
  $('#updatedLabel').textContent = 'updated ' + fmtDate(m.lastUpdated);
  $('#footNote').textContent = `${cfg.timezoneNote} · resets every quarter`;

  // ---- today's riddle ----
  const t = m.today;
  $('#riddleText').textContent = t.text;
  $('#spRiddle').textContent = t.text;
  $('#riddleDate').textContent = fmtDate(t.date);
  $('#riddleDiff').textContent = t.difficulty || '';
  $('#spTime').textContent = cfg.postTimeUTC + ' UTC';
  $('#riddleCard').classList.add('fade-up');

  if (t.status === 'open') {
    startCountdown(cfg.revealTimeUTC);
  } else {
    $('#statusTag').classList.add('revealed');
    $('#statusTag').innerHTML = '🏆 Revealed';
    $('#revealBlock').style.display = 'none';
    $('#answerReveal').hidden = false;
    $('#answerValue').textContent = t.answer || '—';
  }
  $('#answerBtn').href = cfg.channelUrl || 'https://app.slack.com/client';

  // ---- podium (top 3) ----
  const ranked = [...m.players].sort((a, b) => b.points - a.points);
  const podOrder = [ranked[1], ranked[0], ranked[2]]; // 2nd, 1st, 3rd visually
  const podClass = ['second', 'first', 'third'];
  const podium = $('#podium');
  podOrder.forEach((p, i) => {
    if (!p) return;
    const realRank = ranked.indexOf(p) + 1;
    const card = el('div', `pod ${podClass[i]} fade-up`);
    card.style.animationDelay = (i * 70) + 'ms';
    if (realRank === 1) card.appendChild(el('div', 'crown', '👑'));
    card.appendChild(avatar(p, true));
    card.appendChild(el('div', 'rank-num', `#${realRank}`));
    card.appendChild(el('div', 'pod-name', p.name));
    card.appendChild(el('div', 'pod-pts', `<b>${p.points}</b> pts`));
    podium.appendChild(card);
  });

  // ---- full leaderboard ----
  const list = $('#board-list');
  ranked.forEach((p, i) => {
    const rank = i + 1;
    const row = el('div', `row${rank <= 3 ? ' top' + rank : ''} fade-up`);
    row.style.animationDelay = Math.min(i * 35, 400) + 'ms';
    const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank;
    row.appendChild(el('div', 'rank', String(medal)));
    row.appendChild(avatar(p));
    const who = el('div', 'who');
    who.appendChild(el('div', 'nm', p.name));
    who.appendChild(el('div', 'meta', `${p.daysPlayed} days played`));
    row.appendChild(who);
    const hot = p.streak >= 3;
    row.appendChild(el('div', 'streak' + (hot ? ' hot' : ''), p.streak > 0 ? `${hot ? '🔥' : '·'} ${p.streak} day streak` : ''));
    row.appendChild(el('div', 'pts', `${p.points}<span>pts</span>`));
    list.appendChild(row);
  });

  // ---- recent riddles ----
  const recent = $('#recentList');
  m.recent.forEach(d => {
    const card = el('div', 'rec-card');
    card.appendChild(el('div', 'rc-date', fmtDate(d.date)));
    card.appendChild(el('div', 'rc-q', '"' + d.text + '"'));
    card.appendChild(el('div', 'rc-a', '✓ ' + d.answer));
    const win = el('div', 'rc-win');
    const avs = el('div', 'mini-avs');
    (d.winners || []).slice(0, 5).forEach(id => players[id] && avs.appendChild(avatar(players[id])));
    win.appendChild(avs);
    const n = d.correctCount ?? (d.winners || []).length;
    win.appendChild(document.createTextNode(` ${n} got it right`));
    card.appendChild(win);
    recent.appendChild(card);
  });

  // ---- hall of fame ----
  const fameList = $('#fameList');
  m.champions.forEach(c => {
    const card = el('div', 'fame-card');
    card.appendChild(el('div', 'fc-crown', '👑'));
    card.appendChild(avatar(c, true));
    card.appendChild(el('div', 'fc-q', c.quarter));
    card.appendChild(el('div', 'fc-name', c.name));
    card.appendChild(el('div', 'fc-pts', `${c.points} points · champion`));
    fameList.appendChild(card);
  });
}

// ---- live countdown to reveal time (UTC) ----
function startCountdown(revealUTC) {
  const [h, m] = revealUTC.split(':').map(Number);
  const tick = () => {
    const now = new Date();
    let target = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), h, m, 0));
    if (target <= now) target = new Date(target.getTime() + 86400000);
    const d = target - now;
    const hh = String(Math.floor(d / 3600000)).padStart(2, '0');
    const mm = String(Math.floor((d % 3600000) / 60000)).padStart(2, '0');
    const ss = String(Math.floor((d % 60000) / 1000)).padStart(2, '0');
    const cd = $('#countdown'); if (cd) cd.textContent = `${hh}:${mm}:${ss}`;
  };
  tick(); setInterval(tick, 1000);
}

// ---- theme toggle ----
$('#themeToggle').addEventListener('click', () => {
  const root = document.documentElement;
  const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  root.setAttribute('data-theme', next);
  try { localStorage.setItem('riddle-theme', next); } catch {}
});
try { const t = localStorage.getItem('riddle-theme'); if (t) document.documentElement.setAttribute('data-theme', t); } catch {}

init();
