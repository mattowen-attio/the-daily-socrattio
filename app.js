/* ============ The Daily Socrattio · home page ============
 * Renders the riddle (Hodie) + leaderboard (Ascendentes) + recent + champions teaser.
 * Shared helpers (avatar, loadData, theme, logo) come from shared.js.
 */
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
    $('#answerValue').textContent = t.answer || '-';
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
    if (realRank === 1) card.appendChild(el('div', 'crown', ICONS.emblem));
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

  // ---- Illustres teaser (links to the full champions page) ----
  const fameList = $('#fameList');
  m.champions.slice(0, 3).forEach(c => {
    const card = el('a', 'fame-card');
    card.href = 'illustres.html';
    card.appendChild(el('div', 'fc-crown', ICONS.emblem));
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

init();
