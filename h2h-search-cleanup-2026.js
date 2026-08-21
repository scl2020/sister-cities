// H2H mobile/search presentation cleanup.
// Keeps selected team identity above the picker while resetting the picker to its placeholder.
(function refineH2HSearchPresentation(){
  const panel = document.getElementById('tab-h2h');
  if (!panel) return;

  const clearEmptyLabel = (nameEl) => {
    if (nameEl && nameEl.textContent.trim() === 'Select a team') {
      nameEl.textContent = '';
    }
  };

  panel.querySelectorAll('[data-name]').forEach(nameEl => {
    clearEmptyLabel(nameEl);
    new MutationObserver(() => clearEmptyLabel(nameEl)).observe(nameEl, {
      childList: true,
      characterData: true,
      subtree: true
    });
  });

  const clearSearch = (side) => {
    const input = panel.querySelector(`[data-search="${side}"]`);
    if (input) input.value = '';
  };

  // The core H2H click handler runs first and selects the team; this later handler
  // then returns the picker to the neutral "Search team" placeholder.
  panel.addEventListener('click', event => {
    const option = event.target.closest('[data-option-team]');
    if (!option) return;
    clearSearch(option.dataset.optionSide);
  });

  // Keyboard selection should behave the same way as tapping/clicking a team.
  panel.querySelectorAll('.h2h-search').forEach(input => {
    input.addEventListener('keydown', event => {
      if (event.key !== 'Enter') return;
      queueMicrotask(() => { input.value = ''; });
    });
  });
})();
