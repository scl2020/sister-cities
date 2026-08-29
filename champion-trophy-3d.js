// =====================
// SISTER CITIES — VOLUMETRIC CHAMPION TROPHY
// The source trophy is a single transparent PNG, so a normal rotateY() makes
// it look paper-thin at 90 degrees. This helper builds a shallow 3D extrusion
// from stacked copies of the exact trophy artwork. The stack keeps visible
// thickness through the side view while preserving the original trophy image.
// =====================

(function initSclChampionTrophy3D() {
  if (window.SCL_CHAMPION_TROPHY_3D_INSTALLED) return;
  window.SCL_CHAMPION_TROPHY_3D_INSTALLED = true;

  const LAYER_COUNT = 11;
  const DEPTH_PX = 10;

  function buildTrophyVolume(img) {
    if (!img || img.closest('.champion-trophy-3d')) return;

    const stage = document.createElement('span');
    stage.className = 'champion-trophy-3d';
    stage.setAttribute('role', 'img');
    stage.setAttribute('aria-label', img.alt || 'Trophy');

    const parent = img.parentNode;
    parent.insertBefore(stage, img);
    img.remove();

    for (let i = 0; i < LAYER_COUNT; i += 1) {
      const layer = img.cloneNode(true);
      const z = (-DEPTH_PX / 2) + (DEPTH_PX * i / (LAYER_COUNT - 1));

      layer.classList.add('champion-trophy-layer');
      layer.removeAttribute('loading');
      layer.alt = '';
      layer.setAttribute('aria-hidden', 'true');
      layer.draggable = false;
      layer.style.setProperty('--scl-trophy-z', `${z.toFixed(2)}px`);

      if (i === 0) {
        layer.classList.add('champion-trophy-back');
      } else if (i === LAYER_COUNT - 1) {
        layer.classList.add('champion-trophy-front');
      } else {
        layer.classList.add('champion-trophy-edge');
      }

      stage.appendChild(layer);
    }
  }

  function enhanceTrophies() {
    const championTeam = document.getElementById('championTeam');
    if (!championTeam) return;

    championTeam
      .querySelectorAll('.champion-trophy:not(.champion-trophy-layer)')
      .forEach(buildTrophyVolume);
  }

  function scheduleEnhance() {
    window.requestAnimationFrame(enhanceTrophies);
  }

  enhanceTrophies();

  const championTeam = document.getElementById('championTeam');
  if (championTeam) {
    const observer = new MutationObserver(scheduleEnhance);
    observer.observe(championTeam, { childList: true, subtree: true });
  }
})();
