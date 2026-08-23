# Sleeper data bridge

This directory is a read-only snapshot of Sister Cities League data pulled from Sleeper's public API.

## Safety model

- Sleeper data is imported automatically, but the visible SCL website is **not** automatically edited.
- `roster_id`, `owner_id`, draft slot, and current Sleeper team name are source metadata only; they are **not** authoritative franchise identity across seasons.
- `identity-policy.json` is the required SCL identity guardrail before any imported data is used for standings, H2H, records, franchise profiles, awards, or media production.
- **Trablos United (`svetunited`) and Abethe3Arab (`abethe3arab`) are permanently separate SCL franchises.** A reused/inherited Sleeper roster slot in 2025 must never merge their history.
- Publication remains supervised: after a week is final, SCL production can validate the imported week, map Sleeper rosters to stable SCL franchise IDs, then update the website.

## Files produced by the sync

For each Sleeper season discovered through `previous_league_id`:

- `YEAR/league.json`
- `YEAR/users.json`
- `YEAR/rosters.json`
- `YEAR/week-1.json` through `YEAR/week-18.json`
- `YEAR/sync-summary.json`

`index.json` summarizes the discovered season chain.

The bridge starts from Sleeper league ID `1388938049026535424` and follows the league's own `previous_league_id` chain. No Sleeper password, API key, or write access is used.
