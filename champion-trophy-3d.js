// =====================
// SISTER CITIES — SMOOTH VOLUMETRIC CHAMPION TROPHY
// The source is still the exact transparent trophy.png, but the side volume is
// no longer made from repeated visible copies. Front/back use the artwork;
// the body depth is a shaded silhouette shell, so side views look solid.
// =====================

(function initSclChampionTrophy3D() {
  if (window.SCL_CHAMPION_TROPHY_3D_INSTALLED) return;
  window.SCL_CHAMPION_TROPHY_3D_INSTALLED = true;

  const SHELL_SLICES = 17;
  const DEPTH_PX = 12;

  function metallicColor(index) {
    const t = index / (SHELL_SLICES - 1);
    const center = 1 - Math.abs((t * 2) - 1);
    const lightness = 25 + (center * 24);
    const saturation = 42 + (center * 10);
    return `hsl(36 ${saturation.toFixed(0)}% ${lightness.toFixed(0)}%)`;
  }

  function buildTrophyVolume(img) {
    if (!img || img.closest('.champion-trophy-3d')) return;

    const src = img.currentSrc || img.src;
    if (!src) return;

    const stage = document.createElement('span');
    stage.className = 'champion-trophy-3d';
    stage.setAttribute('role', 'img');
    stage.setAttribute('aria-label', img.alt || 'Trophy');
    stage.style.setProperty('--scl-trophy-mask', `url("${src}")`);

    const parent = img.parentNode;
    parent.insertBefore(stage, img);
    img.remove();

    // Smooth metallic depth shell. Each slice contains only the alpha silhouette
    // of the trophy, not the trophy details, eliminating the accordion effect.
    for (let i = 0; i < SHELL_SLICES; i += 1) {
      const slice = document.createElement('span');
      const z = (-DEPTH_PX / 2) + (DEPTH_PX * i / (SHELL_SLICES - 1));

      slice.className = 'champion-trophy-shell-slice';
      slice.setAttribute('aria-hidden', 'true');
      slice.style.setProperty('--scl-trophy-z', `${z.toFixed(2)}px`);
      slice.style.setProperty('--scl-trophy-metal', metallicColor(i));
      slice.style.maskImage = `url("${src}")`;
      slice.style.webkitMaskImage = `url("${src}")`;
      stage.appendChild(slice);
    }

    const back = img.cloneNode(true);
    back.className = `${img.className} champion-trophy-face champion-trophy-back`;
    back.removeAttribute('loading');
    back.alt = '';
    back.setAttribute('aria-hidden', 'true');
    back.draggable = false;
    stage.appendChild(back);

    const front = img.cloneNode(true);
    front.className = `${img.className} champion-trophy-face champion-trophy-front`;
    front.removeAttribute('loading');
    front.alt = '';
    front.setAttribute('aria-hidden', 'true');
    front.draggable = false;
    stage.appendChild(front);
  }

  function enhanceTrophies() {
    const championTeam = document.getElementById('championTeam');
    if (!championTeam) return;

    championTeam
      .querySelectorAll('.champion-trophy:not(.champion-trophy-face)')
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
