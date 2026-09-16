// =====================
// SISTER CITIES — STANDINGS STATUS MARKERS
// 1) Marks the previous season's champion in the following season's standings.
// 2) Marks seeds 1-6 as playoff positions for every standings table from 2021 on.
// Both markers are presentation-only and follow the rendered standings each year.
// =====================

(function initDefendingChampionStandingsRibbon(){
  if (window.SCL_DEFENDING_CHAMP_STANDINGS_INSTALLED) return;
  window.SCL_DEFENDING_CHAMP_STANDINGS_INSTALLED = true;

  if (typeof renderStandings !== 'function' || typeof seasons === 'undefined') return;

  const originalRenderStandings = renderStandings;
  const PLAYOFF_START_YEAR = 2021;
  const PLAYOFF_SEEDS = 6;

  const ribbonMarkup = `
    <span class="defending-champ-ribbon" role="img" aria-label="Defending champion" title="Defending champion">
      <svg viewBox="0 0 28 36" aria-hidden="true" focusable="false">
        <path d="M7.5 16.5 6.2 33l7.8-5.6 7.8 5.6-1.3-16.5Z" fill="#C9922A"/>
        <path d="M8.6 17.2 8 29.4l6-4.2 6 4.2-.6-12.2Z" fill="#E7B84C"/>
        <circle cx="14" cy="11.5" r="10" fill="#D39B2A"/>
        <circle cx="14" cy="11.5" r="8.15" fill="#F3CF62" stroke="#FFE69A" stroke-width="1.2"/>
        <circle cx="14" cy="11.5" r="6.45" fill="#E8B943"/>
        <path d="M8.8 7.1c1.35-2.1 3.45-3.15 5.8-3.15" fill="none" stroke="#FFF6CB" stroke-width="1.5" stroke-linecap="round" opacity=".95"/>
        <path d="M5.1 3.1 6.25 5.7 8.9 6.8 6.25 7.9 5.1 10.5 4 7.9 1.4 6.8 4 5.7Z" fill="#FFF" opacity=".95"/>
      </svg>
    </span>
  `;

  function getSeasonYear(season){
    const explicit = Number(season?.year);
    if (Number.isInteger(explicit)) return explicit;

    const match = Object.keys(seasons).find(year => seasons[year] === season);
    const resolved = Number(match);
    return Number.isInteger(resolved) ? resolved : null;
  }

  function standingsTeamPill(teamId, isDefendingChampion){
    const t = TEAMS[teamId] || { name: teamId, owner: '', logo: '' };
    const logo = t.logo
      ? `<img class="logo-img" src="${t.logo}" alt="${t.name} logo" loading="lazy">`
      : '';

    return `
      <span class="team-pill standings-team-pill${isDefendingChampion ? ' is-defending-champion' : ''}">
        <span class="standings-team-logo-anchor">
          ${isDefendingChampion ? ribbonMarkup : ''}
          <span class="logo-dot">${logo}</span>
        </span>
        <span class="team-pill-text">${t.name}</span>
      </span>
    `;
  }

  function seedMarkup(seed, showPlayoffMarker){
    if (!showPlayoffMarker) return String(seed);

    return `
      <span class="standings-playoff-seed-wrap">
        <span class="standings-playoff-accent" aria-hidden="true"></span>
        <span class="standings-seed-number">${seed}</span>
      </span>
    `;
  }

  function standingsLegendMarkup(showPlayoffLegend){
    if (!showPlayoffLegend) return '';

    return `
      <div class="standings-status-legend" aria-label="Standings markers">
        <div class="standings-status-legend-item standings-status-playoffs">
          <span class="standings-playoff-accent standings-legend-playoff-accent" aria-hidden="true"></span>
          <span class="standings-status-legend-text">Playoffs</span>
        </div>

        <div class="standings-status-legend-item standings-status-defending">
          <span class="standings-legend-ribbon-wrap" aria-hidden="true">${ribbonMarkup}</span>
          <span class="standings-status-legend-text">Defending champion</span>
        </div>
      </div>
    `;
  }

  renderStandings = function(season){
    if (!season || !Array.isArray(season.standings)) {
      return originalRenderStandings(season);
    }

    const year = getSeasonYear(season);
    const defendingChampionId = year && seasons[year - 1]
      ? seasons[year - 1].championTeamId
      : null;
    const showPlayoffMarkers = Boolean(year && year >= PLAYOFF_START_YEAR);

    const rows = season.standings.map(r => {
      const isPlayoffSeed = showPlayoffMarkers && Number(r.seed) >= 1 && Number(r.seed) <= PLAYOFF_SEEDS;

      return `
        <tr${isPlayoffSeed ? ' class="is-playoff-position"' : ''}>
          <td${isPlayoffSeed ? ' class="playoff-seed-cell"' : ''}>${seedMarkup(r.seed, isPlayoffSeed)}</td>
          <td>${standingsTeamPill(r.teamId, Boolean(defendingChampionId && r.teamId === defendingChampionId))}</td>
          <td>${r.record}</td>
          <td>${r.pf.toFixed(2)}</td>
          <td>${r.pa.toFixed(2)}</td>
        </tr>
      `;
    }).join('');

    return `
      <table class="table" aria-label="Season standings">
        <thead>
          <tr>
            <th>Seed</th>
            <th>Team</th>
            <th>Record</th>
            <th>PF</th>
            <th>PA</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      ${standingsLegendMarkup(showPlayoffMarkers)}
    `;
  };
})();
