// =====================
// 2020 ARCHIVED SEASON
// ESPN archive: champion is known, but standings/stats are unavailable.
// =====================

seasons[2020] = {
  year: 2020,
  championTeamId: "drhtown",
  championNote: "",
  archived: true,
  archiveMessage: "Season archived on ESPN. No standings or stats available.",
  standings: [],
  seasonStats: []
};

// Dr. H-Town's 2020 playoff appearance is known from the archived season,
// even though the full 2020 standings are not available on this site.
const ARCHIVED_PLAYOFF_YEARS = {
  drhtown: [2020]
};

const renderSeasonWithFullData = renderSeason;

renderSeason = function(state) {
  const season = seasons[state.currentYear];
  const detailsCard = document.getElementById("seasonDetailsCard");
  const archiveNotice = document.getElementById("archivedSeasonNotice");

  if (season && season.archived) {
    renderChampion(season);

    if (detailsCard) detailsCard.style.display = "none";

    if (archiveNotice) {
      archiveNotice.textContent = season.archiveMessage;
      archiveNotice.style.display = "block";
    }

    return;
  }

  if (detailsCard) detailsCard.style.display = "";
  if (archiveNotice) archiveNotice.style.display = "none";

  renderSeasonWithFullData(state);
};

const computeFranchiseProfileWithFullData = computeFranchiseProfile;

computeFranchiseProfile = function(teamId) {
  const profile = computeFranchiseProfileWithFullData(teamId);
  const archivedYears = ARCHIVED_PLAYOFF_YEARS[teamId] || [];

  if (!archivedYears.length) return profile;

  const playoffYears = Array.from(
    new Set([...archivedYears, ...profile.playoffYears])
  ).sort((a, b) => a - b);

  return {
    ...profile,
    playoffCount: playoffYears.length,
    playoffYears
  };
};

// Recompute season metadata now that 2020 exists and rebuild the Hub so
// Dr. H-Town immediately receives the championship star.
renderAllTime(computeAllTime(seasons));
buildFranchiseGrid();
