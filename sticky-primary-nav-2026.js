// Sister Cities 2026 — deterministic primary-nav locking.
// The league masthead scrolls away naturally; the primary nav locks once it reaches the viewport top.
(function lockPrimaryNav(){
  const nav = document.querySelector('.site-tab-nav');
  if (!nav) return;

  const spacer = document.createElement('div');
  spacer.className = 'site-tab-nav-spacer';
  spacer.setAttribute('aria-hidden', 'true');
  nav.insertAdjacentElement('afterend', spacer);

  let navTop = 0;
  let navHeight = 0;
  let ticking = false;

  function setFixed(shouldFix){
    if (shouldFix) {
      nav.classList.add('is-fixed');
      spacer.style.height = `${navHeight}px`;
    } else {
      nav.classList.remove('is-fixed');
      spacer.style.height = '0px';
    }
  }

  function measure(){
    const wasFixed = nav.classList.contains('is-fixed');

    if (wasFixed) {
      nav.classList.remove('is-fixed');
      spacer.style.height = '0px';
    }

    const rect = nav.getBoundingClientRect();
    navHeight = rect.height;
    navTop = rect.top + window.scrollY;

    setFixed(window.scrollY >= navTop);
  }

  function update(){
    setFixed(window.scrollY >= navTop);
    ticking = false;
  }

  function requestUpdate(){
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  }

  window.addEventListener('scroll', requestUpdate, { passive:true });
  window.addEventListener('resize', () => window.requestAnimationFrame(measure));
  window.addEventListener('orientationchange', () => window.setTimeout(measure, 120));
  window.addEventListener('load', measure, { once:true });

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(measure).catch(() => {});
  }

  measure();
})();
