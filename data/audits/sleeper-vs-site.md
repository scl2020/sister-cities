# SCL Sleeper Integrity Audit — Finalized-Record Method

Definitive status: **REVIEW_REQUIRED**

- Standings: 46/47 match finalized Sleeper records/PF/PA/seeds
- Definitive season-stat cards: 32/40 match
- H2H: 110/110 directed cells match; games 336/336
- Champions: 5/5 confirmed
- Definitive All Time Records: 6/8 match
- Franchise Hub regular-season profiles: 11/11 match
- Historical weekly-score cards: 8 current-API variances (not automatically treated as site errors)
- Historical games where current raw points disagree with Sleeper's finalized W/L: 1

## Definitive standings mismatches
- 2024 abethe3arab: site={"teamId":"abethe3arab","seed":6,"record":"6–8","pf":1808,"pa":1847} Sleeper={"seed":6,"record":"6-8","pf":1808,"pa":1847.82}

## Definitive season-stat mismatches
- 2021 Longest losing streak of the season: site={"value":"4","teams":["abethe3arab"],"details":"Weeks 6–9"} Sleeper={"value":6,"teams":["angolarookie"],"basis":"finalized_roster_metadata"}
- 2021 Longest winning streak of the season: site={"value":"4","teams":["barjalona"],"details":"Weeks 4–7"} Sleeper={"value":7,"teams":["drhtown"],"basis":"finalized_roster_metadata"}
- 2023 Longest losing streak of the season: site={"value":"4","teams":["barjalona","snorlax"],"details":null} Sleeper={"value":6,"teams":["drhtown","barjalona"],"basis":"finalized_roster_metadata"}
- 2023 Longest winning streak of the season: site={"value":"4","teams":["abethe3arab","angolarookie"],"details":null} Sleeper={"value":4,"teams":["angolarookie","abethe3arab","daddytate","drhtown","barjalona"],"basis":"finalized_roster_metadata"}
- 2024 Longest losing streak of the season: site={"value":"4","teams":["barjalona","miami"],"details":null} Sleeper={"value":5,"teams":["angolarookie","barjalona"],"basis":"finalized_roster_metadata"}
- 2024 Longest winning streak of the season: site={"value":"4","teams":["maleksexcornflex","arshamaa"],"details":null} Sleeper={"value":5,"teams":["maleksexcornflex","daddytate","angolarookie"],"basis":"finalized_roster_metadata"}
- 2024 Best regular season record: site={"value":"10-4","teams":["maleksexcornflex"],"details":null} Sleeper={"value":"10-4","teams":["maleksexcornflex","snorlax"],"basis":"finalized_roster_settings"}
- 2025 Lowest total points scored: site={"value":"1673.02","teams":["barjalona"],"details":null} Sleeper={"value":1508.9,"teams":["miami"],"basis":"finalized_roster_settings"}

## H2H mismatches
- None

## Champion issues
- None

## Definitive All-Time mismatches
- Longest losing streak of the season: site={"n":6,"value":"6","holders":[{"year":2022,"teams":["maleksexcornflex"]}]} Sleeper={"n":6,"value":6,"holders":[{"year":2021,"teams":["angolarookie"]},{"year":2022,"teams":["maleksexcornflex"]},{"year":2023,"teams":["drhtown","barjalona"]}]}
- Lowest total points scored: site={"n":1578.36,"value":"1578.36","holders":[{"year":2023,"teams":["barjalona"]}]} Sleeper={"n":1508.9,"value":1508.9,"holders":[{"year":2025,"teams":["miami"]}]}

## Franchise Hub mismatches
- None

## Historical weekly-score snapshot variances
- 2021 Closest matchup of the season: site={"value":"0.21","teams":["angolarookie","abethe3arab"],"details":"Week 13"} currentAPI={"value":0.2599999999999909,"teams":["maleksexcornflex","arshamaa"],"details":"Week 6","basis":"current_weekly_api_snapshot"}
- 2021 Biggest blowout of the season: site={"value":"78.30","teams":["abethe3arab","arshamaa"],"details":"Week 14"} currentAPI={"value":81.64000000000001,"teams":["sixowls","angolarookie"],"details":"Week 11","basis":"current_weekly_api_snapshot"}
- 2022 Closest matchup of the season: site={"value":"0.04","teams":["daddytate","barjalona"],"details":"Week 2"} currentAPI={"value":0.45999999999997954,"teams":["daddytate","barjalona"],"details":"Week 2","basis":"current_weekly_api_snapshot"}
- 2022 Biggest blowout of the season: site={"value":"83.40","teams":["maleksexcornflex","miami"],"details":"Week 11"} currentAPI={"value":82.9,"teams":["maleksexcornflex","miami"],"details":"Week 11","basis":"current_weekly_api_snapshot"}
- 2022 Highest points in week: site={"value":"186.14","teams":["drhtown"],"details":"Week 8"} currentAPI={"value":185.64,"teams":["drhtown"],"details":"Week 8","basis":"current_weekly_api_snapshot"}
- 2023 Closest matchup of the season: site={"value":"1.94","teams":["miami","abethe3arab"],"details":"Week 6"} currentAPI={"value":1.8199999999999932,"teams":["maleksexcornflex","snorlax"],"details":"Week 6","basis":"current_weekly_api_snapshot"}
- 2023 Biggest blowout of the season: site={"value":"76.18","teams":["abethe3arab","arshamaa"],"details":"Week 7"} currentAPI={"value":76.02000000000001,"teams":["abethe3arab","arshamaa"],"details":"Week 7","basis":"current_weekly_api_snapshot"}
- 2023 Highest points in week: site={"value":"176.18","teams":["maleksexcornflex"],"details":"Week 5"} currentAPI={"value":177.48,"teams":["maleksexcornflex"],"details":"Week 10","basis":"current_weekly_api_snapshot"}

## All-Time weekly-score snapshot variances
- Closest matchup of the season: site={"n":0.04,"value":"0.04","holders":[{"year":2022,"teams":["daddytate","barjalona"]}]} currentAPI={"n":0.2599999999999909,"value":0.2599999999999909,"holders":[{"year":2021,"teams":["maleksexcornflex","arshamaa"]}]}

## Method notes
- Finalized roster settings are used for W-L, PF and PA because Sleeper historical weekly points can later drift while final season totals remain preserved.
- Finalized roster metadata W/L sequence is used for historical game winners/H2H.
- Current weekly API scores are still compared for closest game, blowout, high week and low week, but a difference is classified as historical snapshot variance rather than automatically rewriting league history.
- 2025 ArShamaa remains mapped for scheduled H2H/history but is intentionally excluded from the published 2025 standings and season-stat eligibility.
- 2020 is not auditable through Sleeper because it is archived on ESPN.
- “Most Best Team Sleeper reports” remains unverified because the public endpoints mirrored here do not expose that report award.
