// =====================
// SISTER CITIES H2H — TEAM IDENTITY LAYOUT REFINEMENT
// Moves each team name directly beneath its logo without changing search/state logic.
// Keeps the hidden placeholder node in the DOM because the base H2H state code references it.
// =====================

(function refineSisterCitiesH2HLayout(){
  const panel = document.getElementById('tab-h2h');
  if (!panel) return;

  ['left', 'right'].forEach(side => {
    const hero = panel.querySelector(`.h2h-side-${side} .h2h-side-hero`);
    const logoStage = panel.querySelector(`.h2h-side-${side} .h2h-logo-stage`);
    const teamName = panel.querySelector(`.h2h-side-${side} .h2h-team-name`);

    if (!hero || !logoStage || !teamName) return;

    const identity = document.createElement('div');
    identity.className = 'h2h-team-identity';

    identity.appendChild(logoStage);
    identity.appendChild(teamName);

    if (side === 'left') {
      hero.insertBefore(identity, hero.firstChild);
    } else {
      hero.appendChild(identity);
    }
  });
})();
