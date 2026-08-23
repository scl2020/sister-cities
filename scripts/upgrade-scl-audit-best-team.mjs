import { readFile, writeFile } from 'node:fs/promises';

const file = 'scripts/audit-sleeper-vs-site.mjs';
let source = await readFile(file, 'utf8');

function replaceExact(before, after, label) {
  const count = source.split(before).length - 1;
  if (count !== 1) throw new Error(`${label}: expected exactly one match, found ${count}`);
  source = source.replace(before, after);
}

replaceExact(
`const WEEKLY_SNAPSHOT_LABELS = new Set([\n  'Closest matchup of the season',\n  'Biggest blowout of the season',\n  'Highest points in week',\n  'Lowest points in a week'\n]);`,
`const WEEKLY_SNAPSHOT_LABELS = new Set([\n  'Closest matchup of the season',\n  'Biggest blowout of the season',\n  'Highest points in week',\n  'Lowest points in a week',\n  'Most "Best Team" Sleeper reports'\n]);`,
'weekly snapshot labels'
);

replaceExact(
`  const highWeek = [...activeScores].sort((a, b) => b.points - a.points)[0];\n  const lowWeek = [...activeScores].sort((a, b) => a.points - b.points)[0];\n\n  const stats = {`,
`  const highWeek = [...activeScores].sort((a, b) => b.points - a.points)[0];\n  const lowWeek = [...activeScores].sort((a, b) => a.points - b.points)[0];\n\n  // Sleeper's weekly "Best Team" report is the franchise with the highest score that week.\n  // Use all mapped franchises for this award, including a franchise that later became inactive.\n  const bestTeamCounts = new Map();\n  for (const week of WEEKS) {\n    const weekScores = weeklyScores.filter(s => s.week === week);\n    if (!weekScores.length) continue;\n    const weeklyHigh = Math.max(...weekScores.map(s => s.points));\n    for (const score of weekScores) {\n      if (Math.abs(score.points - weeklyHigh) < 0.005) {\n        bestTeamCounts.set(score.teamId, (bestTeamCounts.get(score.teamId) || 0) + 1);\n      }\n    }\n  }\n  const bestTeamMax = bestTeamCounts.size ? Math.max(...bestTeamCounts.values()) : 0;\n  const bestTeamLeaders = [...bestTeamCounts.entries()]\n    .filter(([, count]) => count === bestTeamMax)\n    .map(([teamId]) => teamId);\n\n  const stats = {`,
'best team computation'
);

replaceExact(
`    'Best regular season record': { value: \`${'${bestWins}'}-${'${14 - bestWins}'}\`, teams: activeOfficial.filter(t => t.wins === bestWins).map(t => t.teamId), basis: 'finalized_roster_settings' },`,
`    'Best regular season record': { value: \`${'${bestWins}'}-${'${14 - bestWins}'}\`, teams: activeOfficial.filter(t => t.wins === bestWins).map(t => t.teamId), primaryTeam: standings[0]?.teamId || null, basis: 'finalized_roster_settings' },`,
'best record primary team'
);

replaceExact(
`    'Lowest average fantasy points': { value: lowAvg.pf / 14, teams: [lowAvg.teamId], basis: 'finalized_roster_settings' },\n    'Closest matchup of the season':`,
`    'Lowest average fantasy points': { value: lowAvg.pf / 14, teams: [lowAvg.teamId], basis: 'finalized_roster_settings' },\n    'Most "Best Team" Sleeper reports': { value: bestTeamMax, teams: bestTeamLeaders, basis: 'current_weekly_api_snapshot' },\n    'Closest matchup of the season':`,
'best team stat'
);

replaceExact(
`  const teamsOk = sameSet(siteStat.teams, actual.teams);`,
`  const teamsOk = siteStat.label === 'Best regular season record'\n    ? Array.isArray(siteStat.teams) && siteStat.teams.length > 0 && siteStat.teams.includes(actual.primaryTeam) && siteStat.teams.every(teamId => actual.teams.includes(teamId))\n    : sameSet(siteStat.teams, actual.teams);`,
'best record commissioner tiebreak semantics'
);

replaceExact(
`  'Lowest average fantasy points': 'min'\n};`,
`  'Lowest average fantasy points': 'min',\n  'Most "Best Team" Sleeper reports': 'max'\n};`,
'all-time Best Team direction'
);

replaceExact(
`    for (const s of site.seasons[year].seasonStats) {\n      if (s.label.includes('Best Team')) {\n        statChecks.push({ year, label: s.label, site: { value: s.value, teams: s.teams, details: s.details || null }, sleeper: null, status: 'UNVERIFIED', reason: 'Sleeper weekly report awards are not exposed by the mirrored public endpoints.' });\n        continue;\n      }\n      const a = actual[year].stats[s.label];`,
`    for (const s of site.seasons[year].seasonStats) {\n      const a = actual[year].stats[s.label];`,
'enable Best Team comparisons'
);

replaceExact(
`- “Most Best Team Sleeper reports” remains unverified because the public endpoints mirrored here do not expose that report award.`,
`- “Most Best Team Sleeper reports” is verified by counting the highest mapped franchise score in each Week 1–14, matching the league's stated Sleeper-report rule.`,
'Best Team report note'
);

await writeFile(file, source, 'utf8');
console.log('Upgraded SCL audit with Best Team verification and commissioner tiebreak semantics.');
