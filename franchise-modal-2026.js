// =====================
// 2026 FRANCHISE PROFILE MODAL
// Detailed sports-media presentation for Franchise Hub team profiles only.
// =====================

function franchiseChampionshipYears2026(teamId) {
  return Object.keys(seasons)
    .map(Number)
    .filter(year => seasons[year] && seasons[year].championTeamId === teamId)
    .sort((a, b) => a - b);
}

function franchiseParticipationYears2026(teamId) {
  const years = new Set();

  Object.keys(seasons).map(Number).forEach(year => {
    const season = seasons[year];
    if (!season) return;

    if (Array.isArray(season.standings) && season.standings.some(row => row.teamId === teamId)) {
      years.add(year);
    }

    // Archived seasons can still prove participation when the champion is known.
    if (season.championTeamId === teamId) {
      years.add(year);
    }
  });

  return Array.from(years).sort((a, b) => a - b);
}

function franchiseYearsLabel2026(years) {
  if (!years.length) return "—";

  const allYears = Object.keys(seasons).map(Number);
  const latestYear = Math.max(...allYears);
  const first = years[0];
  const last = years[years.length - 1];

  if (last === latestYear) return `${first}-Present`;
  if (first === last) return String(first);
  return `${first}–${last}`;
}

function franchiseInlineYears2026(years) {
  return years && years.length
    ? `<span class="franchise-profile-stat-years">(${years.join(", ")})</span>`
    : "";
}

function franchiseMetric2026(label, value, yearsMarkup = "") {
  return `
    <div class="franchise-profile-stat">
      <div class="franchise-profile-stat-label">${label}</div>
      <div class="franchise-profile-stat-value"><span class="franchise-profile-stat-main">${value}</span> ${yearsMarkup}</div>
    </div>
  `;
}

openFranchiseModal = function(teamId) {
  const modal = document.getElementById("franchiseModal");
  const card = modal ? modal.querySelector(".franchise-modal-card") : null;
  const t = TEAMS[teamId];

  if (!modal || !card || !t) return;

  const profile = computeFranchiseProfile(teamId);
  const championshipYears = franchiseChampionshipYears2026(teamId);
  const participationYears = franchiseParticipationYears2026(teamId);
  const championshipCount = championshipYears.length;
  const stars = championshipCount ? "★".repeat(championshipCount) : "";

  const seasonCount = participationYears.length;
  const playoffRate = seasonCount
    ? Math.round((profile.playoffCount / seasonCount) * 100)
    : 0;

  const playoffYears = franchiseInlineYears2026(profile.playoffYears);
  const titleYears = franchiseInlineYears2026(championshipYears);
  const firstSeedYears = franchiseInlineYears2026(profile.firstSeedYears);
  const bestRecordYears = franchiseInlineYears2026(profile.bestRecordYears);
  const bestFinishYears = franchiseInlineYears2026(profile.bestFinishYears);

  const bestRecord = profile.bestRecord || "—";
  const bestFinish = profile.bestFinish ? ordinal(profile.bestFinish) : "—";

  // Trablos United is the current identity beginning in 2025.
  // Match the capitalization/style used by every other active franchise.
  const identityYearsLabel = teamId === "svetunited"
    ? "2025-Present"
    : franchiseYearsLabel2026(participationYears);

  card.innerHTML = `
    <div class="franchise-profile-shell">
      <div class="franchise-profile-identity">
        <div class="franchise-profile-stars">${stars || "&nbsp;"}</div>
        <div class="franchise-profile-logoWrap">
          <img class="franchise-profile-logo" src="${t.logo}" alt="${t.name} logo">
        </div>
        <div class="franchise-profile-name">${t.name}</div>
        <div class="franchise-profile-owner">${t.owner ? `Owner: ${t.owner}` : ""}</div>
        <div class="franchise-profile-years">${identityYearsLabel}</div>
      </div>

      <div class="franchise-profile-columns">
        <section class="franchise-profile-section franchise-profile-playoffs">
          <div class="franchise-profile-section-title">PLAYOFFS</div>
          ${franchiseMetric2026("Championships", championshipCount, titleYears)}
          ${franchiseMetric2026("Appearances", profile.playoffCount, playoffYears)}
          ${franchiseMetric2026("Rate", `${playoffRate}%`, `<span class="franchise-profile-stat-years">(${profile.playoffCount} out of ${seasonCount})</span>`)}
        </section>

        <section class="franchise-profile-section franchise-profile-regular">
          <div class="franchise-profile-section-title">REGULAR SEASON</div>
          ${franchiseMetric2026("#1 Seed", profile.firstSeedCount, firstSeedYears)}
          ${franchiseMetric2026("Best Season Record", bestRecord, bestRecordYears)}
          ${franchiseMetric2026("Best Finish in the Season", bestFinish, bestFinishYears)}
        </section>
      </div>
    </div>
  `;

  modal.style.display = "flex";
  modal.setAttribute("aria-hidden", "false");
};
