// Raw Sleeper ingestion only. Publishing to the visible SCL site remains supervised.
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT_LEAGUE_ID = process.env.SLEEPER_LEAGUE_ID || '1388938049026535424';
const API = 'https://api.sleeper.app/v1';
const OUTPUT_ROOT = path.resolve('data/sleeper');
const MAX_HISTORY = 10;
const WEEKS = Array.from({ length: 18 }, (_, i) => i + 1);

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function fetchJson(url, attempts = 4) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Sister-Cities-League-Sleeper-Bridge/1.0',
          'Accept': 'application/json'
        }
      });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      return await response.json();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await sleep(750 * attempt);
    }
  }
  throw new Error(`Failed to fetch ${url}: ${lastError?.message || lastError}`);
}

async function writeJson(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function loadIdentityPolicy() {
  try {
    return JSON.parse(await readFile(path.join(OUTPUT_ROOT, 'identity-policy.json'), 'utf8'));
  } catch {
    return null;
  }
}

async function syncLeague(leagueId) {
  const league = await fetchJson(`${API}/league/${leagueId}`);
  if (!league?.league_id) throw new Error(`Sleeper returned no league for ${leagueId}`);

  const season = String(league.season || 'unknown');
  const seasonDir = path.join(OUTPUT_ROOT, season);
  await mkdir(seasonDir, { recursive: true });

  const [users, rosters] = await Promise.all([
    fetchJson(`${API}/league/${leagueId}/users`),
    fetchJson(`${API}/league/${leagueId}/rosters`)
  ]);

  for (const week of WEEKS) {
    const weekData = await fetchJson(`${API}/league/${leagueId}/matchups/${week}`);
    await writeJson(path.join(seasonDir, `week-${week}.json`), weekData);
    await sleep(125);
  }

  await Promise.all([
    writeJson(path.join(seasonDir, 'league.json'), league),
    writeJson(path.join(seasonDir, 'users.json'), users),
    writeJson(path.join(seasonDir, 'rosters.json'), rosters)
  ]);

  const summary = {
    season,
    league_id: String(league.league_id),
    previous_league_id: league.previous_league_id ? String(league.previous_league_id) : null,
    name: league.name || null,
    roster_count: Array.isArray(rosters) ? rosters.length : 0,
    user_count: Array.isArray(users) ? users.length : 0,
    weeks_synced: WEEKS,
    source: 'Sleeper public read-only API',
    warning: 'Raw Sleeper roster_id/owner_id continuity is NOT authoritative for SCL franchise history. Apply data/sleeper/identity-policy.json before publishing historical records.'
  };
  await writeJson(path.join(seasonDir, 'sync-summary.json'), summary);

  return { league, summary };
}

async function main() {
  const identityPolicy = await loadIdentityPolicy();
  if (!identityPolicy) throw new Error('Missing data/sleeper/identity-policy.json guardrail file. Refusing to sync without franchise identity policy.');

  const seasons = [];
  const visited = new Set();
  let leagueId = ROOT_LEAGUE_ID;

  for (let depth = 0; leagueId && depth < MAX_HISTORY; depth += 1) {
    if (visited.has(String(leagueId))) break;
    visited.add(String(leagueId));

    const { league, summary } = await syncLeague(String(leagueId));
    seasons.push(summary);

    const previous = league.previous_league_id;
    if (!previous || String(previous) === '0') break;
    leagueId = String(previous);
  }

  await writeJson(path.join(OUTPUT_ROOT, 'index.json'), {
    root_league_id: ROOT_LEAGUE_ID,
    seasons,
    identity_policy: 'data/sleeper/identity-policy.json'
  });

  console.log(`Sleeper bridge synced ${seasons.length} season(s): ${seasons.map(s => s.season).join(', ')}`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
