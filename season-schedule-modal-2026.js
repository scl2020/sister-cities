// =====================
// SISTER CITIES — REGULAR-SEASON SCHEDULE MODAL
// Standings-only interaction for Sleeper seasons 2021–2026.
// Historical seasons show Weeks 1–14. The active 2026 season shows only weeks
// the commissioner has declared complete, growing one week at a time.
// Uses the audited H2H history dataset so winners/losses follow finalized data.
// =====================

(function initSclSeasonScheduleModal(){
  if (window.SCL_SEASON_SCHEDULE_MODAL_INSTALLED) return;
  window.SCL_SEASON_SCHEDULE_MODAL_INSTALLED = true;

  const MIN_YEAR = 2021;
  const MAX_YEAR = 2026;
  const MAX_WEEK = 14;
  const ROOT_ID = 'seasonStandings';
  let lastTrigger = null;

  function activeSeasonYear(){
    const active = document.querySelector('.season-year-button.active');
    const year = active ? Number(active.dataset.season) : NaN;
    return Number.isFinite(year) ? year : null;
  }

  function eligibleYear(year){
    return Number.isInteger(year) && year >= MIN_YEAR && year <= MAX_YEAR;
  }

  function historyGames(){
    const history = window.SISTER_CITIES_H2H_HISTORY;
    return history && Array.isArray(history.games) ? history.games : [];
  }

  function completedWeekFor(year){
    if (year !== 2026) return MAX_WEEK;

    const explicit = Number(window.SCL_2026_COMPLETED_WEEK || 0);
    if (Number.isInteger(explicit) && explicit > 0) return Math.min(MAX_WEEK, explicit);

    const weeks = historyGames()
      .filter(game => Number(game.season) === year)
      .map(game => Number(game.week))
      .filter(week => Number.isInteger(week) && week >= 1 && week <= MAX_WEEK);

    return weeks.length ? Math.max(...weeks) : 0;
  }

  function teamInfo(teamId){
    const fallback = { name: teamId, logo: '' };
    if (typeof TEAMS === 'undefined') return fallback;
    return TEAMS[teamId] || fallback;
  }

  function scheduleFor(year, teamId){
    const byWeek = new Map();
    const finalWeek = completedWeekFor(year);

    historyGames().forEach(game => {
      if (Number(game.season) !== year) return;
      const week = Number(game.week);
      if (!Number.isInteger(week) || week < 1 || week > finalWeek) return;
      if (game.left !== teamId && game.right !== teamId) return;
      byWeek.set(week, game);
    });

    return Array.from({ length: finalWeek }, (_, i) => {
      const week = i + 1;
      const game = byWeek.get(week) || null;
      if (!game) return { week, missing: true };

      const opponentId = game.left === teamId ? game.right : game.left;
      let result = 'TIE';
      if (game.winner === teamId) result = 'WIN';
      else if (game.loser === teamId) result = 'LOSS';

      return { week, game, opponentId, result, missing: false };
    });
  }

  function parseStandingRecord(record){
    const parts = String(record || '').split(/[-–—]/).map(part => part.trim());
    if (parts.length < 2) return null;
    const wins = Number(parts[0]);
    const losses = Number(parts[1]);
    if (!Number.isFinite(wins) || !Number.isFinite(losses)) return null;
    return { wins, losses };
  }

  function auditHistoricalSchedules(){
    const mismatches = [];
    let checked = 0;

    if (typeof seasons === 'undefined') {
      window.SCL_SEASON_SCHEDULE_AUDIT = { passed:false, checked:0, mismatches:['seasons unavailable'] };
      return;
    }

    for (let year = MIN_YEAR; year <= MAX_YEAR; year++) {
      const season = seasons[year];
      if (!season || !Array.isArray(season.standings)) continue;
      if (completedWeekFor(year) < 1) continue;

      season.standings.forEach(row => {
        const expected = parseStandingRecord(row.record);
        if (!expected) return;

        const schedule = scheduleFor(year, row.teamId);
        const actualWins = schedule.filter(item => item.result === 'WIN').length;
        const actualLosses = schedule.filter(item => item.result === 'LOSS').length;
        const missingWeeks = schedule.filter(item => item.missing).map(item => item.week);
        checked++;

        if (actualWins !== expected.wins || actualLosses !== expected.losses || missingWeeks.length) {
          mismatches.push({
            year,
            teamId: row.teamId,
            expected,
            actual: { wins: actualWins, losses: actualLosses },
            missingWeeks
          });
        }
      });
    }

    const history = window.SISTER_CITIES_H2H_HISTORY || {};
    window.SCL_SEASON_SCHEDULE_AUDIT = Object.freeze({
      passed: mismatches.length === 0,
      checked,
      mismatches,
      source: history.source || 'SCL H2H history',
      historyGames: Number(history.gamesCount) || historyGames().length,
      maxWeek: MAX_WEEK,
      completed2026Week: completedWeekFor(2026)
    });

    if (mismatches.length) {
      console.error('SCL season schedule audit mismatch', mismatches);
    }
  }

  function createModal(){
    let overlay = document.getElementById('seasonScheduleModal');
    if (overlay) return overlay;

    overlay = document.createElement('div');
    overlay.id = 'seasonScheduleModal';
    overlay.className = 'season-schedule-modal';
    overlay.setAttribute('aria-hidden', 'true');

    overlay.innerHTML = `
      <div class="season-schedule-card" role="dialog" aria-modal="true" aria-labelledby="seasonScheduleTitle">
        <button class="season-schedule-close" type="button" aria-label="Close schedule">&times;</button>
        <div class="season-schedule-heading">
          <div id="seasonScheduleTitle" class="season-schedule-title">SEASON SCHEDULE</div>
          <div class="season-schedule-subtitle"></div>
        </div>
        <div class="season-schedule-list" role="list"></div>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.addEventListener('click', event => {
      if (event.target === overlay || event.target.closest('.season-schedule-close')) {
        closeModal();
      }
    });

    return overlay;
  }

  function logoMarkup(teamId, side){
    const team = teamInfo(teamId);
    if (!team.logo) return '<span class="season-schedule-logo-spacer" aria-hidden="true"></span>';
    return `<span class="season-schedule-logo-stage ${side}"><img class="season-schedule-logo" src="${team.logo}" alt="" aria-hidden="true"></span>`;
  }

  function rowMarkup(year, teamId, item){
    const clicked = teamInfo(teamId);

    if (item.missing) {
      return `
        <div class="season-schedule-row is-missing" role="listitem">
          <div class="season-schedule-weekline">${year}<span>•</span>WEEK ${item.week}</div>
          <div class="season-schedule-matchup">
            <div class="season-schedule-team left"><span class="season-schedule-team-name">${clicked.name}</span>${logoMarkup(teamId, 'left')}</div>
            <div class="season-schedule-result neutral">—</div>
            <div class="season-schedule-team right"><span class="season-schedule-logo-spacer" aria-hidden="true"></span><span class="season-schedule-team-name">NO MATCHUP</span></div>
          </div>
        </div>
      `;
    }

    const opponent = teamInfo(item.opponentId);
    const resultClass = item.result === 'WIN' ? 'win' : item.result === 'LOSS' ? 'loss' : 'tie';

    return `
      <div class="season-schedule-row" role="listitem" data-week="${item.week}">
        <div class="season-schedule-weekline">${year}<span>•</span>WEEK ${item.week}</div>
        <div class="season-schedule-matchup">
          <div class="season-schedule-team left">
            <span class="season-schedule-team-name">${clicked.name}</span>
            ${logoMarkup(teamId, 'left')}
          </div>
          <div class="season-schedule-result ${resultClass}">${item.result}</div>
          <div class="season-schedule-team right">
            ${logoMarkup(item.opponentId, 'right')}
            <span class="season-schedule-team-name">${opponent.name}</span>
          </div>
        </div>
      </div>
    `;
  }

  function openModal(year, teamId, trigger){
    if (!eligibleYear(year)) return;

    const overlay = createModal();
    const list = overlay.querySelector('.season-schedule-list');
    const subtitle = overlay.querySelector('.season-schedule-subtitle');
    const close = overlay.querySelector('.season-schedule-close');
    const schedule = scheduleFor(year, teamId);

    if (!list || !subtitle || !close) return;

    const finalWeek = completedWeekFor(year);
    subtitle.textContent = year === 2026
      ? `${year} REGULAR SEASON · THROUGH WEEK ${finalWeek}`
      : `${year} REGULAR SEASON · WEEKS 1–14`;
    list.innerHTML = schedule.map(item => rowMarkup(year, teamId, item)).join('');

    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('season-schedule-open');
    lastTrigger = trigger || null;

    requestAnimationFrame(() => {
      list.scrollTop = 0;
      close.focus({ preventScroll:true });
    });
  }

  function closeModal(){
    const overlay = document.getElementById('seasonScheduleModal');
    if (!overlay || !overlay.classList.contains('is-open')) return;

    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('season-schedule-open');

    const focusTarget = lastTrigger;
    lastTrigger = null;
    if (focusTarget && focusTarget.isConnected) {
      requestAnimationFrame(() => focusTarget.focus({ preventScroll:true }));
    }
  }

  function decorateStandings(){
    const root = document.getElementById(ROOT_ID);
    if (!root || typeof seasons === 'undefined') return;

    const year = activeSeasonYear();
    const season = year ? seasons[year] : null;
    const enabled = eligibleYear(year) && completedWeekFor(year) > 0 && season && Array.isArray(season.standings);
    root.classList.toggle('season-schedule-standings-enabled', Boolean(enabled));

    const rows = Array.from(root.querySelectorAll('tbody tr'));
    rows.forEach((tr, index) => {
      const pill = tr.querySelector('.team-pill');
      if (!pill) return;

      pill.classList.remove('season-schedule-trigger');
      pill.removeAttribute('data-schedule-team-id');
      pill.removeAttribute('data-schedule-season');
      pill.removeAttribute('role');
      pill.removeAttribute('tabindex');
      pill.removeAttribute('aria-label');

      if (!enabled) return;
      const standingRow = season.standings[index];
      if (!standingRow) return;

      const team = teamInfo(standingRow.teamId);
      pill.classList.add('season-schedule-trigger');
      pill.dataset.scheduleTeamId = standingRow.teamId;
      pill.dataset.scheduleSeason = String(year);
      pill.setAttribute('role', 'button');
      pill.setAttribute('tabindex', '0');
      pill.setAttribute('aria-label', `View ${team.name} ${year} regular-season schedule`);
    });
  }

  function activateTrigger(trigger){
    if (!trigger || !trigger.classList.contains('season-schedule-trigger')) return;
    const year = Number(trigger.dataset.scheduleSeason);
    const teamId = trigger.dataset.scheduleTeamId;
    if (!eligibleYear(year) || !teamId) return;
    openModal(year, teamId, trigger);
  }

  function wireStandings(){
    const root = document.getElementById(ROOT_ID);
    if (!root) return;

    root.addEventListener('click', event => {
      const trigger = event.target.closest('.season-schedule-trigger');
      if (!trigger || !root.contains(trigger)) return;
      activateTrigger(trigger);
    });

    root.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const trigger = event.target.closest('.season-schedule-trigger');
      if (!trigger || !root.contains(trigger)) return;
      event.preventDefault();
      activateTrigger(trigger);
    });

    new MutationObserver(() => requestAnimationFrame(decorateStandings))
      .observe(root, { childList:true, subtree:true });
  }

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeModal();
  });

  document.addEventListener('click', event => {
    if (event.target.closest('.season-year-button')) {
      requestAnimationFrame(decorateStandings);
    }
  });

  wireStandings();
  decorateStandings();
  auditHistoricalSchedules();
})();
