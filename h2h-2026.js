// =====================
// SISTER CITIES H2H — INTERACTIVE COMPARISON
// Presentation/interaction layer only.
// Uses current TEAMS identities and validated H2H win matrix.
// =====================

(function initSisterCitiesH2H() {
  const panel = document.getElementById("tab-h2h");
  const data = window.SISTER_CITIES_H2H_DATA;
  if (!panel || !data || typeof TEAMS === "undefined") return;

  const SEARCH_ALIASES = {
    svetunited: ["Svet United", "Trablos United", "TrablosUnited", "MoD"],
    daddytate: ["Daddy Tate", "Spidey", "moekoubaissi", "MoeK"],
    angolarookie: ["Angola Rookie", "wadihelk"],
    drhtown: ["Dr. H-Town", "Dr H-Town", "mkassim94", "MKassim"],
    sixowls: ["6ixOwls", "Team 6ixOwls", "six owls", "6ix owls"],
    miami: ["Miami", "Miami Dolphins", "A TEAM", "Abe1993", "Buy the Dip-hins", "Dip-hins"],
    snorlax: ["Snorlax", "Deez Nuts", "Mahomies", "Tarboosh", "Snorrlax"],
    barjalona: ["Barjalona", "Team Barjalona"],
    maleksexcornflex: ["Malek sex w cornflex", "Malek Sex & Cornflex", "Invincibles", "samerkoneiber"],
    arshamaa: ["ArShamaa", "Team Shammaa", "Team 9", "arshammaa6", "ashammaa"],
    abethe3arab: ["Abethe3arab", "Abethe3Arab", "Z-Lounge", "Newfie NFL"]
  };

  const state = {
    left: null,
    right: null,
    openSide: null,
    activeIndex: -1
  };

  const searchIcon = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5"></circle>
      <path d="M16 16l4 4"></path>
    </svg>
  `;

  panel.innerHTML = `
    <div class="h2h-shell">
      <div class="h2h-brand">
        <img class="h2h-brand-logo" src="/sister-cities/assets/league-logo.png" alt="Sister Cities league logo">
        <div class="h2h-brand-lockup">
          <span class="h2h-brand-league">Sister Cities</span>
          <span class="h2h-brand-title">HEAD2HEAD</span>
        </div>
      </div>

      <div class="h2h-stage">
        <section class="h2h-side h2h-side-left" aria-label="Left franchise">
          <div class="h2h-side-hero">
            <div class="h2h-logo-stage h2h-logo-stage-left">
              <img class="h2h-team-logo" data-logo="left" alt="" hidden>
              <span class="h2h-logo-placeholder" data-placeholder="left">?</span>
            </div>
            <div class="h2h-win-number" data-wins="left">—</div>
          </div>

          <div class="h2h-team-name" data-name="left">Select a team</div>

          <div class="h2h-picker h2h-picker-left" data-picker="left">
            <span class="h2h-picker-icon">${searchIcon}</span>
            <input
              class="h2h-search"
              data-search="left"
              type="search"
              autocomplete="off"
              spellcheck="false"
              placeholder="Search team"
              aria-label="Search left team"
              aria-expanded="false"
              aria-controls="h2h-options-left"
            >
            <div class="h2h-options" data-options="left" id="h2h-options-left" role="listbox"></div>
          </div>
        </section>

        <div class="h2h-center" aria-label="Head to head comparison">
          <div class="h2h-ring is-empty" data-ring>
            <div class="h2h-ring-core">
              <span>VS</span>
            </div>
          </div>
          <div class="h2h-meeting-note" data-note>Choose two franchises</div>
        </div>

        <section class="h2h-side h2h-side-right" aria-label="Right franchise">
          <div class="h2h-side-hero h2h-side-hero-right">
            <div class="h2h-win-number" data-wins="right">—</div>
            <div class="h2h-logo-stage h2h-logo-stage-right">
              <img class="h2h-team-logo" data-logo="right" alt="" hidden>
              <span class="h2h-logo-placeholder" data-placeholder="right">?</span>
            </div>
          </div>

          <div class="h2h-team-name" data-name="right">Select a team</div>

          <div class="h2h-picker h2h-picker-right" data-picker="right">
            <span class="h2h-picker-icon">${searchIcon}</span>
            <input
              class="h2h-search"
              data-search="right"
              type="search"
              autocomplete="off"
              spellcheck="false"
              placeholder="Search team"
              aria-label="Search right team"
              aria-expanded="false"
              aria-controls="h2h-options-right"
            >
            <div class="h2h-options" data-options="right" id="h2h-options-right" role="listbox"></div>
          </div>
        </section>
      </div>
    </div>
  `;

  const ring = panel.querySelector("[data-ring]");
  const note = panel.querySelector("[data-note]");

  function allTeamIds() {
    return Object.keys(TEAMS).sort((a, b) => {
      const aName = (TEAMS[a]?.name || a).toLocaleLowerCase();
      const bName = (TEAMS[b]?.name || b).toLocaleLowerCase();
      return aName.localeCompare(bName);
    });
  }

  function normalizedSearchText(teamId) {
    const team = TEAMS[teamId] || {};
    return [
      team.name || teamId,
      team.owner || "",
      ...(SEARCH_ALIASES[teamId] || [])
    ].join(" ").toLocaleLowerCase();
  }

  function matchesQuery(teamId, query) {
    const q = query.trim().toLocaleLowerCase();
    if (!q) return true;
    return normalizedSearchText(teamId).includes(q);
  }

  function optionsFor(side, query = "") {
    const otherSide = side === "left" ? "right" : "left";
    const otherSelected = state[otherSide];

    return allTeamIds().filter(teamId => {
      if (teamId === otherSelected) return false;
      return matchesQuery(teamId, query);
    });
  }

  function renderOptions(side, query = "") {
    const optionsEl = panel.querySelector(`[data-options="${side}"]`);
    const input = panel.querySelector(`[data-search="${side}"]`);
    const options = optionsFor(side, query);

    state.activeIndex = options.length ? 0 : -1;

    if (!options.length) {
      optionsEl.innerHTML = `<div class="h2h-no-results">No team found</div>`;
    } else {
      optionsEl.innerHTML = options.map((teamId, index) => {
        const team = TEAMS[teamId] || { name: teamId, logo: "" };
        const selectedClass = state[side] === teamId ? " is-selected" : "";
        const activeClass = index === state.activeIndex ? " is-active" : "";

        return `
          <button
            class="h2h-option${selectedClass}${activeClass}"
            type="button"
            role="option"
            data-option-team="${teamId}"
            data-option-side="${side}"
            aria-selected="${state[side] === teamId ? "true" : "false"}"
          >
            <span class="h2h-option-logo">
              ${team.logo ? `<img src="${team.logo}" alt="" loading="lazy">` : ""}
            </span>
            <span class="h2h-option-copy">
              <span class="h2h-option-name">${team.name || teamId}</span>
              ${team.owner ? `<span class="h2h-option-owner">${team.owner}</span>` : ""}
            </span>
          </button>
        `;
      }).join("");
    }

    optionsEl.classList.add("is-open");
    input.setAttribute("aria-expanded", "true");
    state.openSide = side;
  }

  function closeOptions(side) {
    const optionsEl = panel.querySelector(`[data-options="${side}"]`);
    const input = panel.querySelector(`[data-search="${side}"]`);
    if (!optionsEl || !input) return;
    optionsEl.classList.remove("is-open");
    input.setAttribute("aria-expanded", "false");
    if (state.openSide === side) state.openSide = null;
    state.activeIndex = -1;
  }

  function getWins(teamId, opponentId) {
    return Number(data.wins?.[teamId]?.[opponentId] || 0);
  }

  function updateTeamPresentation(side) {
    const teamId = state[side];
    const team = teamId ? TEAMS[teamId] : null;
    const nameEl = panel.querySelector(`[data-name="${side}"]`);
    const logoEl = panel.querySelector(`[data-logo="${side}"]`);
    const placeholderEl = panel.querySelector(`[data-placeholder="${side}"]`);
    const input = panel.querySelector(`[data-search="${side}"]`);

    if (!team) {
      nameEl.textContent = "Select a team";
      logoEl.hidden = true;
      logoEl.removeAttribute("src");
      logoEl.alt = "";
      placeholderEl.hidden = false;
      input.value = "";
      return;
    }

    nameEl.textContent = team.name || teamId;
    input.value = team.name || teamId;

    if (team.logo) {
      logoEl.src = team.logo;
      logoEl.alt = `${team.name || teamId} logo`;
      logoEl.hidden = false;
      placeholderEl.hidden = true;
    } else {
      logoEl.hidden = true;
      placeholderEl.hidden = false;
    }
  }

  function updateComparison() {
    const leftWinsEl = panel.querySelector('[data-wins="left"]');
    const rightWinsEl = panel.querySelector('[data-wins="right"]');

    if (!state.left || !state.right) {
      leftWinsEl.textContent = "—";
      rightWinsEl.textContent = "—";
      ring.style.setProperty("--h2h-left-share", "50%");
      ring.classList.add("is-empty");
      note.textContent = "Choose two franchises";
      return;
    }

    const leftWins = getWins(state.left, state.right);
    const rightWins = getWins(state.right, state.left);
    const total = leftWins + rightWins;
    const leftShare = total ? (leftWins / total) * 100 : 50;

    leftWinsEl.textContent = String(leftWins);
    rightWinsEl.textContent = String(rightWins);

    ring.classList.remove("is-empty");
    requestAnimationFrame(() => {
      ring.style.setProperty("--h2h-left-share", `${leftShare}%`);
    });

    if (total === 0) {
      note.textContent = "No recorded meetings";
    } else {
      note.textContent = "";
    }
  }

  function selectTeam(side, teamId) {
    const otherSide = side === "left" ? "right" : "left";
    if (!TEAMS[teamId] || state[otherSide] === teamId) return;

    state[side] = teamId;
    updateTeamPresentation(side);
    closeOptions(side);
    updateComparison();
  }

  function moveActive(side, delta) {
    const input = panel.querySelector(`[data-search="${side}"]`);
    const optionsEl = panel.querySelector(`[data-options="${side}"]`);
    const options = optionsFor(side, input.value);
    if (!options.length) return;

    state.activeIndex = (state.activeIndex + delta + options.length) % options.length;

    optionsEl.querySelectorAll(".h2h-option").forEach((el, index) => {
      el.classList.toggle("is-active", index === state.activeIndex);
      if (index === state.activeIndex) el.scrollIntoView({ block: "nearest" });
    });
  }

  panel.querySelectorAll(".h2h-search").forEach(input => {
    const side = input.dataset.search;

    input.addEventListener("focus", () => {
      input.select();
      renderOptions(side, "");
    });

    input.addEventListener("input", () => {
      renderOptions(side, input.value);
    });

    input.addEventListener("keydown", event => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        if (state.openSide !== side) renderOptions(side, input.value);
        else moveActive(side, 1);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        if (state.openSide !== side) renderOptions(side, input.value);
        else moveActive(side, -1);
      } else if (event.key === "Enter") {
        if (state.openSide !== side) return;
        event.preventDefault();
        const options = optionsFor(side, input.value);
        const teamId = options[state.activeIndex] || options[0];
        if (teamId) selectTeam(side, teamId);
      } else if (event.key === "Escape") {
        closeOptions(side);
        input.blur();
      }
    });
  });

  panel.addEventListener("pointerdown", event => {
    const option = event.target.closest("[data-option-team]");
    if (!option) return;
    event.preventDefault();
    selectTeam(option.dataset.optionSide, option.dataset.optionTeam);
  });

  document.addEventListener("pointerdown", event => {
    if (!panel.contains(event.target)) {
      closeOptions("left");
      closeOptions("right");
      return;
    }

    if (state.openSide) {
      const picker = event.target.closest(`[data-picker="${state.openSide}"]`);
      if (!picker) closeOptions(state.openSide);
    }
  });

  updateTeamPresentation("left");
  updateTeamPresentation("right");
  updateComparison();
})();
