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

// =====================
// ALL-TIME W-L RECORDS
// Regular season: validated Sleeper H2H matrix, Weeks 1-14, 2021-2025.
// Playoffs: user-verified Weeks 15-17 results, 2021-2025. First-round byes
// are not games and therefore do not count as a win or a loss.
// Historical identities are mapped to their current franchise IDs.
// =====================

const FRANCHISE_PLAYOFF_GAMES_2021_2025 = [
  // 2025
  { season: 2025, winner: "daddytate", loser: "angolarookie" },
  { season: 2025, winner: "drhtown", loser: "snorlax" },
  { season: 2025, winner: "svetunited", loser: "drhtown" },
  { season: 2025, winner: "daddytate", loser: "maleksexcornflex" },
  { season: 2025, winner: "svetunited", loser: "daddytate" },

  // 2024
  { season: 2024, winner: "sixowls", loser: "daddytate" },
  { season: 2024, winner: "abethe3arab", loser: "drhtown" },
  { season: 2024, winner: "abethe3arab", loser: "maleksexcornflex" },
  { season: 2024, winner: "sixowls", loser: "snorlax" },
  { season: 2024, winner: "sixowls", loser: "abethe3arab" },

  // 2023 — Abe1993 / A TEAM is the Miami franchise.
  { season: 2023, winner: "daddytate", loser: "arshamaa" },
  { season: 2023, winner: "sixowls", loser: "abethe3arab" },
  { season: 2023, winner: "sixowls", loser: "angolarookie" },
  { season: 2023, winner: "miami", loser: "daddytate" },
  { season: 2023, winner: "sixowls", loser: "miami" },

  // 2022 — Abe1993 / A TEAM is the Miami franchise.
  { season: 2022, winner: "drhtown", loser: "angolarookie" },
  { season: 2022, winner: "arshamaa", loser: "barjalona" },
  { season: 2022, winner: "arshamaa", loser: "snorlax" },
  { season: 2022, winner: "miami", loser: "drhtown" },
  { season: 2022, winner: "arshamaa", loser: "miami" },

  // 2021 — Abe1993 / A TEAM is the Miami franchise.
  { season: 2021, winner: "miami", loser: "sixowls" },
  { season: 2021, winner: "maleksexcornflex", loser: "angolarookie" },
  { season: 2021, winner: "drhtown", loser: "miami" },
  { season: 2021, winner: "maleksexcornflex", loser: "barjalona" },
  { season: 2021, winner: "maleksexcornflex", loser: "drhtown" }
];

function franchiseRegularSeasonRecord2026(teamId) {
  const matrix = window.SISTER_CITIES_H2H_DATA?.wins;

  // Primary source: validated Sleeper Weeks 1-14 matrix already used by H2H.
  if (matrix && matrix[teamId]) {
    const wins = Object.values(matrix[teamId]).reduce((sum, value) => sum + Number(value || 0), 0);
    const losses = Object.keys(matrix).reduce((sum, opponentId) => {
      if (opponentId === teamId) return sum;
      return sum + Number(matrix[opponentId]?.[teamId] || 0);
    }, 0);

    return { wins, losses };
  }

  // Safe fallback if the H2H data file ever fails to load: sum archived season records.
  let wins = 0;
  let losses = 0;

  Object.keys(seasons).map(Number).forEach(year => {
    if (year < 2021 || year > 2025) return;
    const row = seasons[year]?.standings?.find(entry => entry.teamId === teamId);
    if (!row || !row.record) return;

    const parts = String(row.record).split(/[-–]/).map(part => Number(part.trim()));
    if (parts.length >= 2 && Number.isFinite(parts[0]) && Number.isFinite(parts[1])) {
      wins += parts[0];
      losses += parts[1];
    }
  });

  return { wins, losses };
}

function franchisePlayoffRecord2026(teamId) {
  let wins = 0;
  let losses = 0;

  FRANCHISE_PLAYOFF_GAMES_2021_2025.forEach(game => {
    if (game.winner === teamId) wins += 1;
    if (game.loser === teamId) losses += 1;
  });

  return { wins, losses };
}

function franchiseRecordLabel2026(record) {
  return `${record.wins}-${record.losses}`;
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
  const regularSeasonRecord = franchiseRegularSeasonRecord2026(teamId);
  const playoffRecord = franchisePlayoffRecord2026(teamId);

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
          <div class="franchise-profile-section-title">PLAYOFFS (${franchiseRecordLabel2026(playoffRecord)})</div>
          ${franchiseMetric2026("Championships", championshipCount, titleYears)}
          ${franchiseMetric2026("Appearances", profile.playoffCount, playoffYears)}
          ${franchiseMetric2026("Rate", `${playoffRate}%`, `<span class="franchise-profile-stat-years">(${profile.playoffCount} out of ${seasonCount})</span>`)}
        </section>

        <section class="franchise-profile-section franchise-profile-regular">
          <div class="franchise-profile-section-title">REGULAR SEASON (${franchiseRecordLabel2026(regularSeasonRecord)})</div>
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
