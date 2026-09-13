// =====================
// SISTER CITIES H2H — CHROME iOS KEYBOARD STABILITY
// Chrome on iPhone can treat the keyboard-shrunken visual viewport as a new
// orientation. That temporarily drops portrait-only H2H CSS and makes the H2H
// board jump into desktop geometry. Scope the fix to CriOS only.
// =====================

(function initCriOSH2HKeyboardFix(){
  const ua = navigator.userAgent || '';
  const isCriOS = /CriOS/i.test(ua) && /iPhone|iPad|iPod/i.test(ua);
  if (!isCriOS) return;

  const root = document.documentElement;
  const panel = document.getElementById('tab-h2h');
  if (!panel) return;

  root.classList.add('scl-crios');

  let focusedSearch = null;
  let blurTimer = null;

  function syncVisibleViewport(){
    const vv = window.visualViewport;
    if (!vv) return;

    // Keep dropdown height inside Chrome's actual visible area. The list opens
    // upward while focused, so roughly 42% of the visual viewport is comfortable
    // without covering the H2H identity row.
    const available = Math.max(150, Math.min(285, Math.round(vv.height * 0.42)));
    root.style.setProperty('--scl-crios-options-height', `${available}px`);

    // Chrome may retain a tiny horizontal visual-viewport offset during focus.
    // Do not allow that transient offset to become a horizontal page scroll.
    if (focusedSearch && Math.abs(vv.offsetLeft) > 0.5 && window.scrollX !== 0) {
      window.scrollTo({ left:0, top:window.scrollY, behavior:'auto' });
    }
  }

  function enterFocus(input){
    if (blurTimer) {
      clearTimeout(blurTimer);
      blurTimer = null;
    }

    focusedSearch = input;
    root.classList.add('scl-crios-h2h-focus');
    syncVisibleViewport();

    // Chrome's keyboard animation can resize the visual viewport across several
    // frames. Re-sync after those stages instead of letting the layout settle on
    // an intermediate geometry.
    requestAnimationFrame(syncVisibleViewport);
    setTimeout(syncVisibleViewport, 90);
    setTimeout(syncVisibleViewport, 220);
    setTimeout(syncVisibleViewport, 420);
  }

  function leaveFocus(input){
    if (focusedSearch !== input) return;

    // Delay slightly because selecting a dropdown option briefly moves focus.
    blurTimer = setTimeout(() => {
      const active = document.activeElement;
      if (active && active.matches && active.matches('#tab-h2h .h2h-search')) {
        focusedSearch = active;
        return;
      }

      focusedSearch = null;
      root.classList.remove('scl-crios-h2h-focus');
      root.style.removeProperty('--scl-crios-options-height');
    }, 140);
  }

  // Capture-phase listeners run before the H2H input's existing focus handler,
  // so the stable mobile class is already active before the dropdown is opened.
  panel.addEventListener('focus', event => {
    const input = event.target.closest?.('.h2h-search');
    if (input) enterFocus(input);
  }, true);

  panel.addEventListener('blur', event => {
    const input = event.target.closest?.('.h2h-search');
    if (input) leaveFocus(input);
  }, true);

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', syncVisibleViewport, { passive:true });
    window.visualViewport.addEventListener('scroll', syncVisibleViewport, { passive:true });
  }

  window.addEventListener('orientationchange', () => {
    root.classList.remove('scl-crios-h2h-focus');
    focusedSearch = null;
    setTimeout(syncVisibleViewport, 160);
  }, { passive:true });
})();
