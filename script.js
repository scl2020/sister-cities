// =====================
// DATA
// =====================

const TROPHY_SRC = "/sister-cities/assets/trophy.png";

const TEAMS = {
  svetunited: { name: "Svet United", owner: "MoD", logo: "/sister-cities/assets/svetunited.png" },
  daddytate: { name: "Daddy Tate", owner: "MoeK", logo: "/sister-cities/assets/daddytate.png" },
  angolarookie: { name: "Angola Rookie", owner: "wadihelk", logo: "/sister-cities/assets/angolarookie.png" },
  drhtown: { name: "Dr. H-Town", owner: "MKassim", logo: "/sister-cities/assets/drhtown.png" },
  sixowls: { name: "6ixOwls", owner: "samik", logo: "/sister-cities/assets/sixowls.png" },
  miami: { name: "Miami", owner: "abe", logo: "/sister-cities/assets/miami.png" },
  snorlax: { name: "Snorlax", owner: "romi", logo: "/sister-cities/assets/snorlax.png" },
  barjalona: { name: "Barjalona", owner: "wassimelk", logo: "/sister-cities/assets/barjalona.png" },
  maleksexcornflex: { name: "Malek Sex & Cornflex", owner: "samerk", logo: "/sister-cities/assets/maleksexcornflex.png" },
  arshamaa: { name: "ArShamaa", owner: "arshammaa6", logo: "/sister-cities/assets/arshamaa.png" },
  abethe3arab: { name: "Abethe3arab", owner: "Abethe3Arab", logo: "/sister-cities/assets/abethe3arab.png" },
};

const FRANCHISE_RANDOM_ORDER = [
  "sixowls",
  "miami",
  "arshamaa",
  "barjalona",
  "svetunited",
  "angolarookie",
  "daddytate",
  "abethe3arab",
  "snorlax",
  "drhtown",
  "maleksexcornflex"
];

function teamPill(teamId, extraClass = "") {
  const t = TEAMS[teamId] || { name: teamId, owner: "" };

  const logo = t.logo
    ? `<img class="logo-img" src="${t.logo}" alt="${t.name} logo" loading="lazy">`
    : "";

  return `
    <span class="team-pill ${extraClass}">
      <span class="logo-dot">${logo}</span>
      <span class="team-pill-text">${t.name}</span>
    </span>
  `;
}

const seasons = {};

// =====================
// SEASONS
// =====================

seasons[2025] = {
  championTeamId: "svetunited",
  championNote: "",
  standings: [
    { teamId: "svetunited", seed: 1, record: "12–2", pf: 2059.30, pa: 1489.78 },
    { teamId: "maleksexcornflex", seed: 2, record: "10–4", pf: 2002.50, pa: 1617.90 },
    { teamId: "snorlax", seed: 3, record: "10–4", pf: 1779.90, pa: 1747.52 },
    { teamId: "daddytate", seed: 4, record: "8–6", pf: 1775.88, pa: 1680.38 },
    { teamId: "angolarookie", seed: 5, record: "7–7", pf: 1616.80, pa: 1651.72 },
    { teamId: "drhtown", seed: 6, record: "6–8", pf: 1909.08, pa: 1730.42 },
    { teamId: "sixowls", seed: 7, record: "5–9", pf: 1537.52, pa: 1644.36 },
    { teamId: "miami", seed: 8, record: "5–9", pf: 1508.90, pa: 1600.70 },
    { teamId: "barjalona", seed: 9, record: "4–10", pf: 1673.02, pa: 1616.48 },
  ],
  seasonStats: [
    { label: "Longest losing streak of the season", value: "4", display: "T-4 losses", teams: ["drhtown","miami","daddytate","barjalona"], details: null },
    { label: "Longest winning streak of the season", value: "9", display: "9 wins", teams: ["svetunited"], details: null },
    { label: "Best regular season record", value: "12-2", display: "12–2", teams: ["svetunited"], details: null },
    { label: "Worst regular season record", value: "4-10", display: "4–10", teams: ["barjalona"], details: null },
    { label: "Most total points", value: "2059.30", display: "2059.30", teams: ["svetunited"], details: null },
    { label: "Lowest total points scored", value: "1508.90", display: "1508.90", teams: ["miami"], details: null },
    { label: 'Most "Best Team" Sleeper reports', value: "5", display: "5 times", teams: ["svetunited"], details: null },
    { label: "Closest matchup of the season", value: "0.52", display: "0.52 points", teams: ["daddytate","barjalona"], details: "Week 5" },
    { label: "Biggest blowout of the season", value: "131", display: "131 points", teams: ["maleksexcornflex","snorlax"], details: "Week 6" },
    { label: "Highest average fantasy points", value: "147", display: "147", teams: ["svetunited"], details: null },
    { label: "Highest points in week", value: "202.58", display: "202.58", teams: ["maleksexcornflex"], details: "Week 6" },
    { label: "Lowest points in a week", value: "71.2", display: "71.2", teams: ["snorlax"], details: "Week 6" },
    { label: "Lowest average fantasy points", value: (1508.90 / 14).toFixed(2), display: (1508.90 / 14).toFixed(2), teams: ["miami"], details: "PF/Game (computed)" }
  ]
};

seasons[2024] = {
  championTeamId: "sixowls",
  championNote: "",
  standings: [
    { teamId: "maleksexcornflex", seed: 1, record: "10–4", pf: 1918.64, pa: 1754.24 },
    { teamId: "snorlax", seed: 2, record: "10–4", pf: 1879.20, pa: 1723.18 },
    { teamId: "drhtown", seed: 3, record: "9–5", pf: 1959.96, pa: 1755.60 },
    { teamId: "daddytate", seed: 4, record: "9–5", pf: 1917.64, pa: 1826.26 },
    { teamId: "sixowls", seed: 5, record: "7–7", pf: 1779.62, pa: 1797.30 },
    { teamId: "abethe3arab", seed: 6, record: "6–8", pf: 1808.00, pa: 1847.82 },
    { teamId: "arshamaa", seed: 7, record: "6–8", pf: 1744.08, pa: 1782.28 },
    { teamId: "miami", seed: 8, record: "5–9", pf: 1776.76, pa: 1910.38 },
    { teamId: "angolarookie", seed: 9, record: "5–9", pf: 1657.02, pa: 1834.30 },
    { teamId: "barjalona", seed: 10, record: "3–11", pf: 1644.64, pa: 1854.20 },
  ],
  seasonStats: [
    { label: "Longest losing streak of the season", value: "5", display: "5 losses (tied)", teams: ["angolarookie","barjalona"], details: null },
    { label: "Longest winning streak of the season", value: "5", display: "5 wins (tied)", teams: ["maleksexcornflex","daddytate","angolarookie"], details: null },
    { label: "Best regular season record", value: "10-4", display: "10–4", teams: ["maleksexcornflex"], details: null },
    { label: "Worst regular season record", value: "3-11", display: "3–11", teams: ["barjalona"], details: null },
    { label: "Most total points", value: "1959.96", display: "1959.96", teams: ["drhtown"], details: null },
    { label: "Lowest total points scored", value: "1644.64", display: "1644.64", teams: ["barjalona"], details: null },
    { label: 'Most "Best Team" Sleeper reports', value: "3", display: "T-3 times", teams: ["maleksexcornflex","drhtown"], details: null },
    { label: "Closest matchup of the season", value: "1.16", display: "1.16 points", teams: ["drhtown","arshamaa"], details: "Week 3" },
    { label: "Biggest blowout of the season", value: "82.12", display: "82.12 points", teams: ["drhtown","angolarookie"], details: "Week 4" },
    { label: "Highest average fantasy points", value: (1959.96 / 14).toFixed(2), display: (1959.96 / 14).toFixed(2), teams: ["drhtown"], details: "PF/Game (computed)" },
    { label: "Highest points in week", value: "195.90", display: "195.90", teams: ["sixowls"], details: "Week 6" },
    { label: "Lowest points in a week", value: "76.74", display: "76.74", teams: ["angolarookie"], details: "Week 3" },
    { label: "Lowest average fantasy points", value: (1644.64 / 14).toFixed(2), display: (1644.64 / 14).toFixed(2), teams: ["barjalona"], details: "PF/Game (computed)" }
  ]
};

seasons[2023] = {
  championTeamId: "sixowls",
  championNote: "",
  standings: [
    { teamId: "angolarookie", seed: 1, record: "9–5", pf: 1781.32, pa: 1624.20 },
    { teamId: "miami", seed: 2, record: "8–6", pf: 1806.90, pa: 1693.62 },
    { teamId: "abethe3arab", seed: 3, record: "8–6", pf: 1770.86, pa: 1665.76 },
    { teamId: "daddytate", seed: 4, record: "8–6", pf: 1757.64, pa: 1774.12 },
    { teamId: "arshamaa", seed: 5, record: "7–7", pf: 1851.66, pa: 1802.40 },
    { teamId: "sixowls", seed: 6, record: "7–7", pf: 1775.94, pa: 1875.34 },
    { teamId: "drhtown", seed: 7, record: "7–7", pf: 1774.70, pa: 1818.82 },
    { teamId: "maleksexcornflex", seed: 8, record: "6–8", pf: 1844.28, pa: 1766.14 },
    { teamId: "snorlax", seed: 9, record: "6–8", pf: 1742.68, pa: 1848.64 },
    { teamId: "barjalona", seed: 10, record: "4–10", pf: 1578.36, pa: 1815.30 },
  ],
  seasonStats: [
    { label: "Longest losing streak of the season", value: "6", display: "6 losses (tied)", teams: ["drhtown","barjalona"], details: null },
    { label: "Longest winning streak of the season", value: "4", display: "4 wins (tied)", teams: ["angolarookie","abethe3arab","daddytate","drhtown","barjalona"], details: null },
    { label: "Best regular season record", value: "9-5", display: "9–5", teams: ["angolarookie"], details: null },
    { label: "Worst regular season record", value: "4-10", display: "4–10", teams: ["barjalona"], details: null },
    { label: "Most total points", value: "1851.66", display: "1851.66", teams: ["arshamaa"], details: null },
    { label: "Lowest total points scored", value: "1578.36", display: "1578.36", teams: ["barjalona"], details: null },
    { label: 'Most "Best Team" Sleeper reports', value: "4", display: "4 times", teams: ["abethe3arab"], details: null },
    { label: "Closest matchup of the season", value: "1.94", display: "1.94 points", teams: ["miami","abethe3arab"], details: "Week 6" },
    { label: "Biggest blowout of the season", value: "76.18", display: "76.18 points", teams: ["abethe3arab","arshamaa"], details: "Week 7" },
    { label: "Highest average fantasy points", value: (1851.66 / 14).toFixed(2), display: (1851.66 / 14).toFixed(2), teams: ["arshamaa"], details: "PF/Game (computed)" },
    { label: "Highest points in week", value: "176.18", display: "176.18", teams: ["maleksexcornflex"], details: "Week 5" },
    { label: "Lowest points in a week", value: "78.12", display: "78.12", teams: ["barjalona"], details: "Week 9" },
    { label: "Lowest average fantasy points", value: (1578.36 / 14).toFixed(2), display: (1578.36 / 14).toFixed(2), teams: ["barjalona"], details: "PF/Game (computed)" }
  ]
};

seasons[2022] = {
  championTeamId: "arshamaa",
  championNote: "",
  standings: [
    { teamId: "snorlax", seed: 1, record: "9–5", pf: 1840.24, pa: 1645.92 },
    { teamId: "miami", seed: 2, record: "9–5", pf: 1785.10, pa: 1738.86 },
    { teamId: "barjalona", seed: 3, record: "8–6", pf: 1855.70, pa: 1805.82 },
    { teamId: "drhtown", seed: 4, record: "8–6", pf: 1725.76, pa: 1757.30 },
    { teamId: "angolarookie", seed: 5, record: "7–7", pf: 1763.80, pa: 1761.24 },
    { teamId: "arshamaa", seed: 6, record: "7–7", pf: 1685.06, pa: 1652.02 },
    { teamId: "sixowls", seed: 7, record: "6–8", pf: 1762.60, pa: 1692.80 },
    { teamId: "abethe3arab", seed: 8, record: "6–8", pf: 1690.92, pa: 1718.12 },
    { teamId: "daddytate", seed: 9, record: "6–8", pf: 1646.14, pa: 1797.04 },
    { teamId: "maleksexcornflex", seed: 10, record: "4–10", pf: 1689.78, pa: 1875.98 },
  ],
  seasonStats: [
    { label: "Longest losing streak of the season", value: "6", display: "6 losses", teams: ["maleksexcornflex"], details: "Weeks 1–6" },
    { label: "Longest winning streak of the season", value: "4", display: "4 wins (tied)", teams: ["arshamaa","snorlax","sixowls"], details: null },
    { label: "Best regular season record", value: "9-5", display: "9–5 (tied)", teams: ["snorlax","miami"], details: null },
    { label: "Worst regular season record", value: "4-10", display: "4–10", teams: ["maleksexcornflex"], details: null },
    { label: "Most total points", value: "1855.70", display: "1855.70", teams: ["barjalona"], details: null },
    { label: "Lowest total points scored", value: "1646.14", display: "1646.14", teams: ["daddytate"], details: null },
    { label: 'Most "Best Team" Sleeper reports', value: "2", display: "2 times (tied)", teams: ["angolarookie","barjalona","arshamaa","miami"], details: null },
    { label: "Closest matchup of the season", value: "0.04", display: "0.04 points", teams: ["daddytate","barjalona"], details: "Week 2" },
    { label: "Biggest blowout of the season", value: "83.40", display: "83.40 points", teams: ["maleksexcornflex","miami"], details: "Week 11" },
    { label: "Highest average fantasy points", value: (1855.70 / 14).toFixed(2), display: (1855.70 / 14).toFixed(2), teams: ["barjalona"], details: "PF/Game (computed)" },
    { label: "Highest points in week", value: "186.14", display: "186.14", teams: ["drhtown"], details: "Week 8" },
    { label: "Lowest points in a week", value: "70.44", display: "70.44", teams: ["angolarookie"], details: "Week 10" },
    { label: "Lowest average fantasy points", value: (1646.14 / 14).toFixed(2), display: (1646.14 / 14).toFixed(2), teams: ["daddytate"], details: "PF/Game (computed)" }
  ]
};

seasons[2021] = {
  championTeamId: "maleksexcornflex",
  championNote: "",
  standings: [
    { teamId: "drhtown", seed: 1, record: "9–5", pf: 1981.02, pa: 1873.22 },
    { teamId: "barjalona", seed: 2, record: "9–5", pf: 1975.50, pa: 1758.88 },
    { teamId: "maleksexcornflex", seed: 3, record: "8–6", pf: 1879.88, pa: 1850.88 },
    { teamId: "miami", seed: 4, record: "7–7", pf: 1685.24, pa: 1722.68 },
    { teamId: "sixowls", seed: 5, record: "6–8", pf: 1883.60, pa: 1851.32 },
    { teamId: "angolarookie", seed: 6, record: "6–8", pf: 1812.22, pa: 1973.99 },
    { teamId: "abethe3arab", seed: 7, record: "6–8", pf: 1741.38, pa: 1818.90 },
    { teamId: "arshamaa", seed: 8, record: "5–9", pf: 1857.40, pa: 1966.36 },
  ],
  seasonStats: [
    { label: "Longest losing streak of the season", value: "6", display: "6 losses", teams: ["angolarookie"], details: "Weeks 8–13" },
    { label: "Longest winning streak of the season", value: "7", display: "7 wins", teams: ["drhtown"], details: "Weeks 6–12" },
    { label: "Best regular season record", value: "9-5", display: "9–5 (tied)", teams: ["drhtown","barjalona"], details: null },
    { label: "Worst regular season record", value: "5-9", display: "5–9", teams: ["arshamaa"], details: null },
    { label: "Most total points", value: "1981.02", display: "1981.02", teams: ["drhtown"], details: null },
    { label: "Lowest total points scored", value: "1685.24", display: "1685.24", teams: ["miami"], details: null },
    { label: 'Most "Best Team" Sleeper reports', value: "3", display: "3 times", teams: ["barjalona"], details: null },
    { label: "Closest matchup of the season", value: "0.21", display: "0.21 points", teams: ["angolarookie","abethe3arab"], details: "Week 13" },
    { label: "Biggest blowout of the season", value: "78.30", display: "78.30 points", teams: ["abethe3arab","arshamaa"], details: "Week 14" },
    { label: "Highest average fantasy points", value: (1981.02 / 14).toFixed(2), display: (1981.02 / 14).toFixed(2), teams: ["drhtown"], details: "PF/Game (computed)" },
    { label: "Highest points in week", value: "204.58", display: "204.58", teams: ["barjalona"], details: "Week 5" },
    { label: "Lowest points in a week", value: "77.54", display: "77.54", teams: ["abethe3arab"], details: "Week 7" },
    { label: "Lowest average fantasy points", value: (1685.24 / 14).toFixed(2), display: (1685.24 / 14).toFixed(2), teams: ["miami"], details: "PF/Game (computed)" }
  ]
};

// =====================
// UI LOGIC
// =====================

const LOWER_IS_BETTER = new Set([
  "Closest matchup of the season",
  "Lowest points in a week",
  "Lowest total points scored",
  "Worst regular season record",
  "Lowest average fantasy points",
]);

function normalizeNumberFromStat(label, val) {
  if (typeof val === "number") return val;
  if (typeof val !== "string") return NaN;

  const s = val.trim();
  const m = s.match(/^(\d+)\s*[-–]\s*(\d+)$/);
  if (m) return Number(m[1]);

  const n = Number(s.replace(/[^\d.\-]/g, ""));
  return Number.isFinite(n) ? n : NaN;
}

function computeAllTime(seasonsObj) {
  const recordMap = new Map();

  for (const year of Object.keys(seasonsObj).map(Number)) {
    const season = seasonsObj[year];
    season.year = year;
    season.hasAllTime = false;
    season.seasonStats.forEach(st => { st.isAllTime = false; });

    for (const stat of season.seasonStats) {
      const v = normalizeNumberFromStat(stat.label, stat.value);
      if (!Number.isFinite(v)) continue;

      const lowerBetter = LOWER_IS_BETTER.has(stat.label);
      const current = recordMap.get(stat.label);

      if (!current) {
        recordMap.set(stat.label, { best: v, lowerBetter, holders: [{ year, stat }] });
      } else {
        const better = lowerBetter ? (v < current.best) : (v > current.best);
        const tie = Math.abs(v - current.best) < 1e-9;

        if (better) {
          current.best = v;
          current.holders = [{ year, stat }];
        } else if (tie) {
          current.holders.push({ year, stat });
        }
      }
    }
  }

  for (const info of recordMap.values()) {
    for (const h of info.holders) {
      h.stat.isAllTime = true;
      seasonsObj[h.year].hasAllTime = true;
    }
  }

  return recordMap;
}

function renderStandings(season) {
  const rows = season.standings.map(r => `
    <tr>
      <td>${r.seed}</td>
      <td>${teamPill(r.teamId)}</td>
      <td>${r.record}</td>
      <td>${r.pf.toFixed(2)}</td>
      <td>${r.pa.toFixed(2)}</td>
    </tr>
  `).join("");

  return `
    <table class="table" aria-label="Season standings">
      <thead>
        <tr>
          <th>Seed</th>
          <th>Team</th>
          <th>Record</th>
          <th>PF</th>
          <th>PA</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function renderStats(season) {
  const badge = season.hasAllTime ? `<span class="alltime-badge">All Time Record</span>` : "";

  const rows = season.seasonStats.map(st => {
    const valueClass = st.isAllTime ? "stat-alltime" : "";
    const teams = (st.teams && st.teams.length) ? st.teams.map(teamPill).join(" · ") : "";
    const details = st.details ? `<div class="stat-detail">${st.details}</div>` : "";

    return `
      <div class="stat-row">
        <div>
          <div class="stat-label">${st.label}</div>
          ${details}
          <div class="stat-detail">${teams}</div>
        </div>
        <div class="stat-value ${valueClass}">${st.display ?? st.value}</div>
      </div>
    `;
  }).join("");

  return `
    <div class="stats-head">
      <div class="stats-title">${season.year} Season Stats</div>
      ${badge}
    </div>
    ${rows}
  `;
}

function renderAllTime(recordMap) {
  const container = document.getElementById("allTimeRecordsContainer");
  if (!container) return;

  const entries = Array.from(recordMap.entries());

  const order = [
    "Longest winning streak of the season",
    "Longest losing streak of the season",
    "Closest matchup of the season",
    "Biggest blowout of the season",
    "Highest points in week",
    "Lowest points in a week",
    'Most "Best Team" Sleeper reports',
    "Best regular season record",
    "Worst regular season record",
    "Most total points",
    "Lowest total points scored",
    "Highest average fantasy points",
    "Lowest average fantasy points",
  ];

  entries.sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]));

  const cards = entries.map(([label, info]) => {
    const holdersHtml = info.holders.map(h => {
      const teamsHtml = (h.stat.teams && h.stat.teams.length)
        ? h.stat.teams.map(id => teamPill(id)).join(" ")
        : "";

      const detail = h.stat.details ? ` <span class="muted">(${h.stat.details})</span>` : "";

      return `
        <div class="record-holder-line">
          <span class="record-year">${h.year} —</span>
          <span class="record-teams">${teamsHtml}${detail}</span>
        </div>
      `;
    }).join("");

    const bestDisplay = (info.best && info.best.toFixed)
      ? info.best.toFixed(2).replace(/\.00$/, "")
      : String(info.best);

    return `
      <div class="record-card">
        <div class="record-title">${label}</div>
        <div class="record-value">${bestDisplay}</div>
        <div class="record-holders">${holdersHtml}</div>
      </div>
    `;
  }).join("");

  container.innerHTML = `<div class="records-grid">${cards}</div>`;
}

// =====================
// CHAMPION
// =====================

function countChampsUpTo(teamId, upToYear) {
  let count = 0;

  for (const y of Object.keys(seasons).map(Number)) {
    if (y <= upToYear && seasons[y].championTeamId === teamId) {
      count++;
    }
  }

  return count;
}

function renderChampion(season) {
  const elTeam = document.getElementById("championTeam");
  const elNote = document.getElementById("championNote");

  if (!elTeam || !elNote) return;

  if (!season || !season.championTeamId) {
    elTeam.textContent = "Undecided";
    elNote.textContent = season && season.championNote ? season.championNote : "";
    return;
  }

  const teamId = season.championTeamId;
  const t = TEAMS[teamId] || { name: teamId, logo: null };

  const trophyCount = Math.max(1, countChampsUpTo(teamId, season.year));

  const trophiesHtml = Array.from({ length: trophyCount })
    .map(() => `<img class="champion-trophy" src="${TROPHY_SRC}" alt="Trophy" loading="lazy">`)
    .join("");

  elTeam.innerHTML = `
    <div class="champion-trophy-row" style="display:flex; gap:8px; justify-content:center; align-items:center;">
      ${trophiesHtml}
    </div>

    ${t.logo ? `<img class="champion-team-logo" src="${t.logo}" alt="${t.name} logo" loading="lazy">` : ""}

    <div class="champion-team-name">${t.name}</div>
  `;

  elNote.textContent = season.championNote || "";
}

// =====================
// TABS / SEASONS
// =====================

function wireTabs() {
  const tabButtons = document.querySelectorAll(".tab");

  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      tabButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const target = btn.dataset.tab;

      document.querySelectorAll(".tabpanel").forEach(p => p.classList.remove("active"));

      const panel = document.getElementById(`tab-${target}`);
      if (panel) panel.classList.add("active");

      if (target === "franchise") {
        buildFranchiseGrid();
      }
    });
  });

  const subTabs = document.querySelectorAll(".season-subtab");

  subTabs.forEach(btn => {
    btn.addEventListener("click", () => {
      subTabs.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const target = btn.dataset.subtab;

      document.querySelectorAll(".season-pane").forEach(p => p.classList.remove("active"));

      const pane = document.querySelector(`[data-pane="${target}"]`);
      if (pane) pane.classList.add("active");
    });
  });
}

function wireSeasonYears(state) {
  const yearButtons = document.querySelectorAll(".season-year-button");

  yearButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      yearButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      state.currentYear = Number(btn.dataset.season);
      renderSeason(state);
    });
  });
}

function renderSeason(state) {
  const season = seasons[state.currentYear];

  renderChampion(season);

  const standingsEl = document.getElementById("seasonStandings");
  const statsEl = document.getElementById("seasonStats");

  if (standingsEl) standingsEl.innerHTML = renderStandings(season);
  if (statsEl) statsEl.innerHTML = renderStats(season);
}

// =====================
// GALLERY MODAL
// =====================

function wireGalleryModal() {
  document.addEventListener("click", (e) => {
    const img = e.target.closest(".gallery-thumb");
    if (!img) return;

    const modal = document.getElementById("galleryModal");
    const modalImg = document.getElementById("galleryModalImg");
    const caption = document.getElementById("galleryModalCaption");

    if (!modal || !modalImg || !caption) return;

    modalImg.src = img.src;
    caption.textContent = img.alt;

    modal.style.display = "flex";
  });

  const closeBtn = document.querySelector(".gallery-close");

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      const modal = document.getElementById("galleryModal");
      if (modal) modal.style.display = "none";
    });
  }

  const galleryModal = document.getElementById("galleryModal");

  if (galleryModal) {
    galleryModal.addEventListener("click", (e) => {
      if (e.target.id === "galleryModal") {
        e.currentTarget.style.display = "none";
      }
    });
  }
}

// =====================
// FRANCHISE HUB
// =====================

function getTeamChampionshipCount(teamId) {
  return Object.keys(seasons)
    .map(Number)
    .filter(year => seasons[year].championTeamId === teamId)
    .length;
}

function getTeamActiveYears(teamId) {
  const years = Object.keys(seasons).map(Number).sort((a, b) => a - b);

  const active = years.filter(y =>
    seasons[y].standings.some(r => r.teamId === teamId)
  );

  if (!active.length) return "";

  const start = active[0];
  const end = active[active.length - 1];

  const latestYear = Math.max(...years);
  const isActiveNow = end === latestYear;

  return isActiveNow ? `${start}-` : `${start}-${end}`;
}

function parseRecord(recordStr) {
  if (!recordStr) return null;

  const parts = String(recordStr).split(/[-–]/).map(s => s.trim());

  if (parts.length < 2) return null;

  const wins = Number(parts[0]);
  const losses = Number(parts[1]);

  if (!Number.isFinite(wins) || !Number.isFinite(losses)) return null;

  const games = wins + losses;
  const pct = games > 0 ? wins / games : 0;

  return { wins, losses, games, pct };
}

function ordinal(n) {
  const suffixes = ["th", "st", "nd", "rd"];
  const v = n % 100;

  return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
}

function getTeamSeasonRows(teamId) {
  const years = Object.keys(seasons).map(Number).sort((a, b) => a - b);
  const rows = [];

  for (const y of years) {
    const season = seasons[y];
    const row = season.standings.find(r => r.teamId === teamId);

    if (!row) continue;

    rows.push({
      year: y,
      seed: row.seed,
      record: row.record,
      recordObj: parseRecord(row.record),
      pf: row.pf,
      pa: row.pa
    });
  }

  return rows;
}

function computeFranchiseProfile(teamId) {
  const rows = getTeamSeasonRows(teamId);

  if (!rows.length) {
    return {
      playoffCount: 0,
      playoffYears: [],
      bestRecord: null,
      bestRecordYears: [],
      bestFinish: null,
      bestFinishYears: [],
      firstSeedCount: 0,
      firstSeedYears: []
    };
  }

  const playoffYears = rows
    .filter(r => r.seed <= 6)
    .map(r => r.year);

  const bestFinish = Math.min(...rows.map(r => r.seed));

  const bestFinishYears = rows
    .filter(r => r.seed === bestFinish)
    .map(r => r.year);

  const firstSeedYears = rows
    .filter(r => r.seed === 1)
    .map(r => r.year);

  let best = null;

  for (const r of rows) {
    if (!r.recordObj) continue;

    const cur = r.recordObj;

    if (!best) {
      best = {
        pct: cur.pct,
        wins: cur.wins,
        losses: cur.losses,
        years: [r.year],
        display: r.record
      };
    } else {
      const better =
        cur.pct > best.pct ||
        (Math.abs(cur.pct - best.pct) < 1e-12 && cur.wins > best.wins);

      const tie =
        Math.abs(cur.pct - best.pct) < 1e-12 &&
        cur.wins === best.wins &&
        cur.losses === best.losses;

      if (better) {
        best = {
          pct: cur.pct,
          wins: cur.wins,
          losses: cur.losses,
          years: [r.year],
          display: r.record
        };
      } else if (tie) {
        best.years.push(r.year);
      }
    }
  }

  return {
    playoffCount: playoffYears.length,
    playoffYears,
    bestRecord: best ? best.display : null,
    bestRecordYears: best ? best.years : [],
    bestFinish,
    bestFinishYears,
    firstSeedCount: firstSeedYears.length,
    firstSeedYears
  };
}

function buildFranchiseGrid() {
  const grid = document.getElementById("franchiseGrid");

  if (!grid) return;

  const entries = FRANCHISE_RANDOM_ORDER
    .filter(id => TEAMS[id])
    .map(id => ({ id, ...TEAMS[id] }));

  grid.innerHTML = entries.map(t => {
    const starCount = getTeamChampionshipCount(t.id);
    const yearsActive = getTeamActiveYears(t.id);
    const stars = starCount > 0 ? "★".repeat(starCount) : "";

    return `
      <div class="franchise-item" data-teamid="${t.id}">
        <div class="franchise-stars">${stars || "&nbsp;"}</div>

        <div class="franchise-logoWrap">
          <img class="franchise-logo" src="${t.logo}" alt="${t.name} logo" loading="lazy">
        </div>

        <div class="franchise-name">${t.name}</div>
        <div class="franchise-years">${yearsActive}</div>
      </div>
    `;
  }).join("");
}

function openFranchiseModal(teamId) {
  const modal = document.getElementById("franchiseModal");
  const logoEl = document.getElementById("franchiseModalLogo");
  const nameEl = document.getElementById("franchiseModalName");
  const ownerEl = document.getElementById("franchiseModalOwner");

  if (!modal || !logoEl || !nameEl || !ownerEl) return;

  const bodyEl = modal.querySelector(".franchise-modal-body");

  const t = TEAMS[teamId];

  if (!t) return;

  logoEl.src = t.logo;
  logoEl.alt = `${t.name} logo`;
  nameEl.textContent = t.name;
  ownerEl.textContent = t.owner ? `Owner: ${t.owner}` : "";

  const p = computeFranchiseProfile(teamId);

  const playoffYearsTxt = p.playoffYears.length ? p.playoffYears.join(", ") : "—";
  const bestRecordTxt = p.bestRecord ? `${p.bestRecord} (${p.bestRecordYears.join(", ")})` : "—";
  const bestFinishTxt = p.bestFinish ? `${ordinal(p.bestFinish)} (${p.bestFinishYears.join(", ")})` : "—";

  const firstSeedTxt = p.firstSeedCount
    ? `${p.firstSeedCount} (${p.firstSeedYears.join(", ")})`
    : "0";

  if (bodyEl) {
    bodyEl.classList.remove("muted");

    bodyEl.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:10px;">
        <div><strong>Playoff appearances:</strong> ${p.playoffCount} <span class="muted">(${playoffYearsTxt})</span></div>
        <div><strong>Best season record:</strong> ${bestRecordTxt}</div>
        <div><strong>Best finish in the season:</strong> ${bestFinishTxt}</div>
        <div><strong>Number of times won the season (#1 seed):</strong> ${firstSeedTxt}</div>
      </div>
    `;
  }

  modal.style.display = "flex";
  modal.setAttribute("aria-hidden", "false");
}

function closeFranchiseModal() {
  const modal = document.getElementById("franchiseModal");

  if (!modal) return;

  modal.style.display = "none";
  modal.setAttribute("aria-hidden", "true");
}

function wireFranchiseHub() {
  document.addEventListener("click", (e) => {
    const tile = e.target.closest(".franchise-item");

    if (!tile) return;

    const teamId = tile.getAttribute("data-teamid");

    if (teamId) openFranchiseModal(teamId);
  });

  const closeBtn = document.getElementById("franchiseClose");

  if (closeBtn) {
    closeBtn.addEventListener("click", closeFranchiseModal);
  }

  const modal = document.getElementById("franchiseModal");

  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target.id === "franchiseModal") {
        closeFranchiseModal();
      }
    });
  }
}

// =====================
// BOOT
// =====================

(function init() {
  wireTabs();

  const recordMap = computeAllTime(seasons);
  renderAllTime(recordMap);

  const state = { currentYear: 2025 };

  wireSeasonYears(state);
  renderSeason(state);

  buildFranchiseGrid();
  wireFranchiseHub();

  wireGalleryModal();
})();
