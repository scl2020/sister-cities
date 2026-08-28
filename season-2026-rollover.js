// =====================
// SISTER CITIES — 2026 SEASON ROLLOVER
// Adds the 2026 season, the Deez Nutterz expansion franchise, and makes 2026
// the default Season view without altering completed-season historical metrics.
// =====================

(function initScl2026SeasonRollover() {
  if (window.SCL_2026_ROLLOVER_INSTALLED) return;
  window.SCL_2026_ROLLOVER_INSTALLED = true;

  // New 2026 franchise. Sleeper user: deeznutterz.
  TEAMS.deeznutterz = {
    name: "Deez Nutterz",
    owner: "IbrahimA",
    logo: "/sister-cities/assets/deez-nutterz-2026-hq-v3.webp?v=20260828g"
  };

  // 2026 begins with the nine returning franchises from 2025 plus Deez Nutterz.
  // Preseason standings intentionally start at 0-0 / 0.00 PF / 0.00 PA.
  seasons[2026] = {
    year: 2026,
    inProgress: true,
    championTeamId: null,
    championNote: "",
    showTrophyOnly: true,
    standings: [
      { teamId: "svetunited",        seed: 1,  record: "0–0", pf: 0, pa: 0 },
      { teamId: "maleksexcornflex",  seed: 2,  record: "0–0", pf: 0, pa: 0 },
      { teamId: "snorlax",           seed: 3,  record: "0–0", pf: 0, pa: 0 },
      { teamId: "daddytate",         seed: 4,  record: "0–0", pf: 0, pa: 0 },
      { teamId: "angolarookie",      seed: 5,  record: "0–0", pf: 0, pa: 0 },
      { teamId: "drhtown",           seed: 6,  record: "0–0", pf: 0, pa: 0 },
      { teamId: "sixowls",           seed: 7,  record: "0–0", pf: 0, pa: 0 },
      { teamId: "miami",             seed: 8,  record: "0–0", pf: 0, pa: 0 },
      { teamId: "barjalona",         seed: 9,  record: "0–0", pf: 0, pa: 0 },
      { teamId: "deeznutterz",       seed: 10, record: "0–0", pf: 0, pa: 0 }
    ],
    seasonStats: []
  };

  // The current 2026 table proves that a franchise is active, but preseason
  // seed positions and 0-0 records must not rewrite completed historical honors.
  const getTeamSeasonRowsBefore2026 = getTeamSeasonRows;
  getTeamSeasonRows = function(teamId) {
    return getTeamSeasonRowsBefore2026(teamId)
      .filter(row => !seasons[row.year]?.inProgress);
  };

  // For the live 2026 Champion card, keep the trophy presentation but leave
  // the champion team/logo/name empty until a champion actually exists.
  const renderChampionBefore2026 = renderChampion;
  renderChampion = function(season) {
    if (season && season.showTrophyOnly && !season.championTeamId) {
      const elTeam = document.getElementById("championTeam");
      const elNote = document.getElementById("championNote");
      if (!elTeam || !elNote) return;

      elTeam.innerHTML = `
        <div class="champion-trophy-row" style="display:flex; gap:8px; justify-content:center; align-items:center;">
          <img class="champion-trophy" src="${TROPHY_SRC}" alt="Trophy" loading="lazy">
        </div>
      `;
      elNote.textContent = "";
      return;
    }

    renderChampionBefore2026(season);
  };

  // Active 2026 clubs first; historical/inactive franchises remain available
  // in the Franchise Hub after the current league field.
  FRANCHISE_RANDOM_ORDER.splice(
    0,
    FRANCHISE_RANDOM_ORDER.length,
    "sixowls",
    "miami",
    "drhtown",
    "barjalona",
    "svetunited",
    "angolarookie",
    "daddytate",
    "maleksexcornflex",
    "snorlax",
    "deeznutterz",
    "arshamaa",
    "abethe3arab"
  );

  // Keep completed-season playoff rates intact while 2026 is still in progress.
  // Deez Nutterz gets the normal current-franchise presentation (0 out of 1).
  const openFranchiseModalBefore2026 = openFranchiseModal;
  openFranchiseModal = function(teamId) {
    openFranchiseModalBefore2026(teamId);

    const playoffSection = document.querySelector(
      ".franchise-modal-card .franchise-profile-playoffs"
    );
    if (!playoffSection) return;

    const rateRow = Array.from(
      playoffSection.querySelectorAll(".franchise-profile-stat")
    ).find(row =>
      row.querySelector(".franchise-profile-stat-label")?.textContent.trim().toUpperCase() === "RATE"
    );
    if (!rateRow) return;

    const valueEl = rateRow.querySelector(".franchise-profile-stat-value");
    if (!valueEl) return;

    const profile = computeFranchiseProfile(teamId);
    const participationYears = franchiseParticipationYears2026(teamId);
    const completedSeasonCount = participationYears
      .filter(year => !seasons[year]?.inProgress)
      .length;
    const denominator = completedSeasonCount || participationYears.length;
    const playoffRate = denominator
      ? Math.round((profile.playoffCount / denominator) * 100)
      : 0;

    valueEl.innerHTML = `
      <span class="franchise-profile-stat-main">${playoffRate}%</span>
      <span class="franchise-profile-stat-years">(${profile.playoffCount} out of ${denominator})</span>
    `;
  };

  // Recompute metadata with 2026 present, rebuild the Hub, and open the site on
  // the new season. The 2026 button is part of index.html before script.js wires
  // the standard season-button behavior, so it behaves exactly like prior years.
  renderAllTime(computeAllTime(seasons));
  buildFranchiseGrid();

  document.querySelectorAll(".season-year-button").forEach(button => {
    button.classList.toggle("active", button.dataset.season === "2026");
  });

  renderSeason({ currentYear: 2026 });
})();
