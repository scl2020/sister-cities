import { readFile, writeFile } from 'node:fs/promises';

const file = 'scripts/audit-sleeper-vs-site.mjs';
let source = await readFile(file, 'utf8');
const before = "matching the league's stated Sleeper-report rule.'";
const after = "matching the league\\'s stated Sleeper-report rule.'";
const count = source.split(before).length - 1;
if (count !== 1) throw new Error(`Expected one audit-note quote to fix, found ${count}`);
source = source.replace(before, after);
await writeFile(file, source, 'utf8');
console.log('Fixed Best Team audit note quoting.');
