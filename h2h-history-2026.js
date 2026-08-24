// =====================
// SISTER CITIES H2H — MATCHUP HISTORY
// Adds an in-page, collapsible history list beneath the existing H2H comparison.
// Uses Sleeper-backed generated history data and current SCL franchise identities.
// =====================

(function initSisterCitiesH2HHistory(){
  const panel = document.getElementById('tab-h2h');
  const historyData = window.SISTER_CITIES_H2H_HISTORY;
  if (!panel || !historyData || typeof TEAMS === 'undefined') return;

  const shell = panel.querySelector('.h2h-shell');
  const stage = panel.querySelector('.h2h-stage');
  if (!shell || !stage) return;

  const section = document.createElement('section');
  section.className = 'h2h-history';
  section.setAttribute('aria-label', 'Matchup history');
  section.innerHTML = `
    <button
      class="h2h-history-toggle"
      type="button"
      aria-expanded="false"
      aria-controls="h2h-history-roll"
      aria-disabled="true"
    >
      <span>Matchup History</span>
      <svg class="h2h-history-chevron" viewBox="0 0 20 20" aria-hidden="true">
        <path d="M5 7.5l5 5 5-5"></path>
      </svg>
    </button>
    <div class="h2h-history-roll" id="h2h-history-roll" aria-hidden="true">
      <div class="h2h-history-roll-inner">
        <div class="h2h-history-list" data-h2h-history-list></div>
      </div>
    </div>
  `;

  stage.insertAdjacentElement('afterend', section);

  const toggle = section.querySelector('.h2h-history-toggle');
  const roll = section.querySelector('.h2h-history-roll');
  const list = section.querySelector('[data-h2h-history-list]');
  const nameEls = {
    left: panel.querySelector('[data-name="left"]'),
    right: panel.querySelector('[data-name="right"]')
  };

  let selected = { left: null, right: null };
  let isOpen = false;

  function teamIdFromVisibleName(side) {
    const text = nameEls[side]?.textContent?.trim();
    if (!text) return null;

    return Object.keys(TEAMS).find(teamId => {
      return String(TEAMS[teamId]?.name || '').trim() === text;
    }) || null;
  }

  function samePair(game, leftId, rightId) {
    return (
      (game.left === leftId && game.right === rightId) ||
      (game.left === rightId && game.right === leftId)
    );
  }

  function resultFor(teamId, game) {
    if (game.winner === teamId) return 'W';
    if (game.loser === teamId) return 'L';
    return 'T';
  }

  function teamMarkup(side, teamId, winner) {
    const team = TEAMS[teamId] || { name: teamId, logo: '' };
    const logo = team.logo
      ? `<img class="h2h-history-logo" src="${team.logo}" alt="" loading="lazy">`
      : '';

    return `
      <div class="h2h-history-team h2h-history-team-${side}${winner ? ' is-winner' : ''}">
        ${logo}
        <span class="h2h-history-team-name">${team.name || teamId}</span>
      </div>
    `;
  }

  function renderGames() {
    if (!selected.left || !selected.right) {
      list.innerHTML = '';
      return;
    }

    const games = historyData.games
      .filter(game => samePair(game, selected.left, selected.right))
      .sort((a, b) => b.season - a.season || b.week - a.week);

    if (!games.length) {
      list.innerHTML = `<div class="h2h-history-empty">No recorded meetings</div>`;
      return;
    }

    list.innerHTML = games.map((game, index) => {
      const leftWon = game.winner === selected.left;
      const rightWon = game.winner === selected.right;
      const leftResult = resultFor(selected.left, game);
      const rightResult = resultFor(selected.right, game);
      const leftName = TEAMS[selected.left]?.name || selected.left;
      const rightName = TEAMS[selected.right]?.name || selected.right;

      return `
        <article class="h2h-history-game" style="--history-index:${index}">
          <div class="h2h-history-meta">
            <span>${game.season}</span>
            <span class="h2h-history-meta-dot">•</span>
            <span>Week ${game.week}</span>
          </div>
          <div class="h2h-history-match">
            ${teamMarkup('left', selected.left, leftWon)}
            <div class="h2h-history-resultline" aria-label="${leftName} ${leftResult}, ${rightName} ${rightResult}">
              <span class="h2h-history-result is-left">${leftResult}</span>
              <span class="h2h-history-result-separator">–</span>
              <span class="h2h-history-result is-right">${rightResult}</span>
            </div>
            ${teamMarkup('right', selected.right, rightWon)}
          </div>
        </article>
      `;
    }).join('');
  }

  function setOpen(nextOpen) {
    isOpen = Boolean(nextOpen && selected.left && selected.right);
    section.classList.toggle('is-open', isOpen);
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    roll.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
  }

  function syncSelection() {
    const next = {
      left: teamIdFromVisibleName('left'),
      right: teamIdFromVisibleName('right')
    };

    const changed = next.left !== selected.left || next.right !== selected.right;
    selected = next;

    const ready = Boolean(selected.left && selected.right && selected.left !== selected.right);
    toggle.classList.toggle('is-ready', ready);
    toggle.setAttribute('aria-disabled', ready ? 'false' : 'true');

    if (changed) setOpen(false);
    renderGames();
  }

  toggle.addEventListener('click', () => {
    if (!selected.left || !selected.right) return;
    setOpen(!isOpen);
  });

  Object.values(nameEls).forEach(nameEl => {
    if (!nameEl) return;
    new MutationObserver(syncSelection).observe(nameEl, {
      childList:true,
      characterData:true,
      subtree:true
    });
  });

  syncSelection();
})();
