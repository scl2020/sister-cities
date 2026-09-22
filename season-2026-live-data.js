// =====================
// SISTER CITIES — 2026 LIVE REGULAR-SEASON DATA
// Canonical completed-week layer. Update FINALIZED_GAMES only after the user
// declares a week complete; every derived view is rebuilt from that one source.
// Weeks 1-2 source: Sleeper league 1388938049026535424, finalized connected-league data.
// =====================

(function initScl2026LiveSeason(){
  if (window.SCL_2026_LIVE_SEASON_INSTALLED) return;
  window.SCL_2026_LIVE_SEASON_INSTALLED = true;

  const SEASON = 2026;
  const REGULAR_SEASON_WEEKS = 14;

  // Franchise IDs are SCL identities, not raw Sleeper roster IDs.
  const FINALIZED_GAMES = Object.freeze([
    // WEEK 1
    { week:1, matchupId:1, left:"drhtown",          leftScore:128.64, right:"miami",            rightScore:125.22 },
    { week:1, matchupId:2, left:"sixowls",          leftScore:160.06, right:"angolarookie",     rightScore:84.82  },
    { week:1, matchupId:3, left:"daddytate",        leftScore:113.30, right:"svetunited",       rightScore:166.86 },
    { week:1, matchupId:4, left:"barjalona",        leftScore:141.34, right:"deeznutterz",      rightScore:108.16 },
    { week:1, matchupId:5, left:"maleksexcornflex", leftScore:150.84, right:"snorlax",          rightScore:183.76 },

    // WEEK 2
    { week:2, matchupId:1, left:"drhtown",          leftScore:137.18, right:"sixowls",          rightScore:184.38 },
    { week:2, matchupId:4, left:"maleksexcornflex", leftScore:104.14, right:"svetunited",       rightScore:112.02 },
    { week:2, matchupId:2, left:"daddytate",        leftScore:131.18, right:"miami",             rightScore:120.96 },
    { week:2, matchupId:3, left:"angolarookie",     leftScore:120.12, right:"barjalona",         rightScore:131.56 },
    { week:2, matchupId:5, left:"deeznutterz",      leftScore:140.70, right:"snorlax",           rightScore:164.62 }
  ]);

  // Official Sleeper cumulative totals after the finalized week. These come from
  // data/sleeper/2026/rosters.json and intentionally override sums of rounded
  // weekly matchup displays when Sleeper's season total differs by a hundredth.
  const OFFICIAL_TOTALS = Object.freeze({
    drhtown:          { pf:265.82, pa:309.60 },
    sixowls:          { pf:344.44, pa:221.99 },
    maleksexcornflex: { pf:254.98, pa:295.78 },
    daddytate:        { pf:244.48, pa:287.82 },
    angolarookie:     { pf:204.94, pa:291.62 },
    miami:            { pf:246.18, pa:259.82 },
    barjalona:        { pf:272.90, pa:228.28 },
    svetunited:       { pf:278.88, pa:217.44 },
    deeznutterz:      { pf:248.86, pa:305.96 },
    snorlax:          { pf:348.38, pa:291.54 }
  });

  const completedWeek = FINALIZED_GAMES.reduce((max, game) => Math.max(max, Number(game.week) || 0), 0);
  window.SCL_2026_COMPLETED_WEEK = completedWeek;
  window.SCL_2026_FINALIZED_GAMES = FINALIZED_GAMES;

  function winnerLoser(game){
    if (game.leftScore === game.rightScore) return { winner:null, loser:null, tie:true };
    return game.leftScore > game.rightScore
      ? { winner:game.left, loser:game.right, tie:false }
      : { winner:game.right, loser:game.left, tie:false };
  }

  function allTeamIds(){
    const ids = new Set();
    const season = typeof seasons !== "undefined" ? seasons[SEASON] : null;
    (season?.standings || []).forEach(row => ids.add(row.teamId));
    FINALIZED_GAMES.forEach(game => { ids.add(game.left); ids.add(game.right); });
    return Array.from(ids);
  }

  function round2(value){
    return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
  }

  function buildRecords(){
    const records = new Map(allTeamIds().map(teamId => [teamId, {
      teamId, wins:0, losses:0, ties:0, pf:0, pa:0, results:[]
    }]));

    FINALIZED_GAMES.forEach(game => {
      const left = records.get(game.left);
      const right = records.get(game.right);
      if (!left || !right) return;

      left.pf += game.leftScore;
      left.pa += game.rightScore;
      right.pf += game.rightScore;
      right.pa += game.leftScore;

      const outcome = winnerLoser(game);
      if (outcome.tie) {
        left.ties += 1; right.ties += 1;
        left.results.push({ week:game.week, result:"T" });
        right.results.push({ week:game.week, result:"T" });
      } else {
        const winner = records.get(outcome.winner);
        const loser = records.get(outcome.loser);
        winner.wins += 1;
        loser.losses += 1;
        winner.results.push({ week:game.week, result:"W" });
        loser.results.push({ week:game.week, result:"L" });
      }
    });

    records.forEach(record => {
      record.pf = round2(record.pf);
      record.pa = round2(record.pa);
      record.results.sort((a,b) => a.week - b.week);

      // Match Sleeper's official cumulative standings totals exactly.
      const official = OFFICIAL_TOTALS[record.teamId];
      if (official) {
        record.pf = Number(official.pf);
        record.pa = Number(official.pa);
      }
    });

    return records;
  }

  function maxStreak(record, resultLetter){
    let current = 0;
    let best = 0;
    record.results.forEach(item => {
      if (item.result === resultLetter) {
        current += 1;
        best = Math.max(best, current);
      } else {
        current = 0;
      }
    });
    return best;
  }

  function recordLabel(record){
    return record.ties
      ? `${record.wins}–${record.losses}–${record.ties}`
      : `${record.wins}–${record.losses}`;
  }

  function holderIds(records, selector, mode="max"){
    const values = Array.from(records.values()).map(record => selector(record));
    const target = mode === "min" ? Math.min(...values) : Math.max(...values);
    return {
      value: target,
      teams: Array.from(records.values()).filter(record => selector(record) === target).map(record => record.teamId)
    };
  }

  const records = buildRecords();

  // Standings: record first, PF second. This mirrors the league's current
  // standings presentation and keeps seed numbers live week by week.
  const standings = Array.from(records.values())
    .sort((a,b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (a.losses !== b.losses) return a.losses - b.losses;
      if (b.ties !== a.ties) return b.ties - a.ties;
      if (b.pf !== a.pf) return b.pf - a.pf;
      return (TEAMS[a.teamId]?.name || a.teamId).localeCompare(TEAMS[b.teamId]?.name || b.teamId);
    })
    .map((record, index) => ({
      teamId: record.teamId,
      seed: index + 1,
      record: recordLabel(record),
      pf: record.pf,
      pa: record.pa
    }));

  const seedIndex = new Map(standings.map(row => [row.teamId, row.seed]));
  const bySeed = ids => ids.slice().sort((a,b) => (seedIndex.get(a) || 99) - (seedIndex.get(b) || 99));

  const winningStreak = holderIds(records, r => maxStreak(r, "W"), "max");
  const losingStreak = holderIds(records, r => maxStreak(r, "L"), "max");
  const bestRecord = holderIds(records, r => r.wins, "max");
  const worstRecord = holderIds(records, r => r.wins, "min");
  const mostPoints = holderIds(records, r => r.pf, "max");
  const leastPoints = holderIds(records, r => r.pf, "min");
  const highestAverage = holderIds(records, r => round2(r.pf / Math.max(1, completedWeek)), "max");
  const lowestAverage = holderIds(records, r => round2(r.pf / Math.max(1, completedWeek)), "min");

  const margins = FINALIZED_GAMES.map(game => ({ game, margin:round2(Math.abs(game.leftScore - game.rightScore)) }));
  const closestMargin = Math.min(...margins.map(item => item.margin));
  const biggestMargin = Math.max(...margins.map(item => item.margin));
  const closest = margins.find(item => item.margin === closestMargin);
  const biggest = margins.find(item => item.margin === biggestMargin);

  const teamWeekScores = FINALIZED_GAMES.flatMap(game => [
    { teamId:game.left, score:game.leftScore, week:game.week },
    { teamId:game.right, score:game.rightScore, week:game.week }
  ]);
  const highestWeekScore = Math.max(...teamWeekScores.map(item => item.score));
  const lowestWeekScore = Math.min(...teamWeekScores.map(item => item.score));
  const highestWeek = teamWeekScores.filter(item => item.score === highestWeekScore);
  const lowestWeek = teamWeekScores.filter(item => item.score === lowestWeekScore);

  // "Best Team" = highest-scoring franchise in each completed week.
  const bestTeamCounts = new Map(allTeamIds().map(id => [id, 0]));
  for (let week = 1; week <= completedWeek; week++) {
    const weekScores = teamWeekScores.filter(item => item.week === week);
    if (!weekScores.length) continue;
    const high = Math.max(...weekScores.map(item => item.score));
    weekScores.filter(item => item.score === high).forEach(item => {
      bestTeamCounts.set(item.teamId, (bestTeamCounts.get(item.teamId) || 0) + 1);
    });
  }
  const bestTeamMax = Math.max(...bestTeamCounts.values());
  const bestTeamHolders = Array.from(bestTeamCounts.entries()).filter(([,count]) => count === bestTeamMax).map(([id]) => id);

  function tieSuffix(teams){ return teams.length > 1 ? " (tied)" : ""; }
  function matchupTeams(item){ return item ? [item.game.left, item.game.right] : []; }
  function matchupWeek(item){ return item ? `Week ${item.game.week}` : null; }

  const partialSeason = completedWeek < REGULAR_SEASON_WEEKS;
  const bestRecordRows = Array.from(records.values()).filter(r => bestRecord.teams.includes(r.teamId));
  const worstRecordRows = Array.from(records.values()).filter(r => worstRecord.teams.includes(r.teamId));
  const bestRecordDisplay = bestRecordRows.length ? recordLabel(bestRecordRows[0]) : "—";
  const worstRecordDisplay = worstRecordRows.length ? recordLabel(worstRecordRows[0]) : "—";

  const seasonStats = [
    { label:"Longest losing streak of the season", value:String(losingStreak.value), display:`${losingStreak.value} ${losingStreak.value === 1 ? "loss" : "losses"}${tieSuffix(losingStreak.teams)}`, teams:bySeed(losingStreak.teams), details:`Through Week ${completedWeek}` },
    { label:"Longest winning streak of the season", value:String(winningStreak.value), display:`${winningStreak.value} ${winningStreak.value === 1 ? "win" : "wins"}${tieSuffix(winningStreak.teams)}`, teams:bySeed(winningStreak.teams), details:`Through Week ${completedWeek}` },
    { label:"Best regular season record", value:bestRecordDisplay.replace(/–/g,"-"), display:`${bestRecordDisplay}${tieSuffix(bestRecord.teams)}`, teams:bySeed(bestRecord.teams), details:`Through Week ${completedWeek}`, excludeFromAllTime:partialSeason },
    { label:"Worst regular season record", value:worstRecordDisplay.replace(/–/g,"-"), display:`${worstRecordDisplay}${tieSuffix(worstRecord.teams)}`, teams:bySeed(worstRecord.teams), details:`Through Week ${completedWeek}`, excludeFromAllTime:partialSeason },
    { label:"Most total points", value:mostPoints.value.toFixed(2), display:mostPoints.value.toFixed(2), teams:bySeed(mostPoints.teams), details:`Through Week ${completedWeek}`, excludeFromAllTime:partialSeason },
    { label:"Lowest total points scored", value:leastPoints.value.toFixed(2), display:leastPoints.value.toFixed(2), teams:bySeed(leastPoints.teams), details:`Through Week ${completedWeek}`, excludeFromAllTime:partialSeason },
    { label:'Most "Best Team" Sleeper reports', value:String(bestTeamMax), display:`${bestTeamMax} ${bestTeamMax === 1 ? "time" : "times"}${tieSuffix(bestTeamHolders)}`, teams:bySeed(bestTeamHolders), details:`Through Week ${completedWeek}` },
    { label:"Closest matchup of the season", value:closestMargin.toFixed(2), display:`${closestMargin.toFixed(2)} points`, teams:matchupTeams(closest), details:matchupWeek(closest) },
    { label:"Biggest blowout of the season", value:biggestMargin.toFixed(2), display:`${biggestMargin.toFixed(2)} points`, teams:matchupTeams(biggest), details:matchupWeek(biggest) },
    { label:"Highest average fantasy points", value:highestAverage.value.toFixed(2), display:highestAverage.value.toFixed(2), teams:bySeed(highestAverage.teams), details:"PF/Game (computed)", excludeFromAllTime:partialSeason },
    { label:"Highest points in week", value:highestWeekScore.toFixed(2), display:highestWeekScore.toFixed(2), teams:bySeed(highestWeek.map(item => item.teamId)), details:`Week ${highestWeek[0]?.week || completedWeek}` },
    { label:"Lowest points in a week", value:lowestWeekScore.toFixed(2), display:lowestWeekScore.toFixed(2), teams:bySeed(lowestWeek.map(item => item.teamId)), details:`Week ${lowestWeek[0]?.week || completedWeek}` },
    { label:"Lowest average fantasy points", value:lowestAverage.value.toFixed(2), display:lowestAverage.value.toFixed(2), teams:bySeed(lowestAverage.teams), details:"PF/Game (computed)", excludeFromAllTime:partialSeason }
  ];

  if (typeof seasons !== "undefined" && seasons[SEASON]) {
    seasons[SEASON].standings = standings;
    seasons[SEASON].seasonStats = seasonStats;
    seasons[SEASON].completedWeek = completedWeek;
  }

  // During an active season, final-season-only metrics (record, cumulative PF,
  // season averages) are displayed in 2026 but intentionally cannot overwrite
  // historical All Time Records until Week 14 is complete. Monotonic/event stats
  // (streaks, weekly highs/lows, closest game, blowout, Best Team count) remain
  // eligible immediately.
  computeAllTime = function(seasonsObj) {
    const recordMap = new Map();

    for (const year of Object.keys(seasonsObj).map(Number)) {
      const season = seasonsObj[year];
      season.year = year;
      season.hasAllTime = false;
      season.seasonStats.forEach(stat => { stat.isAllTime = false; });

      for (const stat of season.seasonStats) {
        if (stat.excludeFromAllTime) continue;
        const value = normalizeNumberFromStat(stat.label, stat.value);
        if (!Number.isFinite(value)) continue;

        const lowerBetter = LOWER_IS_BETTER.has(stat.label);
        const current = recordMap.get(stat.label);

        if (!current) {
          recordMap.set(stat.label, { best:value, lowerBetter, holders:[{ year, stat }] });
        } else {
          const better = lowerBetter ? value < current.best : value > current.best;
          const tie = Math.abs(value - current.best) < 1e-9;
          if (better) {
            current.best = value;
            current.holders = [{ year, stat }];
          } else if (tie) {
            current.holders.push({ year, stat });
          }
        }
      }
    }

    for (const info of recordMap.values()) {
      info.holders.forEach(holder => {
        holder.stat.isAllTime = true;
        seasonsObj[holder.year].hasAllTime = true;
      });
    }
    return recordMap;
  };

  // Add completed 2026 games to the exact same H2H matrix used by the H2H page
  // and Franchise Hub all-time regular-season W-L records.
  const h2h = window.SISTER_CITIES_H2H_DATA;
  if (h2h && h2h.wins) {
    allTeamIds().forEach(id => { if (!h2h.wins[id]) h2h.wins[id] = {}; });
    FINALIZED_GAMES.forEach(game => {
      const outcome = winnerLoser(game);
      if (!outcome.winner) return;
      h2h.wins[outcome.winner][outcome.loser] = Number(h2h.wins[outcome.winner][outcome.loser] || 0) + 1;
    });
    h2h.throughSeason = SEASON;
    h2h.throughWeek = completedWeek;
    h2h.gamesCount = Number(h2h.gamesCount || 0) + FINALIZED_GAMES.length;
  }

  // Prepend completed 2026 games to matchup history. Existing 2021-2025 audit
  // history stays untouched.
  const history = window.SISTER_CITIES_H2H_HISTORY;
  if (history && Array.isArray(history.games)) {
    const prior = history.games.filter(game => Number(game.season) !== SEASON);
    const current = FINALIZED_GAMES
      .slice()
      .sort((a,b) => b.week - a.week || a.matchupId - b.matchupId)
      .map(game => {
        const outcome = winnerLoser(game);
        return {
          season:SEASON,
          week:game.week,
          left:game.left,
          right:game.right,
          leftScore:game.leftScore,
          rightScore:game.rightScore,
          winner:outcome.winner,
          loser:outcome.loser,
          resultBasis:"finalized-sleeper-week",
          scoreConflict:false
        };
      });

    history.games = current.concat(prior);
    history.throughSeason = SEASON;
    history.throughWeek = completedWeek;
    history.gamesCount = history.games.length;
  }

  const recordMap = computeAllTime(seasons);
  renderAllTime(recordMap);
  buildFranchiseGrid();

  // 2026 is the default season. Refresh its table/stats after the live layer is
  // applied so the page never flashes stale preseason data after load settles.
  const activeYear = Number(document.querySelector('.season-year-button.active')?.dataset.season || 0);
  if (activeYear === SEASON) renderSeason({ currentYear:SEASON });

  window.SCL_2026_WEEK_AUDIT = Object.freeze({
    season:SEASON,
    completedWeek,
    games:FINALIZED_GAMES.length,
    teams:records.size,
    standingsRows:standings.length,
    statsRows:seasonStats.length,
    h2hGamesCount:window.SISTER_CITIES_H2H_HISTORY?.gamesCount || null,
    source:"Sleeper finalized connected-league Weeks 1-2 data"
  });
})();
