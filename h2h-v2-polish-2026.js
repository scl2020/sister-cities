// =====================
// SISTER CITIES H2H — V2 POLISH
// Approved motion + mobile focus behavior layered over the existing H2H engine.
// =====================

(function polishSisterCitiesH2H(){
  const panel = document.getElementById('tab-h2h');
  if (!panel) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobilePortrait = window.matchMedia('(max-width: 720px) and (orientation: portrait)');

  /* Remove the old explanatory note from the accessibility tree as well as visually. */
  const note = panel.querySelector('[data-note]');
  if (note) {
    note.textContent = '';
    note.setAttribute('aria-hidden', 'true');
  }

  /* Logo fade/scale entrance whenever a new selected logo is written by the core H2H code. */
  panel.querySelectorAll('.h2h-team-logo').forEach(logo => {
    const replay = () => {
      if (logo.hidden || !logo.getAttribute('src')) return;
      logo.classList.remove('h2h-logo-enter');
      // Force animation restart when swapping directly from one team to another.
      void logo.offsetWidth;
      logo.classList.add('h2h-logo-enter');
    };

    new MutationObserver(replay).observe(logo, {
      attributes:true,
      attributeFilter:['src','hidden']
    });
  });

  /* Count win totals up from zero whenever a completed matchup updates. */
  panel.querySelectorAll('.h2h-win-number').forEach(el => {
    let frame = 0;
    let internalValue = null;

    const writeInternal = value => {
      internalValue = String(value);
      el.textContent = internalValue;
    };

    const observer = new MutationObserver(() => {
      const raw = el.textContent.trim();

      // Ignore mutations created by this animation itself while still allowing a
      // new external H2H selection to interrupt and start a fresh count-up.
      if (internalValue !== null && raw === internalValue) {
        internalValue = null;
        return;
      }

      if (!/^\d+$/.test(raw)) return;

      const target = Number(raw);
      cancelAnimationFrame(frame);

      if (reduceMotion.matches || target <= 0) return;

      const duration = 420;
      const started = performance.now();
      writeInternal(0);

      const tick = now => {
        const progress = Math.min(1, (now - started) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        writeInternal(Math.round(target * eased));

        if (progress < 1) {
          frame = requestAnimationFrame(tick);
        } else {
          writeInternal(target);
        }
      };

      frame = requestAnimationFrame(tick);
    });

    observer.observe(el, { childList:true, characterData:true, subtree:true });
  });

  /* On iPhone, keep the focused search control centered in the remaining visible
     viewport after the keyboard opens. The core H2H focus handler still opens
     the dropdown immediately, so users can either scroll the list or type. */
  let activeSearch = null;
  let centerTimer = 0;

  const centerActiveSearch = (behavior = 'smooth') => {
    if (!activeSearch || document.activeElement !== activeSearch || !mobilePortrait.matches) return;

    const rect = activeSearch.getBoundingClientRect();
    const viewport = window.visualViewport;
    const visibleTop = viewport ? viewport.offsetTop : 0;
    const visibleHeight = viewport ? viewport.height : window.innerHeight;
    const desiredCenter = visibleTop + (visibleHeight / 2);
    const actualCenter = rect.top + (rect.height / 2);
    const delta = actualCenter - desiredCenter;

    if (Math.abs(delta) > 8) {
      window.scrollBy({ top: delta, left: 0, behavior });
    }
  };

  const scheduleCenter = () => {
    clearTimeout(centerTimer);
    centerTimer = window.setTimeout(() => centerActiveSearch('smooth'), 120);
  };

  panel.querySelectorAll('.h2h-search').forEach(input => {
    input.addEventListener('focus', () => {
      if (!mobilePortrait.matches) return;
      activeSearch = input;

      // One pass as focus starts, then another after iOS has resized for its keyboard.
      requestAnimationFrame(() => centerActiveSearch('auto'));
      window.setTimeout(() => centerActiveSearch('smooth'), 320);
    });

    input.addEventListener('blur', () => {
      if (activeSearch === input) activeSearch = null;
      clearTimeout(centerTimer);
    });
  });

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', scheduleCenter);
    window.visualViewport.addEventListener('scroll', scheduleCenter);
  }
})();
