import { readFile, writeFile } from 'node:fs/promises';

const file = 'scripts/audit-sleeper-vs-site.mjs';
let source = await readFile(file, 'utf8');

const before = "    '- “Most Best Team Sleeper reports” is verified by counting the highest mapped franchise score in each Week 1–14, matching the league's stated Sleeper-report rule.'";
const after = "    \"- “Most Best Team Sleeper reports” is verified by counting the highest mapped franchise score in each Week 1–14, matching the league's stated Sleeper-report rule.\"";

const count = source.split(before).length - 1;
if (count !== 1) throw new Error(`Expected exactly one invalid audit-note line, found ${count}`);

source = source.replace(before, after);
await writeFile(file, source, 'utf8');
console.log('Fixed Best Team audit-note string quoting.');
