/* ============ Attiani Illustres · champions page ============
 * Lists everyone who has won a season, with their stats. Groups by person so a
 * multi-season champion shows one card with all their crowns. Uses shared.js.
 */
async function initIllustres() {
  let m;
  try { m = await loadData(); } catch (e) { console.error('Data load failed', e); return; }

  // group championship entries by person → career view
  const byId = {};
  (m.champions || []).forEach(c => {
    const g = byId[c.id] || (byId[c.id] = { id: c.id, name: c.name, imageUrl: c.imageUrl, seasons: [], correct: 0, bestStreak: 0, daysPlayed: 0 });
    g.seasons.push(c.quarter);
    g.correct += (c.correct ?? c.points ?? 0);
    g.bestStreak = Math.max(g.bestStreak, c.bestStreak || 0);
    g.daysPlayed += (c.daysPlayed || 0);
  });
  const champs = Object.values(byId).sort((a, b) => b.seasons.length - a.seasons.length || b.correct - a.correct);

  $('#champCount').textContent = `${champs.length} champion${champs.length === 1 ? '' : 's'}`;
  const bc = $('#brandChannel'); if (bc && m.cfg.channelUrl) bc.href = m.cfg.channelUrl;

  const list = $('#champList');
  if (!champs.length) {
    list.appendChild(el('p', 'champ-empty', 'No champions crowned yet - the first quarter is still being written.'));
    return;
  }

  const stat = (icon, value, label) => {
    const s = el('div', 'stat');
    s.appendChild(el('span', 'stat-icon', icon));
    s.appendChild(el('span', 'stat-val', String(value)));
    s.appendChild(el('span', 'stat-label', label));
    return s;
  };

  champs.forEach((c, i) => {
    const card = el('div', 'champ-card fade-up');
    card.style.animationDelay = (i * 70) + 'ms';

    // left - crowned avatar
    const left = el('div', 'champ-face');
    left.appendChild(el('div', 'champ-crown', '👑'));
    left.appendChild(avatar(c, true));
    card.appendChild(left);

    // middle - name + season badges
    const mid = el('div', 'champ-main');
    mid.appendChild(el('div', 'champ-name', c.name));
    const seasonsWrap = el('div', 'champ-seasons');
    seasonsWrap.appendChild(el('span', 'champ-title-tag', c.seasons.length > 1 ? `${c.seasons.length}× champion` : 'champion'));
    c.seasons.forEach(q => seasonsWrap.appendChild(el('span', 'season-badge', q)));
    mid.appendChild(seasonsWrap);
    card.appendChild(mid);

    // right - stats
    const stats = el('div', 'champ-stats');
    stats.appendChild(stat('✅', c.correct, 'correct'));
    stats.appendChild(stat('🔥', c.bestStreak, 'best streak'));
    stats.appendChild(stat('📅', c.daysPlayed, 'days played'));
    stats.appendChild(stat('🏆', c.seasons.length, c.seasons.length === 1 ? 'season' : 'seasons'));
    card.appendChild(stats);

    list.appendChild(card);
  });
}

initIllustres();
