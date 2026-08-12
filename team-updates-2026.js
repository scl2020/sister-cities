// =====================
// 2026 TEAM IDENTITY UPDATES
// Keeps historical team IDs intact while applying current names/logos site-wide.
// =====================

Object.assign(TEAMS.svetunited, {
  name: "Trablos United",
  logo: "/sister-cities/assets/trablos-united-2026.jpg"
});

Object.assign(TEAMS.daddytate, {
  name: "Spidey",
  logo: "/sister-cities/assets/spidey-logo-v3.jpg"
});

Object.assign(TEAMS.miami, {
  name: "Buy the Dip-hins",
  logo: "/sister-cities/assets/buy-the-diphins-2026.jpg"
});

Object.assign(TEAMS.snorlax, {
  logo: "/sister-cities/assets/snorlax.jpg"
});

Object.assign(TEAMS.maleksexcornflex, {
  name: "Invincibles",
  logo: "/sister-cities/assets/invincibles-logo-2026.jpg"
});

// =====================
// 2026 FRANCHISE HUB ORDER
// Active franchises stay forward; inactive franchises move to the end.
// Team IDs remain unchanged, so each franchise keeps its full profile/stats.
// =====================

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
  "arshamaa",
  "abethe3arab"
);

(function refreshTeamIdentityUI() {
  // Re-render all-time records so historical record holders use current identities.
  renderAllTime(computeAllTime(seasons));

  // Re-render the currently selected season using the updated identities.
  const activeYearButton = document.querySelector(".season-year-button.active");
  const currentYear = activeYearButton ? Number(activeYearButton.dataset.season) : 2025;
  const season = seasons[currentYear];

  if (season) {
    renderChampion(season);

    const standingsEl = document.getElementById("seasonStandings");
    const statsEl = document.getElementById("seasonStats");

    if (standingsEl) standingsEl.innerHTML = renderStandings(season);
    if (statsEl) statsEl.innerHTML = renderStats(season);
  }

  // Rebuild Franchise Hub with the current names, logos, and 2026 board order.
  buildFranchiseGrid();
})();
