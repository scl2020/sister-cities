// =====================
// 2026 TEAM IDENTITY UPDATES
// Keeps historical team IDs intact while applying current names/logos site-wide.
// =====================

Object.assign(TEAMS.svetunited, {
  name: "Trablos United",
  logo: "/sister-cities/assets/svetunited.jpg"
});

Object.assign(TEAMS.daddytate, {
  name: "Spidey",
  logo: "/sister-cities/assets/daddytate.jpg"
});

Object.assign(TEAMS.miami, {
  name: "Buy the Dip-hins",
  logo: "/sister-cities/assets/miami.jpg"
});

Object.assign(TEAMS.snorlax, {
  logo: "/sister-cities/assets/snorlax.jpg"
});

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

  // Rebuild Franchise Hub with the current names and logos.
  buildFranchiseGrid();
})();
