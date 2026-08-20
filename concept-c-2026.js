// Approved 2026 presentation-only standings label refinement.
(function applyConceptCStandingsLabels(){
  const recordHeader = document.querySelector('#seasonStandings .table thead th:nth-child(3)');
  if (recordHeader) recordHeader.textContent = 'W-L';
})();
