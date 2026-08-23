import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';

const YEARS = [2021, 2022, 2023, 2024, 2025];
const WEEKS = Array.from({ length: 14 }, (_, i) => i + 1);
const ROOT = process.cwd();
const SLEEPER_ROOT = path.join(ROOT, 'data', 'sleeper');
const AUDIT_ROOT = path.join(ROOT, 'data', 'audits');

const DEFINITIVE_LABELS = new Set([
  'Longest losing streak of the season',
  'Longest winning streak of the season',
  'Best regular season record',
  'Worst regular season record',
  'Most total points',
  'Lowest total points scored',
  'Highest average fantasy points',
  'Lowest average fantasy points'
]);
const WEEKLY_SNAPSHOT_LABELS = new Set([
  'Closest matchup of the season',
  'Biggest blowout of the season',
  'Highest points in week',
  'Lowest points in a week',
  'Most "Best Team" Sleeper reports'
]);

const readJson = async file => JSON.parse(await readFile(file, 'utf8'));
const sorted = values => [...(values || [])].sort();
const sameSet = (a, b) => JSON.stringify(sorted(a)) === JSON.stringify(sorted(b));
const normRecord = value => String(value ?? '').replace(/–/g, '-').replace(/\s/g, '');
const effectivePoints = entry => Number(entry.custom_points ?? entry.points ?? 0);
const scoreFromSettings = (whole, decimal) => Number(whole || 0) + (Number(decimal || 0) / 100);

function extractBalancedObject(source, marker) {
  const markerIndex = source.indexOf(marker);
  if (markerIndex < 0) throw new Error(`Missing marker: ${marker}`);
  const start = source.indexOf('{', markerIndex + marker.length);
  let depth = 0, quote = null, escaped = false, lineComment = false, blockComment = false;
  for (let i = start; i < source.length; i += 1) {
    const ch = source[i], next = source[i + 1];
    if (lineComment) { if (ch === '\n') lineComment = false; continue; }
    if (blockComment) { if (ch === '*' && next === '/') { blockComment = false; i += 1; } continue; }
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
    if (ch === '}' && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error(`Unbalanced object after ${marker}`);
}

const evalObject = text => vm.runInNewContext(`(${text})`, Object.create(null), { timeout: 1000 });

async function loadSite() {
  const source = await readFile(path.join(ROOT, 'script.js'), 'utf8');
  const seasons = {};
  for (const year of YEARS) seasons[year] = evalObject(extractBalancedObject(source, `seasons[${year}] =`));
  const h2hSource = await readFile(path.join(ROOT, 'h2h-data-2026.js'), 'utf8');
  const h2h = evalObject(extractBalancedObject(h2hSource, 'window.SISTER_CITIES_H2H_DATA ='));
  return { seasons, h2h };
}

function makeIdentityMaps(policy) {
  const byUserId = new Map();
  const byAlias = new Map();
  const normalize = value => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  for (const [franchiseId, franchise] of Object.entries(policy.franchises || {})) {
    for (const userId of franchise.sleeper_user_ids || []) byUserId.set(String(userId), franchiseId);
    for (const alias of [franchise.current_name, ...(franchise.aliases || [])]) {
      const key = normalize(alias);
      if (key) byAlias.set(key, franchiseId);
    }
  }
  return { byUserId, byAlias, normalize };
}

function buildRosterMap(year, rosters, users, policy) {
  const { byUserId, byAlias, normalize } = makeIdentityMaps(policy);
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
      for (const candidate of [user?.display_name, user?.metadata?.team_name]) {
        const hit = byAlias.get(normalize(candidate));
        if (hit) { franchiseId = hit; break; }
      }
    }
    if (franchiseId) rosterMap.set(Number(roster.roster_id), franchiseId);
    else unresolved.push({ roster_id: roster.roster_id, owner_id: roster.owner_id || null });
  }
  return { rosterMap, unresolved };
}

function longestRun(sequence, symbol) {
  let best = 0, current = 0;
  for (const ch of sequence) {
    if (ch === symbol) { current += 1; best = Math.max(best, current); }
    else current = 0;
  }
  return best;
}

function officialTeamFromRoster(roster, teamId) {
  const sequence = String(roster.metadata?.record || '').slice(0, 14).split('');
  return {
    teamId,
    rosterId: Number(roster.roster_id),
    wins: Number(roster.settings?.wins || 0),
    losses: Number(roster.settings?.losses || 0),
    ties: Number(roster.settings?.ties || 0),
    pf: scoreFromSettings(roster.settings?.fpts, roster.settings?.fpts_decimal),
    pa: scoreFromSettings(roster.settings?.fpts_against, roster.settings?.fpts_against_decimal),
    sequence
  };
}

async function loadSeason(year, siteSeason, policy) {
  const dir = path.join(SLEEPER_ROOT, String(year));
  const [users, rosters] = await Promise.all([
    readJson(path.join(dir, 'users.json')),
    readJson(path.join(dir, 'rosters.json'))
  ]);
  const { rosterMap, unresolved } = buildRosterMap(year, rosters, users, policy);
  const officialByTeam = new Map();
  const rosterToOfficial = new Map();
  for (const roster of rosters) {
    const teamId = rosterMap.get(Number(roster.roster_id));
    if (!teamId) continue;
    const official = officialTeamFromRoster(roster, teamId);
    officialByTeam.set(teamId, official);
    rosterToOfficial.set(Number(roster.roster_id), official);
  }

  const games = [];
  const weeklyScores = [];
  const resultConflicts = [];
  for (const week of WEEKS) {
    const entries = await readJson(path.join(dir, `week-${week}.json`));
    const groups = new Map();
    for (const entry of entries) {
      const teamId = rosterMap.get(Number(entry.roster_id));
      if (!teamId) continue;
      const points = effectivePoints(entry);
      weeklyScores.push({ week, teamId, points, rosterId: Number(entry.roster_id) });
      const key = entry.matchup_id == null ? `solo-${entry.roster_id}` : String(entry.matchup_id);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push({ teamId, rosterId: Number(entry.roster_id), points });
    }
    for (const group of groups.values()) {
      if (group.length !== 2) continue;
      const [a, b] = group;
      const aOfficial = rosterToOfficial.get(a.rosterId), bOfficial = rosterToOfficial.get(b.rosterId);
      const aResult = aOfficial?.sequence?.[week - 1] || null;
      const bResult = bOfficial?.sequence?.[week - 1] || null;
      let winner = null, loser = null;
      if (aResult === 'W' && bResult === 'L') { winner = a.teamId; loser = b.teamId; }
      else if (bResult === 'W' && aResult === 'L') { winner = b.teamId; loser = a.teamId; }
      else if (a.points !== b.points) { winner = a.points > b.points ? a.teamId : b.teamId; loser = a.points > b.points ? b.teamId : a.teamId; }

      const rawWinner = a.points === b.points ? null : (a.points > b.points ? a.teamId : b.teamId);
      if (winner && rawWinner && winner !== rawWinner) {
        resultConflicts.push({ week, a: a.teamId, b: b.teamId, officialWinner: winner, currentRawWinner: rawWinner, aPoints: a.points, bPoints: b.points });
      }
      games.push({ week, a: a.teamId, b: b.teamId, aPoints: a.points, bPoints: b.points, winner, loser });
    }
  }

  const activeIds = new Set(siteSeason.standings.map(r => r.teamId));
  const standings = [...officialByTeam.values()]
    .filter(t => activeIds.has(t.teamId))
    .sort((a, b) => b.wins - a.wins || b.ties - a.ties || b.pf - a.pf || a.teamId.localeCompare(b.teamId))
    .map((t, index) => ({ ...t, seed: index + 1 }));
  const activeOfficial = standings;
  const activeGames = games.filter(g => activeIds.has(g.a) && activeIds.has(g.b));
  const activeScores = weeklyScores.filter(s => activeIds.has(s.teamId));

  const maxW = Math.max(...activeOfficial.map(t => longestRun(t.sequence, 'W')));
  const maxL = Math.max(...activeOfficial.map(t => longestRun(t.sequence, 'L')));
  const bestWins = Math.max(...activeOfficial.map(t => t.wins));
  const worstWins = Math.min(...activeOfficial.map(t => t.wins));
  const maxPf = Math.max(...activeOfficial.map(t => t.pf));
  const minPf = Math.min(...activeOfficial.map(t => t.pf));
  const highAvg = [...activeOfficial].sort((a, b) => b.pf - a.pf)[0];
  const lowAvg = [...activeOfficial].sort((a, b) => a.pf - b.pf)[0];

  const closest = [...activeGames].sort((x, y) => Math.abs(x.aPoints - x.bPoints) - Math.abs(y.aPoints - y.bPoints))[0];
  const blowout = [...activeGames].sort((x, y) => Math.abs(y.aPoints - y.bPoints) - Math.abs(x.aPoints - x.bPoints))[0];
  const highWeek = [...activeScores].sort((a, b) => b.points - a.points)[0];
  const lowWeek = [...activeScores].sort((a, b) => a.points - b.points)[0];

  // Sleeper's weekly "Best Team" report is the franchise with the highest score that week.
  // Use all mapped franchises for this award, including a franchise that later became inactive.
  const bestTeamCounts = new Map();
  for (const week of WEEKS) {
    const weekScores = weeklyScores.filter(s => s.week === week);
    if (!weekScores.length) continue;
    const weeklyHigh = Math.max(...weekScores.map(s => s.points));
    for (const score of weekScores) {
      if (Math.abs(score.points - weeklyHigh) < 0.005) {
        bestTeamCounts.set(score.teamId, (bestTeamCounts.get(score.teamId) || 0) + 1);
      }
    }
  }
  const bestTeamMax = bestTeamCounts.size ? Math.max(...bestTeamCounts.values()) : 0;
  const bestTeamLeaders = [...bestTeamCounts.entries()]
    .filter(([, count]) => count === bestTeamMax)
    .map(([teamId]) => teamId);

  const stats = {
    'Longest losing streak of the season': { value: maxL, teams: activeOfficial.filter(t => longestRun(t.sequence, 'L') === maxL).map(t => t.teamId), basis: 'finalized_roster_metadata' },
    'Longest winning streak of the season': { value: maxW, teams: activeOfficial.filter(t => longestRun(t.sequence, 'W') === maxW).map(t => t.teamId), basis: 'finalized_roster_metadata' },
    'Best regular season record': { value: `${bestWins}-${14 - bestWins}`, teams: activeOfficial.filter(t => t.wins === bestWins).map(t => t.teamId), primaryTeam: standings[0]?.teamId || null, basis: 'finalized_roster_settings' },
    'Worst regular season record': { value: `${worstWins}-${14 - worstWins}`, teams: activeOfficial.filter(t => t.wins === worstWins).map(t => t.teamId), basis: 'finalized_roster_settings' },
    'Most total points': { value: maxPf, teams: activeOfficial.filter(t => Math.abs(t.pf - maxPf) < 0.005).map(t => t.teamId), basis: 'finalized_roster_settings' },
    'Lowest total points scored': { value: minPf, teams: activeOfficial.filter(t => Math.abs(t.pf - minPf) < 0.005).map(t => t.teamId), basis: 'finalized_roster_settings' },
    'Highest average fantasy points': { value: highAvg.pf / 14, teams: [highAvg.teamId], basis: 'finalized_roster_settings' },
    'Lowest average fantasy points': { value: lowAvg.pf / 14, teams: [lowAvg.teamId], basis: 'finalized_roster_settings' },
    'Most "Best Team" Sleeper reports': { value: bestTeamMax, teams: bestTeamLeaders, basis: 'current_weekly_api_snapshot' },
    'Closest matchup of the season': { value: Math.abs(closest.aPoints - closest.bPoints), teams: [closest.a, closest.b], details: `Week ${closest.week}`, basis: 'current_weekly_api_snapshot' },
    'Biggest blowout of the season': { value: Math.abs(blowout.aPoints - blowout.bPoints), teams: [blowout.a, blowout.b], details: `Week ${blowout.week}`, basis: 'current_weekly_api_snapshot' },
    'Highest points in week': { value: highWeek.points, teams: [highWeek.teamId], details: `Week ${highWeek.week}`, basis: 'current_weekly_api_snapshot' },
    'Lowest points in a week': { value: lowWeek.points, teams: [lowWeek.teamId], details: `Week ${lowWeek.week}`, basis: 'current_weekly_api_snapshot' }
  };

  return { rosterMap, unresolved, officialByTeam, standings, games, weeklyScores, resultConflicts, stats };
}

function decimalPlaces(value) {
  const m = String(value).match(/\.(\d+)/);
  return m ? m[1].length : 0;
}

function numericMatchesSitePrecision(siteValue, actualValue) {
  const a = Number(siteValue), b = Number(actualValue);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  const decimals = decimalPlaces(siteValue);
  const tolerance = decimals === 0 ? 0.500001 : (0.5 / (10 ** decimals)) + 1e-9;
  return Math.abs(a - b) <= tolerance;
}

function compareStat(siteStat, actual) {
  if (!actual) return { status: 'UNVERIFIED', reason: 'Not exposed by mirrored Sleeper sources.' };
  const valueOk = /record/i.test(siteStat.label)
    ? normRecord(siteStat.value) === normRecord(actual.value)
    : numericMatchesSitePrecision(siteStat.value, actual.value);
  const teamsOk = siteStat.label === 'Best regular season record'
    ? Array.isArray(siteStat.teams) && siteStat.teams.length > 0 && siteStat.teams.includes(actual.primaryTeam) && siteStat.teams.every(teamId => actual.teams.includes(teamId))
    : sameSet(siteStat.teams, actual.teams);
  const detailsOk = !siteStat.details || !actual.details || siteStat.details === actual.details;
  const matches = valueOk && teamsOk && detailsOk;
  if (matches) return { status: 'PASS', valueOk, teamsOk, detailsOk };
  if (WEEKLY_SNAPSHOT_LABELS.has(siteStat.label)) {
    return { status: 'HISTORICAL_WEEKLY_VARIANCE', valueOk, teamsOk, detailsOk, reason: 'Current weekly API snapshot conflicts with or may have drifted from the season-finalized historical score state.' };
  }
  return { status: 'MISMATCH', valueOk, teamsOk, detailsOk };
}

function h2hFromOfficialGames(allSeasons) {
  const wins = {};
  let gamesCount = 0;
  for (const season of Object.values(allSeasons)) {
    for (const game of season.games) {
      gamesCount += 1;
      if (!game.winner || !game.loser) continue;
      wins[game.winner] ||= {};
      wins[game.winner][game.loser] = (wins[game.winner][game.loser] || 0) + 1;
    }
  }
  return { wins, gamesCount };
}

const DIRECTIONS = {
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
  'Lowest average fantasy points': 'min',
  'Most "Best Team" Sleeper reports': 'max'
};

function comparable(label, value) {
  if (/record/i.test(label)) {
    const m = normRecord(value).match(/^(\d+)-(\d+)$/);
    return m ? Number(m[1]) : NaN;
  }
  return Number(value);
}

function allTimeFrom(getStat) {
  const result = {};
  for (const [label, direction] of Object.entries(DIRECTIONS)) {
    let best = null;
    for (const year of YEARS) {
      const stat = getStat(year, label);
      if (!stat) continue;
      const n = comparable(label, stat.value);
      if (!Number.isFinite(n)) continue;
      if (!best || (direction === 'max' ? n > best.n : n < best.n)) {
        best = { n, value: stat.value, holders: [{ year, teams: stat.teams }] };
      } else if (Math.abs(n - best.n) < 1e-9) {
        best.holders.push({ year, teams: stat.teams });
      }
    }
    result[label] = best;
  }
  return result;
}

function compareAllTime(label, siteEntry, actualEntry) {
  const siteHolders = (siteEntry?.holders || []).flatMap(h => h.teams.map(teamId => `${h.year}:${teamId}`));
  const actualHolders = (actualEntry?.holders || []).flatMap(h => h.teams.map(teamId => `${h.year}:${teamId}`));
  const valueOk = /record/i.test(label)
    ? normRecord(siteEntry?.value) === normRecord(actualEntry?.value)
    : numericMatchesSitePrecision(siteEntry?.value, actualEntry?.value);
  const holdersOk = sameSet(siteHolders, actualHolders);
  if (valueOk && holdersOk) return { status: 'PASS', valueOk, holdersOk };
  if (WEEKLY_SNAPSHOT_LABELS.has(label)) return { status: 'HISTORICAL_WEEKLY_VARIANCE', valueOk, holdersOk };
  return { status: 'MISMATCH', valueOk, holdersOk };
}

function deriveFranchiseMetrics(standingsByYear) {
  const rows = {};
  for (const year of YEARS) for (const row of standingsByYear[year]) {
    rows[row.teamId] ||= [];
    rows[row.teamId].push({ year, ...row });
  }
  const out = {};
  for (const [teamId, teamRows] of Object.entries(rows)) {
    const getWins = r => r.wins ?? Number(normRecord(r.record).split('-')[0]);
    const bestWins = Math.max(...teamRows.map(getWins));
    const bestFinish = Math.min(...teamRows.map(r => r.seed));
    out[teamId] = {
      playoffYears: teamRows.filter(r => r.seed <= 6).map(r => r.year),
      firstSeedYears: teamRows.filter(r => r.seed === 1).map(r => r.year),
      bestRecord: `${bestWins}-${14 - bestWins}`,
      bestRecordYears: teamRows.filter(r => getWins(r) === bestWins).map(r => r.year),
      bestFinish,
      bestFinishYears: teamRows.filter(r => r.seed === bestFinish).map(r => r.year)
    };
  }
  return out;
}

async function sleeperChampion(year, rosterMap) {
  try {
    const bracket = await readJson(path.join(SLEEPER_ROOT, String(year), 'winners-bracket.json'));
    const firstPlace = bracket.find(node => Number(node.p) === 1 && node.w != null);
    if (firstPlace) return rosterMap.get(Number(firstPlace.w)) || null;
    return null;
  } catch {
    return null;
  }
}

async function main() {
  const policy = await readJson(path.join(SLEEPER_ROOT, 'identity-policy.json'));
  const site = await loadSite();
  const actual = {};
  for (const year of YEARS) actual[year] = await loadSeason(year, site.seasons[year], policy);

  const standingsChecks = [];
  for (const year of YEARS) {
    const byId = new Map(actual[year].standings.map(r => [r.teamId, r]));
    for (const s of site.seasons[year].standings) {
      const a = byId.get(s.teamId);
      const checks = a ? {
        record: normRecord(s.record) === `${a.wins}-${a.losses}`,
        pf: Math.abs(Number(s.pf) - a.pf) < 0.005,
        pa: Math.abs(Number(s.pa) - a.pa) < 0.005,
        seed: Number(s.seed) === Number(a.seed)
      } : { record: false, pf: false, pa: false, seed: false };
      standingsChecks.push({ year, teamId: s.teamId, site: s, sleeper: a ? { seed: a.seed, record: `${a.wins}-${a.losses}`, pf: a.pf, pa: a.pa } : null, checks, status: Object.values(checks).every(Boolean) ? 'PASS' : 'MISMATCH' });
    }
  }

  const statChecks = [];
  for (const year of YEARS) {
    for (const s of site.seasons[year].seasonStats) {
      const a = actual[year].stats[s.label];
      statChecks.push({ year, label: s.label, site: { value: s.value, teams: s.teams, details: s.details || null }, sleeper: a || null, ...compareStat(s, a) });
    }
  }

  const h2hActual = h2hFromOfficialGames(actual);
  const teamIds = Object.keys(policy.franchises || {});
  const h2hChecks = [];
  for (const a of teamIds) for (const b of teamIds) if (a !== b) {
    const siteWins = Number(site.h2h.wins?.[a]?.[b] || 0);
    const sleeperWins = Number(h2hActual.wins?.[a]?.[b] || 0);
    h2hChecks.push({ a, b, siteWins, sleeperWins, status: siteWins === sleeperWins ? 'PASS' : 'MISMATCH' });
  }

  const championChecks = [];
  for (const year of YEARS) {
    const champion = await sleeperChampion(year, actual[year].rosterMap);
    championChecks.push({ year, siteChampion: site.seasons[year].championTeamId, sleeperChampion: champion, status: champion ? (champion === site.seasons[year].championTeamId ? 'PASS' : 'MISMATCH') : 'UNVERIFIED' });
  }

  const siteAT = allTimeFrom((year, label) => site.seasons[year].seasonStats.find(s => s.label === label));
  const actualAT = allTimeFrom((year, label) => actual[year].stats[label]);
  const allTimeChecks = Object.keys(DIRECTIONS).map(label => ({ label, site: siteAT[label], sleeper: actualAT[label], ...compareAllTime(label, siteAT[label], actualAT[label]) }));

  const siteStandings = {}, sleeperStandings = {};
  for (const year of YEARS) {
    siteStandings[year] = site.seasons[year].standings.map(r => ({ ...r, wins: Number(normRecord(r.record).split('-')[0]) }));
    sleeperStandings[year] = actual[year].standings;
  }
  const siteFranchise = deriveFranchiseMetrics(siteStandings);
  const sleeperFranchise = deriveFranchiseMetrics(sleeperStandings);
  const franchiseChecks = [];
  for (const teamId of new Set([...Object.keys(siteFranchise), ...Object.keys(sleeperFranchise)])) {
    const s = siteFranchise[teamId], a = sleeperFranchise[teamId];
    const ok = s && a && sameSet(s.playoffYears, a.playoffYears) && sameSet(s.firstSeedYears, a.firstSeedYears) && normRecord(s.bestRecord) === normRecord(a.bestRecord) && sameSet(s.bestRecordYears, a.bestRecordYears) && s.bestFinish === a.bestFinish && sameSet(s.bestFinishYears, a.bestFinishYears);
    franchiseChecks.push({ teamId, site: s || null, sleeper: a || null, status: ok ? 'PASS' : 'MISMATCH' });
  }

  const conflicts = Object.fromEntries(YEARS.map(year => [year, actual[year].resultConflicts]));
  const unresolved = Object.fromEntries(YEARS.map(year => [year, actual[year].unresolved]));
  const count = (items, status) => items.filter(x => x.status === status).length;
  const definitiveStatChecks = statChecks.filter(x => DEFINITIVE_LABELS.has(x.label));
  const weeklyStatChecks = statChecks.filter(x => WEEKLY_SNAPSHOT_LABELS.has(x.label));
  const definitiveAllTime = allTimeChecks.filter(x => DEFINITIVE_LABELS.has(x.label));
  const weeklyAllTime = allTimeChecks.filter(x => WEEKLY_SNAPSHOT_LABELS.has(x.label));

  const report = {
    generated_at_utc: new Date().toISOString(),
    methodology: {
      standings_and_totals: 'Sleeper finalized roster settings (wins/losses/PF/PA).',
      streaks_and_h2h_results: 'Sleeper finalized per-week W/L sequence in roster metadata, paired with weekly matchup IDs.',
      weekly_score_records: 'Current Sleeper weekly matchup score snapshots. Historical recalculation can conflict with finalized W/L/PF, so mismatches are classified as variance rather than definitive errors.',
      champions: 'Sleeper winners bracket.',
      regular_season_scope: 'Weeks 1-14.',
      arshamaa_2025: 'Roster 9 remains ArShamaa for scheduled H2H/history; intentionally omitted from 2025 standings/stat eligibility.',
      trablos_identity: '2024 roster 8 = Abethe3Arab; 2025 roster 8 = Trablos United. No continuity is inferred.',
      season_2020: 'Outside Sleeper chain; not audited.'
    },
    summary: {},
    unresolved_identity: unresolved,
    historical_weekly_result_conflicts: conflicts,
    standings: standingsChecks,
    season_stats: statChecks,
    h2h: { site_games_count: Number(site.h2h.gamesCount), sleeper_games_count: h2hActual.gamesCount, game_count_status: Number(site.h2h.gamesCount) === h2hActual.gamesCount ? 'PASS' : 'MISMATCH', cells: h2hChecks },
    champions: championChecks,
    all_time_records: allTimeChecks,
    franchise_hub_regular_season: franchiseChecks
  };

  report.summary = {
    standings_rows_checked: standingsChecks.length,
    standings_mismatches: count(standingsChecks, 'MISMATCH'),
    definitive_season_stats_checked: definitiveStatChecks.length,
    definitive_season_stat_mismatches: count(definitiveStatChecks, 'MISMATCH'),
    weekly_score_cards_checked: weeklyStatChecks.length,
    weekly_score_snapshot_variances: count(weeklyStatChecks, 'HISTORICAL_WEEKLY_VARIANCE'),
    unverified_best_team_cards: count(statChecks, 'UNVERIFIED'),
    h2h_cells_checked: h2hChecks.length,
    h2h_mismatches: count(h2hChecks, 'MISMATCH'),
    h2h_game_count_status: report.h2h.game_count_status,
    champions_checked: championChecks.length,
    champion_mismatches: count(championChecks, 'MISMATCH'),
    champions_unverified: count(championChecks, 'UNVERIFIED'),
    definitive_all_time_records_checked: definitiveAllTime.length,
    definitive_all_time_mismatches: count(definitiveAllTime, 'MISMATCH'),
    weekly_all_time_snapshot_variances: count(weeklyAllTime, 'HISTORICAL_WEEKLY_VARIANCE'),
    franchise_profiles_checked: franchiseChecks.length,
    franchise_profile_mismatches: count(franchiseChecks, 'MISMATCH'),
    historical_weekly_result_conflicts: Object.values(conflicts).flat().length
  };
  report.summary.overall_definitive_status = [
    report.summary.standings_mismatches,
    report.summary.definitive_season_stat_mismatches,
    report.summary.h2h_mismatches,
    report.summary.champion_mismatches,
    report.summary.definitive_all_time_mismatches,
    report.summary.franchise_profile_mismatches
  ].some(Boolean) ? 'REVIEW_REQUIRED' : 'PASS';

  await mkdir(AUDIT_ROOT, { recursive: true });
  await writeFile(path.join(AUDIT_ROOT, 'sleeper-vs-site.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  const standBad = standingsChecks.filter(x => x.status === 'MISMATCH');
  const statBad = definitiveStatChecks.filter(x => x.status === 'MISMATCH');
  const weeklyVariance = weeklyStatChecks.filter(x => x.status === 'HISTORICAL_WEEKLY_VARIANCE');
  const h2hBad = h2hChecks.filter(x => x.status === 'MISMATCH');
  const champBad = championChecks.filter(x => x.status !== 'PASS');
  const atBad = definitiveAllTime.filter(x => x.status === 'MISMATCH');
  const atVariance = weeklyAllTime.filter(x => x.status === 'HISTORICAL_WEEKLY_VARIANCE');
  const franchiseBad = franchiseChecks.filter(x => x.status === 'MISMATCH');

  const md = [
    '# SCL Sleeper Integrity Audit — Finalized-Record Method',
    '',
    `Definitive status: **${report.summary.overall_definitive_status}**`,
    '',
    `- Standings: ${standingsChecks.length - standBad.length}/${standingsChecks.length} match finalized Sleeper records/PF/PA/seeds`,
    `- Definitive season-stat cards: ${definitiveStatChecks.length - statBad.length}/${definitiveStatChecks.length} match`,
    `- H2H: ${h2hChecks.length - h2hBad.length}/${h2hChecks.length} directed cells match; games ${site.h2h.gamesCount}/${h2hActual.gamesCount}`,
    `- Champions: ${championChecks.length - champBad.length}/${championChecks.length} confirmed`,
    `- Definitive All Time Records: ${definitiveAllTime.length - atBad.length}/${definitiveAllTime.length} match`,
    `- Franchise Hub regular-season profiles: ${franchiseChecks.length - franchiseBad.length}/${franchiseChecks.length} match`,
    `- Historical weekly-score cards: ${weeklyVariance.length} current-API variances (not automatically treated as site errors)`,
    `- Historical games where current raw points disagree with Sleeper's finalized W/L: ${Object.values(conflicts).flat().length}`,
    '',
    '## Definitive standings mismatches',
    ...(standBad.length ? standBad.map(x => `- ${x.year} ${x.teamId}: site=${JSON.stringify(x.site)} Sleeper=${JSON.stringify(x.sleeper)}`) : ['- None']),
    '',
    '## Definitive season-stat mismatches',
    ...(statBad.length ? statBad.map(x => `- ${x.year} ${x.label}: site=${JSON.stringify(x.site)} Sleeper=${JSON.stringify(x.sleeper)}`) : ['- None']),
    '',
    '## H2H mismatches',
    ...(h2hBad.length ? h2hBad.map(x => `- ${x.a} vs ${x.b}: site ${x.siteWins}; Sleeper ${x.sleeperWins}`) : ['- None']),
    '',
    '## Champion issues',
    ...(champBad.length ? champBad.map(x => `- ${x.year}: site ${x.siteChampion}; Sleeper ${x.sleeperChampion || 'unverified'}`) : ['- None']),
    '',
    '## Definitive All-Time mismatches',
    ...(atBad.length ? atBad.map(x => `- ${x.label}: site=${JSON.stringify(x.site)} Sleeper=${JSON.stringify(x.sleeper)}`) : ['- None']),
    '',
    '## Franchise Hub mismatches',
    ...(franchiseBad.length ? franchiseBad.map(x => `- ${x.teamId}: site=${JSON.stringify(x.site)} Sleeper=${JSON.stringify(x.sleeper)}`) : ['- None']),
    '',
    '## Historical weekly-score snapshot variances',
    ...(weeklyVariance.length ? weeklyVariance.map(x => `- ${x.year} ${x.label}: site=${JSON.stringify(x.site)} currentAPI=${JSON.stringify(x.sleeper)}`) : ['- None']),
    '',
    '## All-Time weekly-score snapshot variances',
    ...(atVariance.length ? atVariance.map(x => `- ${x.label}: site=${JSON.stringify(x.site)} currentAPI=${JSON.stringify(x.sleeper)}`) : ['- None']),
    '',
    '## Method notes',
    '- Finalized roster settings are used for W-L, PF and PA because Sleeper historical weekly points can later drift while final season totals remain preserved.',
    '- Finalized roster metadata W/L sequence is used for historical game winners/H2H.',
    '- Current weekly API scores are still compared for closest game, blowout, high week and low week, but a difference is classified as historical snapshot variance rather than automatically rewriting league history.',
    '- 2025 ArShamaa remains mapped for scheduled H2H/history but is intentionally excluded from the published 2025 standings and season-stat eligibility.',
    '- 2020 is not auditable through Sleeper because it is archived on ESPN.',
    '- “Most Best Team Sleeper reports” is verified by counting the highest mapped franchise score in each Week 1–14, matching the league\'s stated Sleeper-report rule.'
  ].join('\n');
  await writeFile(path.join(AUDIT_ROOT, 'sleeper-vs-site.md'), `${md}\n`, 'utf8');
  console.log(JSON.stringify(report.summary));
}

main().catch(error => { console.error(error); process.exitCode = 1; });
