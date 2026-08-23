import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';

const YEARS = [2021, 2022, 2023, 2024, 2025];
const REGULAR_WEEKS = Array.from({ length: 14 }, (_, i) => i + 1);
const ROOT = process.cwd();
const SLEEPER_ROOT = path.join(ROOT, 'data', 'sleeper');
const AUDIT_ROOT = path.join(ROOT, 'data', 'audits');

const readJson = async file => JSON.parse(await readFile(file, 'utf8'));
const round2 = n => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
const sorted = values => [...values].sort();
const sameSet = (a, b) => JSON.stringify(sorted(a || [])) === JSON.stringify(sorted(b || []));
const normRecord = value => String(value ?? '').replace(/–/g, '-').replace(/\s/g, '');

function extractBalancedObject(source, marker) {
  const markerIndex = source.indexOf(marker);
  if (markerIndex < 0) throw new Error(`Could not find marker: ${marker}`);
  const start = source.indexOf('{', markerIndex + marker.length);
  if (start < 0) throw new Error(`Could not find object after: ${marker}`);

  let depth = 0;
  let quote = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let i = start; i < source.length; i += 1) {
    const ch = source[i];
    const next = source[i + 1];

    if (lineComment) {
      if (ch === '\n') lineComment = false;
      continue;
    }
    if (blockComment) {
      if (ch === '*' && next === '/') { blockComment = false; i += 1; }
      continue;
    }
    if (quote) {
      if (escaped) { escaped = false; continue; }
      if (ch === '\\') { escaped = true; continue; }
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '/' && next === '/') { lineComment = true; i += 1; continue; }
    if (ch === '/' && next === '*') { blockComment = true; i += 1; continue; }
    if (ch === '"' || ch === "'" || ch === '`') { quote = ch; continue; }
    if (ch === '{') depth += 1;
    if (ch === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  throw new Error(`Unbalanced object after marker: ${marker}`);
}

function evalObject(text) {
  return vm.runInNewContext(`(${text})`, Object.create(null), { timeout: 1000 });
}

async function loadSiteData() {
  const source = await readFile(path.join(ROOT, 'script.js'), 'utf8');
  const seasons = {};
  for (const year of YEARS) {
    seasons[year] = evalObject(extractBalancedObject(source, `seasons[${year}] =`));
  }

  const h2hSource = await readFile(path.join(ROOT, 'h2h-data-2026.js'), 'utf8');
  const h2h = evalObject(extractBalancedObject(h2hSource, 'window.SISTER_CITIES_H2H_DATA ='));
  return { seasons, h2h };
}

function userIdMapFromPolicy(policy) {
  const map = new Map();
  for (const [franchiseId, franchise] of Object.entries(policy.franchises || {})) {
    for (const userId of franchise.sleeper_user_ids || []) map.set(String(userId), franchiseId);
  }
  return map;
}

function aliasMapFromPolicy(policy) {
  const map = new Map();
  const normalize = value => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  for (const [franchiseId, franchise] of Object.entries(policy.franchises || {})) {
    for (const alias of [franchise.current_name, ...(franchise.aliases || [])]) {
      const key = normalize(alias);
      if (key) map.set(key, franchiseId);
    }
  }
  return { map, normalize };
}

function buildRosterMap(year, rosters, users, policy) {
  const byUserId = userIdMapFromPolicy(policy);
  const { map: byAlias, normalize } = aliasMapFromPolicy(policy);
  const usersById = new Map(users.map(u => [String(u.user_id), u]));
  const overrides = policy.season_roster_overrides?.[String(year)] || {};
  const rosterMap = new Map();
  const unresolved = [];

  for (const roster of rosters) {
    const rid = String(roster.roster_id);
    let franchiseId = overrides[rid] || null;

    if (!franchiseId && roster.owner_id) franchiseId = byUserId.get(String(roster.owner_id)) || null;

    if (!franchiseId && roster.owner_id) {
      const user = usersById.get(String(roster.owner_id));
      const candidates = [user?.display_name, user?.metadata?.team_name];
      for (const candidate of candidates) {
        const hit = byAlias.get(normalize(candidate));
        if (hit) { franchiseId = hit; break; }
      }
    }

    if (franchiseId) rosterMap.set(Number(roster.roster_id), franchiseId);
    else unresolved.push({ roster_id: roster.roster_id, owner_id: roster.owner_id || null });
  }

  return { rosterMap, unresolved };
}

function initTeam() {
  return { wins: 0, losses: 0, ties: 0, pf: 0, pa: 0, sequence: [] };
}

function longestRun(sequence, symbol) {
  let best = 0;
  let current = 0;
  for (const item of sequence) {
    if (item === symbol) { current += 1; best = Math.max(best, current); }
    else current = 0;
  }
  return best;
}

async function computeSleeperSeason(year, siteSeason, policy) {
  const dir = path.join(SLEEPER_ROOT, String(year));
  const [users, rosters] = await Promise.all([
    readJson(path.join(dir, 'users.json')),
    readJson(path.join(dir, 'rosters.json'))
  ]);
  const { rosterMap, unresolved } = buildRosterMap(year, rosters, users, policy);
  const teams = new Map();
  const games = [];
  const weeklyScores = [];

  for (const franchiseId of new Set(rosterMap.values())) teams.set(franchiseId, initTeam());

  for (const week of REGULAR_WEEKS) {
    const entries = await readJson(path.join(dir, `week-${week}.json`));
    const groups = new Map();

    for (const entry of entries) {
      const franchiseId = rosterMap.get(Number(entry.roster_id));
      if (!franchiseId) continue;
      if (!teams.has(franchiseId)) teams.set(franchiseId, initTeam());
      weeklyScores.push({ week, franchiseId, points: Number(entry.points || 0), rosterId: entry.roster_id });
      const key = entry.matchup_id == null ? `null-${entry.roster_id}` : String(entry.matchup_id);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push({ ...entry, franchiseId, points: Number(entry.points || 0) });
    }

    for (const group of groups.values()) {
      if (group.length !== 2) continue;
      const [a, b] = group;
      const ta = teams.get(a.franchiseId);
      const tb = teams.get(b.franchiseId);
      ta.pf += a.points; ta.pa += b.points;
      tb.pf += b.points; tb.pa += a.points;

      if (a.points > b.points) {
        ta.wins += 1; tb.losses += 1; ta.sequence.push('W'); tb.sequence.push('L');
      } else if (b.points > a.points) {
        tb.wins += 1; ta.losses += 1; tb.sequence.push('W'); ta.sequence.push('L');
      } else {
        ta.ties += 1; tb.ties += 1; ta.sequence.push('T'); tb.sequence.push('T');
      }
      games.push({ week, a: a.franchiseId, b: b.franchiseId, aPoints: a.points, bPoints: b.points });
    }
  }

  for (const team of teams.values()) { team.pf = round2(team.pf); team.pa = round2(team.pa); }

  const activeIds = new Set(siteSeason.standings.map(row => row.teamId));
  const activeTeams = [...teams.entries()].filter(([id]) => activeIds.has(id));
  const standings = activeTeams
    .map(([teamId, t]) => ({ teamId, ...t }))
    .sort((a, b) => b.wins - a.wins || b.ties - a.ties || b.pf - a.pf || a.teamId.localeCompare(b.teamId))
    .map((row, index) => ({ ...row, seed: index + 1 }));

  const activeGames = games.filter(g => activeIds.has(g.a) && activeIds.has(g.b));
  const activeWeeklyScores = weeklyScores.filter(s => activeIds.has(s.franchiseId));

  const maxWinStreak = Math.max(...activeTeams.map(([, t]) => longestRun(t.sequence, 'W')));
  const maxLossStreak = Math.max(...activeTeams.map(([, t]) => longestRun(t.sequence, 'L')));
  const winStreakTeams = activeTeams.filter(([, t]) => longestRun(t.sequence, 'W') === maxWinStreak).map(([id]) => id);
  const lossStreakTeams = activeTeams.filter(([, t]) => longestRun(t.sequence, 'L') === maxLossStreak).map(([id]) => id);

  const bestWins = Math.max(...standings.map(t => t.wins));
  const bestRecordTeams = standings.filter(t => t.wins === bestWins).map(t => t.teamId);
  const worstWins = Math.min(...standings.map(t => t.wins));
  const worstRecordTeams = standings.filter(t => t.wins === worstWins).map(t => t.teamId);
  const maxPf = Math.max(...standings.map(t => t.pf));
  const minPf = Math.min(...standings.map(t => t.pf));
  const maxPfTeams = standings.filter(t => Math.abs(t.pf - maxPf) < 0.005).map(t => t.teamId);
  const minPfTeams = standings.filter(t => Math.abs(t.pf - minPf) < 0.005).map(t => t.teamId);

  const byMarginAsc = [...activeGames].sort((x, y) => Math.abs(x.aPoints - x.bPoints) - Math.abs(y.aPoints - y.bPoints));
  const byMarginDesc = [...activeGames].sort((x, y) => Math.abs(y.aPoints - y.bPoints) - Math.abs(x.aPoints - x.bPoints));
  const closest = byMarginAsc[0];
  const blowout = byMarginDesc[0];
  const highWeek = [...activeWeeklyScores].sort((a, b) => b.points - a.points)[0];
  const lowWeek = [...activeWeeklyScores].sort((a, b) => a.points - b.points)[0];
  const highAvg = [...standings].sort((a, b) => b.pf - a.pf)[0];
  const lowAvg = [...standings].sort((a, b) => a.pf - b.pf)[0];

  const statActual = {
    'Longest losing streak of the season': { value: maxLossStreak, teams: lossStreakTeams },
    'Longest winning streak of the season': { value: maxWinStreak, teams: winStreakTeams },
    'Best regular season record': { value: `${bestWins}-${14 - bestWins}`, teams: bestRecordTeams },
    'Worst regular season record': { value: `${worstWins}-${14 - worstWins}`, teams: worstRecordTeams },
    'Most total points': { value: maxPf, teams: maxPfTeams },
    'Lowest total points scored': { value: minPf, teams: minPfTeams },
    'Closest matchup of the season': { value: Math.abs(closest.aPoints - closest.bPoints), teams: [closest.a, closest.b], details: `Week ${closest.week}` },
    'Biggest blowout of the season': { value: Math.abs(blowout.aPoints - blowout.bPoints), teams: [blowout.a, blowout.b], details: `Week ${blowout.week}` },
    'Highest average fantasy points': { value: highAvg.pf / 14, teams: [highAvg.teamId] },
    'Highest points in week': { value: highWeek.points, teams: [highWeek.franchiseId], details: `Week ${highWeek.week}` },
    'Lowest points in a week': { value: lowWeek.points, teams: [lowWeek.franchiseId], details: `Week ${lowWeek.week}` },
    'Lowest average fantasy points': { value: lowAvg.pf / 14, teams: [lowAvg.teamId] }
  };

  return { rosterMap, unresolved, teams, standings, games, weeklyScores, statActual };
}

function decimalPlaces(value) {
  const s = String(value);
  const m = s.match(/\.(\d+)/);
  return m ? m[1].length : 0;
}

function compareStat(siteStat, actual) {
  if (!actual) return { status: 'UNVERIFIED', reason: 'Not available from the public raw matchup/bracket data used by this audit.' };
  const recordLike = /record/i.test(siteStat.label);
  let valueOk;
  if (recordLike) {
    valueOk = normRecord(siteStat.value) === normRecord(actual.value);
  } else {
    const siteNum = Number(siteStat.value);
    const actualNum = Number(actual.value);
    const decimals = decimalPlaces(siteStat.value);
    const tolerance = decimals === 0 ? 0.500001 : (0.5 / (10 ** decimals)) + 1e-9;
    valueOk = Number.isFinite(siteNum) && Number.isFinite(actualNum) && Math.abs(siteNum - actualNum) <= tolerance;
  }
  const teamsOk = sameSet(siteStat.teams, actual.teams);
  const detailsOk = !siteStat.details || !actual.details || siteStat.details === actual.details;
  return { status: valueOk && teamsOk && detailsOk ? 'PASS' : 'MISMATCH', valueOk, teamsOk, detailsOk };
}

function h2hWinsFromGames(allSeasons) {
  const wins = {};
  let gamesCount = 0;
  const add = (winner, loser) => {
    wins[winner] ||= {};
    wins[winner][loser] = (wins[winner][loser] || 0) + 1;
  };
  for (const season of Object.values(allSeasons)) {
    for (const g of season.games) {
      gamesCount += 1;
      if (g.aPoints > g.bPoints) add(g.a, g.b);
      else if (g.bPoints > g.aPoints) add(g.b, g.a);
    }
  }
  return { wins, gamesCount };
}

function comparableStatValue(label, value) {
  if (/record/i.test(label)) {
    const m = normRecord(value).match(/^(\d+)-(\d+)$/);
    return m ? Number(m[1]) : NaN;
  }
  return Number(value);
}

function actualAllTime(actualByYear) {
  const directions = {
    'Longest losing streak of the season': 'max',
    'Longest winning streak of the season': 'max',
    'Best regular season record': 'max',
    'Worst regular season record': 'min',
    'Most total points': 'max',
    'Lowest total points scored': 'min',
    'Closest matchup of the season': 'min',
    'Biggest blowout of the season': 'max',
    'Highest average fantasy points': 'max',
    'Highest points in week': 'max',
    'Lowest points in a week': 'min',
    'Lowest average fantasy points': 'min'
  };
  const result = {};
  for (const [label, direction] of Object.entries(directions)) {
    let best = null;
    for (const year of YEARS) {
      const stat = actualByYear[year].statActual[label];
      const n = comparableStatValue(label, stat.value);
      if (!Number.isFinite(n)) continue;
      if (!best || (direction === 'max' ? n > best.n : n < best.n)) best = { n, value: stat.value, holders: [{ year, teams: stat.teams }] };
      else if (Math.abs(n - best.n) < 1e-9) best.holders.push({ year, teams: stat.teams });
    }
    result[label] = best;
  }
  return result;
}

function siteAllTime(siteSeasons) {
  const directions = {
    'Longest losing streak of the season': 'max',
    'Longest winning streak of the season': 'max',
    'Best regular season record': 'max',
    'Worst regular season record': 'min',
    'Most total points': 'max',
    'Lowest total points scored': 'min',
    'Closest matchup of the season': 'min',
    'Biggest blowout of the season': 'max',
    'Highest average fantasy points': 'max',
    'Highest points in week': 'max',
    'Lowest points in a week': 'min',
    'Lowest average fantasy points': 'min'
  };
  const result = {};
  for (const [label, direction] of Object.entries(directions)) {
    let best = null;
    for (const year of YEARS) {
      const stat = siteSeasons[year].seasonStats.find(s => s.label === label);
      if (!stat) continue;
      const n = comparableStatValue(label, stat.value);
      if (!Number.isFinite(n)) continue;
      if (!best || (direction === 'max' ? n > best.n : n < best.n)) best = { n, value: stat.value, holders: [{ year, teams: stat.teams }] };
      else if (Math.abs(n - best.n) < 1e-9) best.holders.push({ year, teams: stat.teams });
    }
    result[label] = best;
  }
  return result;
}

function deriveFranchiseMetrics(standingsByYear) {
  const rows = {};
  for (const year of YEARS) {
    for (const row of standingsByYear[year]) {
      rows[row.teamId] ||= [];
      rows[row.teamId].push({ year, ...row });
    }
  }
  const out = {};
  for (const [teamId, teamRows] of Object.entries(rows)) {
    const playoffYears = teamRows.filter(r => r.seed <= 6).map(r => r.year);
    const bestWins = Math.max(...teamRows.map(r => r.wins ?? Number(normRecord(r.record).split('-')[0])));
    const bestRows = teamRows.filter(r => (r.wins ?? Number(normRecord(r.record).split('-')[0])) === bestWins);
    const bestFinish = Math.min(...teamRows.map(r => r.seed));
    out[teamId] = {
      playoffYears,
      firstSeedYears: teamRows.filter(r => r.seed === 1).map(r => r.year),
      bestRecord: `${bestWins}-${14 - bestWins}`,
      bestRecordYears: bestRows.map(r => r.year),
      bestFinish,
      bestFinishYears: teamRows.filter(r => r.seed === bestFinish).map(r => r.year)
    };
  }
  return out;
}

async function sleeperChampion(year, rosterMap) {
  try {
    const bracket = await readJson(path.join(SLEEPER_ROOT, String(year), 'winners-bracket.json'));
    const placementOne = bracket.find(node => Number(node.p) === 1 && node.w != null);
    if (placementOne) return rosterMap.get(Number(placementOne.w)) || null;
    const completed = bracket.filter(node => node.w != null);
    const maxRound = Math.max(...completed.map(node => Number(node.r || 0)));
    const finals = completed.filter(node => Number(node.r || 0) === maxRound);
    return finals.length === 1 ? rosterMap.get(Number(finals[0].w)) || null : null;
  } catch {
    return null;
  }
}

async function main() {
  const policy = await readJson(path.join(SLEEPER_ROOT, 'identity-policy.json'));
  const site = await loadSiteData();
  const actual = {};
  for (const year of YEARS) actual[year] = await computeSleeperSeason(year, site.seasons[year], policy);

  const standingsChecks = [];
  for (const year of YEARS) {
    const actualById = new Map(actual[year].standings.map(row => [row.teamId, row]));
    for (const siteRow of site.seasons[year].standings) {
      const a = actualById.get(siteRow.teamId);
      const actualRecord = a ? `${a.wins}-${a.losses}` : null;
      const checks = a ? {
        record: normRecord(siteRow.record) === actualRecord,
        pf: Math.abs(Number(siteRow.pf) - a.pf) < 0.005,
        pa: Math.abs(Number(siteRow.pa) - a.pa) < 0.005,
        seed: Number(siteRow.seed) === Number(a.seed)
      } : { record: false, pf: false, pa: false, seed: false };
      standingsChecks.push({ year, teamId: siteRow.teamId, site: siteRow, actual: a ? { seed: a.seed, record: actualRecord, pf: a.pf, pa: a.pa } : null, status: Object.values(checks).every(Boolean) ? 'PASS' : 'MISMATCH', checks });
    }
  }

  const statChecks = [];
  for (const year of YEARS) {
    for (const siteStat of site.seasons[year].seasonStats) {
      const actualStat = actual[year].statActual[siteStat.label];
      const comparison = compareStat(siteStat, actualStat);
      statChecks.push({ year, label: siteStat.label, site: { value: siteStat.value, teams: siteStat.teams, details: siteStat.details || null }, actual: actualStat || null, ...comparison });
    }
  }

  const actualH2H = h2hWinsFromGames(actual);
  const allTeamIds = Object.keys(policy.franchises || {});
  const h2hChecks = [];
  for (const a of allTeamIds) {
    for (const b of allTeamIds) {
      if (a === b) continue;
      const siteWins = Number(site.h2h.wins?.[a]?.[b] || 0);
      const rawWins = Number(actualH2H.wins?.[a]?.[b] || 0);
      h2hChecks.push({ a, b, siteWins, actualWins: rawWins, status: siteWins === rawWins ? 'PASS' : 'MISMATCH' });
    }
  }

  const championChecks = [];
  for (const year of YEARS) {
    const champion = await sleeperChampion(year, actual[year].rosterMap);
    championChecks.push({ year, siteChampion: site.seasons[year].championTeamId, sleeperChampion: champion, status: champion ? (champion === site.seasons[year].championTeamId ? 'PASS' : 'MISMATCH') : 'UNVERIFIED' });
  }

  const actualAT = actualAllTime(actual);
  const siteAT = siteAllTime(site.seasons);
  const allTimeChecks = Object.keys(actualAT).map(label => {
    const a = actualAT[label];
    const s = siteAT[label];
    const siteHolders = (s?.holders || []).flatMap(h => h.teams.map(teamId => `${h.year}:${teamId}`));
    const actualHolders = (a?.holders || []).flatMap(h => h.teams.map(teamId => `${h.year}:${teamId}`));
    const valueOk = label.toLowerCase().includes('record') ? normRecord(s?.value) === normRecord(a?.value) : Math.abs(Number(s?.n) - Number(a?.n)) < 1e-6;
    return { label, site: s, actual: a, status: valueOk && sameSet(siteHolders, actualHolders) ? 'PASS' : 'MISMATCH' };
  });

  const siteStandingsForFranchise = {};
  const actualStandingsForFranchise = {};
  for (const year of YEARS) {
    siteStandingsForFranchise[year] = site.seasons[year].standings.map(row => ({ ...row, wins: Number(normRecord(row.record).split('-')[0]) }));
    actualStandingsForFranchise[year] = actual[year].standings;
  }
  const siteFranchise = deriveFranchiseMetrics(siteStandingsForFranchise);
  const actualFranchise = deriveFranchiseMetrics(actualStandingsForFranchise);
  const franchiseChecks = [];
  for (const teamId of new Set([...Object.keys(siteFranchise), ...Object.keys(actualFranchise)])) {
    const s = siteFranchise[teamId];
    const a = actualFranchise[teamId];
    const status = s && a && sameSet(s.playoffYears, a.playoffYears) && sameSet(s.firstSeedYears, a.firstSeedYears) && normRecord(s.bestRecord) === normRecord(a.bestRecord) && sameSet(s.bestRecordYears, a.bestRecordYears) && s.bestFinish === a.bestFinish && sameSet(s.bestFinishYears, a.bestFinishYears) ? 'PASS' : 'MISMATCH';
    franchiseChecks.push({ teamId, site: s || null, actual: a || null, status });
  }

  const report = {
    generated_at_utc: new Date().toISOString(),
    scope: 'SCL published 2021-2025 regular-season standings/stats, H2H Weeks 1-14, All Time Records derived from season stats, Franchise Hub regular-season metrics, and champions where Sleeper winner bracket is available.',
    policies: {
      regular_season_weeks: 'Weeks 1-14',
      arshamaa_2025: 'Roster 9 maps to ArShamaa for H2H/history; intentionally excluded from published 2025 standings and season-stat eligibility.',
      trablos_abethe3arab: 'Roster 8 is Abethe3Arab in 2024 and Trablos United in 2025; never merged.',
      season_2020: 'Not audited: archived on ESPN and outside the Sleeper renewal chain.',
      best_team_reports: 'Not independently verifiable from the raw public matchup/bracket endpoints currently mirrored.'
    },
    identity_unresolved: Object.fromEntries(YEARS.map(year => [year, actual[year].unresolved])),
    summary: {},
    standings: standingsChecks,
    season_stats: statChecks,
    h2h: {
      site_games_count: site.h2h.gamesCount,
      actual_games_count: actualH2H.gamesCount,
      game_count_status: Number(site.h2h.gamesCount) === actualH2H.gamesCount ? 'PASS' : 'MISMATCH',
      cells: h2hChecks
    },
    champions: championChecks,
    all_time_records: allTimeChecks,
    franchise_hub_regular_season: franchiseChecks
  };

  const count = (items, status) => items.filter(x => x.status === status).length;
  report.summary = {
    standings_rows_checked: standingsChecks.length,
    standings_mismatches: count(standingsChecks, 'MISMATCH'),
    season_stats_checked: statChecks.length,
    season_stats_mismatches: count(statChecks, 'MISMATCH'),
    season_stats_unverified: count(statChecks, 'UNVERIFIED'),
    h2h_cells_checked: h2hChecks.length,
    h2h_mismatches: count(h2hChecks, 'MISMATCH'),
    h2h_game_count_status: report.h2h.game_count_status,
    champions_checked: championChecks.length,
    champion_mismatches: count(championChecks, 'MISMATCH'),
    champions_unverified: count(championChecks, 'UNVERIFIED'),
    all_time_records_checked: allTimeChecks.length,
    all_time_mismatches: count(allTimeChecks, 'MISMATCH'),
    franchise_profiles_checked: franchiseChecks.length,
    franchise_profile_mismatches: count(franchiseChecks, 'MISMATCH')
  };
  report.summary.overall_status = [report.summary.standings_mismatches, report.summary.season_stats_mismatches, report.summary.h2h_mismatches, report.summary.champion_mismatches, report.summary.all_time_mismatches, report.summary.franchise_profile_mismatches].some(Boolean) ? 'REVIEW_REQUIRED' : 'PASS';

  await mkdir(AUDIT_ROOT, { recursive: true });
  await writeFile(path.join(AUDIT_ROOT, 'sleeper-vs-site.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  const mismatchStandings = standingsChecks.filter(x => x.status === 'MISMATCH');
  const mismatchStats = statChecks.filter(x => x.status === 'MISMATCH');
  const mismatchH2H = h2hChecks.filter(x => x.status === 'MISMATCH');
  const mismatchAT = allTimeChecks.filter(x => x.status === 'MISMATCH');
  const mismatchFranchise = franchiseChecks.filter(x => x.status === 'MISMATCH');
  const championIssues = championChecks.filter(x => x.status !== 'PASS');
  const md = [
    '# SCL Sleeper Integrity Audit',
    '',
    `Overall: **${report.summary.overall_status}**`,
    '',
    `- Standings: ${standingsChecks.length - mismatchStandings.length}/${standingsChecks.length} rows match`,
    `- Season stats: ${statChecks.length - mismatchStats.length - count(statChecks, 'UNVERIFIED')}/${statChecks.length - count(statChecks, 'UNVERIFIED')} API-verifiable cards match; ${count(statChecks, 'UNVERIFIED')} not API-verifiable`,
    `- H2H: ${h2hChecks.length - mismatchH2H.length}/${h2hChecks.length} directed cells match; games ${site.h2h.gamesCount}/${actualH2H.gamesCount}`,
    `- Champions: ${championChecks.length - championIssues.length}/${championChecks.length} confirmed from mirrored winner brackets`,
    `- All Time Records: ${allTimeChecks.length - mismatchAT.length}/${allTimeChecks.length} match`,
    `- Franchise Hub regular-season profiles: ${franchiseChecks.length - mismatchFranchise.length}/${franchiseChecks.length} match`,
    '',
    '## Standings mismatches',
    ...(mismatchStandings.length ? mismatchStandings.map(x => `- ${x.year} ${x.teamId}: site ${x.site.record}, PF ${x.site.pf}, PA ${x.site.pa}, seed ${x.site.seed}; Sleeper ${x.actual?.record}, PF ${x.actual?.pf}, PA ${x.actual?.pa}, seed ${x.actual?.seed}`) : ['- None']),
    '',
    '## Season-stat mismatches',
    ...(mismatchStats.length ? mismatchStats.map(x => `- ${x.year} ${x.label}: site=${JSON.stringify(x.site)}; Sleeper=${JSON.stringify(x.actual)}`) : ['- None']),
    '',
    '## H2H mismatches',
    ...(mismatchH2H.length ? mismatchH2H.map(x => `- ${x.a} vs ${x.b}: site ${x.siteWins}, Sleeper ${x.actualWins}`) : ['- None']),
    '',
    '## Champion issues',
    ...(championIssues.length ? championIssues.map(x => `- ${x.year}: site ${x.siteChampion}; Sleeper ${x.sleeperChampion || 'unverified'} (${x.status})`) : ['- None']),
    '',
    '## All-Time mismatches',
    ...(mismatchAT.length ? mismatchAT.map(x => `- ${x.label}: site=${JSON.stringify(x.site)}; Sleeper=${JSON.stringify(x.actual)}`) : ['- None']),
    '',
    '## Franchise Hub regular-season mismatches',
    ...(mismatchFranchise.length ? mismatchFranchise.map(x => `- ${x.teamId}: site=${JSON.stringify(x.site)}; Sleeper=${JSON.stringify(x.actual)}`) : ['- None']),
    '',
    '## Audit notes',
    '- 2020 is not part of this Sleeper audit because that season is archived on ESPN.',
    '- 2025 ArShamaa scheduled games remain included in H2H/history but ArShamaa is intentionally excluded from the 2025 standings/stat-card eligibility.',
    '- “Most Best Team Sleeper reports” is not exposed by the raw public matchup/bracket endpoints used here and is reported as unverified rather than assumed correct.',
    '- This audit never edits visible website data.'
  ].join('\n');
  await writeFile(path.join(AUDIT_ROOT, 'sleeper-vs-site.md'), `${md}\n`, 'utf8');

  console.log(JSON.stringify(report.summary));
}

main().catch(error => { console.error(error); process.exitCode = 1; });
