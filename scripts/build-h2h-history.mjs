import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const YEARS = [2021, 2022, 2023, 2024, 2025];
const WEEKS = Array.from({ length: 14 }, (_, i) => i + 1);
const ROOT = process.cwd();
const SLEEPER_ROOT = path.join(ROOT, 'data', 'sleeper');
const OUTPUT = path.join(ROOT, 'h2h-history-data-2026.js');

const readJson = async file => JSON.parse(await readFile(file, 'utf8'));
const effectivePoints = entry => Number(entry.custom_points ?? entry.points ?? 0);

function makeIdentityMaps(policy) {
  const byUserId = new Map();
  const byAlias = new Map();
  const normalize = value => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  for (const [franchiseId, franchise] of Object.entries(policy.franchises || {})) {
    for (const userId of franchise.sleeper_user_ids || []) {
      byUserId.set(String(userId), franchiseId);
    }
    for (const alias of [franchise.current_name, ...(franchise.aliases || [])]) {
      const key = normalize(alias);
      if (key) byAlias.set(key, franchiseId);
    }
  }

  return { byUserId, byAlias, normalize };
}

function buildRosterMap(year, rosters, users, policy) {
  const { byUserId, byAlias, normalize } = makeIdentityMaps(policy);
  const usersById = new Map(users.map(user => [String(user.user_id), user]));
  const overrides = policy.season_roster_overrides?.[String(year)] || {};
  const rosterMap = new Map();

  for (const roster of rosters) {
    const rosterId = String(roster.roster_id);
    let franchiseId = overrides[rosterId] || null;

    if (!franchiseId && roster.owner_id) {
      franchiseId = byUserId.get(String(roster.owner_id)) || null;
    }

    if (!franchiseId && roster.owner_id) {
      const user = usersById.get(String(roster.owner_id));
      for (const candidate of [user?.display_name, user?.metadata?.team_name]) {
        const hit = byAlias.get(normalize(candidate));
        if (hit) {
          franchiseId = hit;
          break;
        }
      }
    }

    if (franchiseId) rosterMap.set(Number(roster.roster_id), franchiseId);
  }

  return rosterMap;
}

function officialSequence(roster) {
  return String(roster.metadata?.record || '').slice(0, 14).split('');
}

const policy = await readJson(path.join(SLEEPER_ROOT, 'identity-policy.json'));
const games = [];

for (const year of YEARS) {
  const seasonDir = path.join(SLEEPER_ROOT, String(year));
  const [users, rosters] = await Promise.all([
    readJson(path.join(seasonDir, 'users.json')),
    readJson(path.join(seasonDir, 'rosters.json'))
  ]);

  const rosterMap = buildRosterMap(year, rosters, users, policy);
  const rosterSequence = new Map(
    rosters.map(roster => [Number(roster.roster_id), officialSequence(roster)])
  );

  for (const week of WEEKS) {
    const entries = await readJson(path.join(seasonDir, `week-${week}.json`));
    const groups = new Map();

    for (const entry of entries) {
      const teamId = rosterMap.get(Number(entry.roster_id));
      if (!teamId || entry.matchup_id == null) continue;

      const key = String(entry.matchup_id);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push({
        teamId,
        rosterId: Number(entry.roster_id),
        score: effectivePoints(entry)
      });
    }

    for (const group of groups.values()) {
      if (group.length !== 2) continue;
      const [a, b] = group;
      const aResult = rosterSequence.get(a.rosterId)?.[week - 1] || null;
      const bResult = rosterSequence.get(b.rosterId)?.[week - 1] || null;

      let winner = null;
      let loser = null;
      let resultBasis = 'weekly-score';

      if (aResult === 'W' && bResult === 'L') {
        winner = a.teamId;
        loser = b.teamId;
        resultBasis = 'finalized-roster-record';
      } else if (bResult === 'W' && aResult === 'L') {
        winner = b.teamId;
        loser = a.teamId;
        resultBasis = 'finalized-roster-record';
      } else if (a.score !== b.score) {
        winner = a.score > b.score ? a.teamId : b.teamId;
        loser = a.score > b.score ? b.teamId : a.teamId;
      }

      const rawWinner = a.score === b.score ? null : (a.score > b.score ? a.teamId : b.teamId);
      const scoreConflict = Boolean(winner && rawWinner && winner !== rawWinner);

      games.push({
        season: year,
        week,
        left: a.teamId,
        right: b.teamId,
        leftScore: a.score,
        rightScore: b.score,
        winner,
        loser,
        resultBasis,
        scoreConflict
      });
    }
  }
}

games.sort((a, b) => b.season - a.season || b.week - a.week || a.left.localeCompare(b.left));

const payload = {
  source: 'Sleeper mirrored league data',
  throughSeason: Math.max(...YEARS),
  maxWeek: 14,
  gamesCount: games.length,
  identityPolicyVersion: policy.version,
  games
};

const output = `// AUTO-GENERATED — DO NOT HAND EDIT.\n// Built from data/sleeper using SCL franchise identity policy.\nwindow.SISTER_CITIES_H2H_HISTORY = ${JSON.stringify(payload, null, 2)};\n`;
await writeFile(OUTPUT, output, 'utf8');
console.log(`Built ${games.length} H2H history games.`);
