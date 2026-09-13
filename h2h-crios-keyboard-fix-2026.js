// =====================
// SISTER CITIES H2H — CHROME iOS ORIENTATION GUARD
// Chrome on iPhone can temporarily stop matching portrait-only media queries
// while the keyboard is open. We only tag CriOS so CSS can keep the approved
// mobile H2H geometry. No scrolling, viewport manipulation, or focus movement.
// =====================

(function initCriOSH2HKeyboardFix(){
  const ua = navigator.userAgent || '';
  const isCriOS = /CriOS/i.test(ua) && /iPhone|iPad|iPod/i.test(ua);
  if (!isCriOS) return;
  document.documentElement.classList.add('scl-crios');
})();
