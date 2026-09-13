// =====================
// SISTER CITIES H2H — CHROME iOS KEYBOARD STABILITY
// Chrome on iPhone can treat the keyboard-shrunken visual viewport as a new
// orientation and can also auto-scroll the page too far upward when focusing
// an input. Scope the fix to CriOS only.
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
  let settleTimers = [];
  let rafPending = false;

  function clearSettleTimers(){
    settleTimers.forEach(timer => clearTimeout(timer));
    settleTimers = [];
  }

  function visualMetrics(){
    const vv = window.visualViewport;
    return {
      vv,
      height: vv ? vv.height : window.innerHeight,
      offsetTop: vv ? vv.offsetTop : 0
    };
  }

  function syncDropdownHeight(){
    if (!focusedSearch) return;

    const { height, offsetTop } = visualMetrics();
    const rect = focusedSearch.getBoundingClientRect();
    const visualBottom = rect.bottom - offsetTop;
    const availableBelow = Math.floor(height - visualBottom - 14);
    const safeHeight = Math.max(118, Math.min(285, availableBelow));

    root.style.setProperty('--scl-crios-options-height', `${safeHeight}px`);
  }

  function settleFocusedSearch(){
    if (!focusedSearch || document.activeElement !== focusedSearch) return;

    const { height, offsetTop } = visualMetrics();
    const rect = focusedSearch.getBoundingClientRect();
    const currentVisualTop = rect.top - offsetTop;

    // Keep the search field in the upper-middle of Chrome's *visible* viewport.
    // That leaves enough real estate underneath it for the dropdown while also
    // overriding Chrome's occasional jump back to the large site header.
    const desiredVisualTop = Math.max(115, Math.min(195, Math.round(height * 0.38)));
    const delta = currentVisualTop - desiredVisualTop;

    if (Math.abs(delta) > 8) {
      window.scrollBy({ top:delta, left:0, behavior:'auto' });
    } else if (window.scrollX !== 0) {
      window.scrollTo({ top:window.scrollY, left:0, behavior:'auto' });
    }

    requestAnimationFrame(syncDropdownHeight);
  }

  function queueSettle(delay){
    const timer = setTimeout(settleFocusedSearch, delay);
    settleTimers.push(timer);
  }

  function onVisualViewportChange(){
    if (!focusedSearch || rafPending) return;
    rafPending = true;
    requestAnimationFrame(() => {
      rafPending = false;
      settleFocusedSearch();
    });
  }

  function enterFocus(input){
    if (blurTimer) {
      clearTimeout(blurTimer);
      blurTimer = null;
    }

    clearSettleTimers();
    focusedSearch = input;
    root.classList.add('scl-crios-h2h-focus');

    // Let Chrome begin its keyboard animation first, then repeatedly pull the
    // focused H2H field back into the correct visible position as the viewport
    // settles. This prevents the browser from leaving the page parked at the
    // giant site header.
    queueSettle(80);
    queueSettle(180);
    queueSettle(320);
    queueSettle(500);
  }

  function leaveFocus(input){
    if (focusedSearch !== input) return;

    blurTimer = setTimeout(() => {
      const active = document.activeElement;
      if (active && active.matches && active.matches('#tab-h2h .h2h-search')) {
        focusedSearch = active;
        return;
      }

      clearSettleTimers();
      focusedSearch = null;
      root.classList.remove('scl-crios-h2h-focus');
      root.style.removeProperty('--scl-crios-options-height');
    }, 140);
  }

  // Capture phase runs before the existing H2H focus handler, so the stable
  // width-based mobile CSS is active before the team list is rendered.
  panel.addEventListener('focus', event => {
    const input = event.target.closest?.('.h2h-search');
    if (input) enterFocus(input);
  }, true);

  panel.addEventListener('blur', event => {
    const input = event.target.closest?.('.h2h-search');
    if (input) leaveFocus(input);
  }, true);

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', onVisualViewportChange, { passive:true });
    window.visualViewport.addEventListener('scroll', onVisualViewportChange, { passive:true });
  }

  window.addEventListener('orientationchange', () => {
    clearSettleTimers();
    root.classList.remove('scl-crios-h2h-focus');
    root.style.removeProperty('--scl-crios-options-height');
    focusedSearch = null;
  }, { passive:true });
})();
