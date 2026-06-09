/* ============ Attiani Illustres · the coin ledger ============
 * Everyone who has finished top-3 in a season, ranked by their Attios
 * (gold = 1st, silver = 2nd, bronze = 3rd). Uses shared.js.
 */
async function initIllustres() {
  let m;
  try { m = await loadData(); } catch (e) { console.error('Data load failed', e); return; }

  const champs = [...(m.champions || [])].sort(rankByCoins);
  const totalCoins = champs.reduce((n, c) => n + (c.gold || 0) + (c.silver || 0) + (c.bronze || 0), 0);

  $('#champCount').textContent = `${totalCoins} ${m.currency || 'Attios'} minted`;
  const bc = $('#brandChannel'); if (bc && m.cfg.channelUrl) bc.href = m.cfg.channelUrl;
  const heroCrown = $('.ih-crown'); if (heroCrown) heroCrown.innerHTML = ICONS.emblem;

  const list = $('#champList');
  if (!champs.length) {
    list.appendChild(el('p', 'champ-empty', 'No champions crowned yet - the first season is still being written.'));
    return;
  }

  const place = (p) => (p === 1 ? '1st' : p === 2 ? '2nd' : '3rd');

  champs.forEach((c, i) => {
    const card = el('div', 'champ-card fade-up');
    card.style.animationDelay = (i * 70) + 'ms';

    // left - crowned avatar
    const left = el('div', 'champ-face');
    left.appendChild(el('div', 'champ-crown', ICONS.emblem));
    left.appendChild(avatar(c, true));
    card.appendChild(left);

    // middle - name, title tag, season badges, stat line
    const mid = el('div', 'champ-main');
    mid.appendChild(el('div', 'champ-name', c.name));
    const seasonsWrap = el('div', 'champ-seasons');
    const tag = c.gold > 0 ? (c.gold > 1 ? `${c.gold}× champion` : 'champion') : 'podium finisher';
    seasonsWrap.appendChild(el('span', 'champ-title-tag', tag));
    (c.seasons || []).forEach(s => seasonsWrap.appendChild(el('span', `season-badge place-${s.place}`, `${s.quarter} · ${place(s.place)}`)));
    mid.appendChild(seasonsWrap);
    mid.appendChild(el('div', 'champ-stat-line', `${c.correct} correct · ${c.bestStreak} best streak · ${c.daysPlayed} days played`));
    card.appendChild(mid);

    // right - the coin cabinet (click a coin to enlarge)
    card.appendChild(coinHaul(c, { interactive: true }));

    list.appendChild(card);
  });
}

initIllustres();
