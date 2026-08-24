// =====================
// SISTER CITIES — TEAM LOGO PRESENTATION POLICY
// Free-form clubs keep their native crest silhouette everywhere on the site.
// Existing circular treatment remains untouched for all other clubs.
// =====================

(function initSclTeamLogoPolicy(){
  if (typeof TEAMS === 'undefined') return;

  const FREEFORM_TEAM_IDS = new Set([
    'miami',
    'barjalona',
    'maleksexcornflex',
    'snorlax'
  ]);

  const WRAPPER_SELECTORS = [
    '.logo-dot',
    '.franchise-logoWrap',
    '.franchise-modal-logoWrap',
    '.franchise-profile-logoWrap',
    '.h2h-logo-stage',
    '.h2h-option-logo'
  ];

  const wrapperSelector = WRAPPER_SELECTORS.join(',');

  function normalizedPath(value) {
    if (!value) return '';
    try {
      return new URL(value, window.location.href).pathname;
    } catch {
      return String(value).split('?')[0].split('#')[0];
    }
  }

  function teamIdForImage(img) {
    const imagePath = normalizedPath(img.getAttribute('src') || img.src || '');
    if (!imagePath) return null;

    return Object.keys(TEAMS).find(teamId => {
      const teamPath = normalizedPath(TEAMS[teamId]?.logo || '');
      return teamPath && teamPath === imagePath;
    }) || null;
  }

  function stampShape(img) {
    if (!(img instanceof HTMLImageElement)) return;

    const teamId = teamIdForImage(img);
    if (!teamId) {
      delete img.dataset.sclTeamId;
      delete img.dataset.sclLogoShape;
      return;
    }

    const shape = FREEFORM_TEAM_IDS.has(teamId) ? 'freeform' : 'circular';
    img.dataset.sclTeamId = teamId;
    img.dataset.sclLogoShape = shape;

    const wrapper = img.closest(wrapperSelector);
    if (wrapper) {
      wrapper.dataset.sclTeamId = teamId;
      wrapper.dataset.sclLogoShape = shape;
    }
  }

  function scan(root) {
    if (!root) return;

    if (root instanceof HTMLImageElement) stampShape(root);
    if (root.querySelectorAll) root.querySelectorAll('img').forEach(stampShape);
  }

  // Initial render: standings, stats, records, champion, Franchise Hub and H2H.
  scan(document);

  // Future renders: season switches, H2H selections/dropdowns/history,
  // Franchise Profile modal, and any new team-logo location added later.
  const observer = new MutationObserver(records => {
    records.forEach(record => {
      if (record.type === 'attributes' && record.target instanceof HTMLImageElement) {
        stampShape(record.target);
        return;
      }

      record.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) scan(node);
      });
    });
  });

  observer.observe(document.body, {
    subtree:true,
    childList:true,
    attributes:true,
    attributeFilter:['src']
  });

  // Expose the policy for future SCL UI components without duplicating team lists.
  window.SCL_TEAM_LOGO_POLICY = Object.freeze({
    freeformTeamIds: Object.freeze(Array.from(FREEFORM_TEAM_IDS)),
    shapeFor(teamId) {
      return FREEFORM_TEAM_IDS.has(teamId) ? 'freeform' : 'circular';
    }
  });
})();
