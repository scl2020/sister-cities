// Approved 2026 presentation-only standings label refinement.
(function keepConceptCStandingsLabel(){
  const standings = document.getElementById('seasonStandings');
  if (!standings) return;

  const applyLabel = () => {
    const recordHeader = standings.querySelector('.table thead th:nth-child(3)');
    if (recordHeader && recordHeader.textContent !== 'W-L') {
      recordHeader.textContent = 'W-L';
    }
  };

  applyLabel();
  new MutationObserver(applyLabel).observe(standings, {
    childList: true,
    subtree: true
  });
})();
