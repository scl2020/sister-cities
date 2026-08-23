import { readFile, writeFile } from 'node:fs/promises';

const file = 'script.js';
let source = await readFile(file, 'utf8');

const replacements = [
  [
    '{ teamId: "abethe3arab", seed: 6, record: "6–8", pf: 1808.00, pa: 1847.00 },',
    '{ teamId: "abethe3arab", seed: 6, record: "6–8", pf: 1808.00, pa: 1847.82 },'
  ],
  [
    '{ label: "Longest losing streak of the season", value: "4", display: "4 losses", teams: ["abethe3arab"], details: "Weeks 6–9" },',
    '{ label: "Longest losing streak of the season", value: "6", display: "6 losses", teams: ["angolarookie"], details: "Weeks 8–13" },'
  ],
  [
    '{ label: "Longest winning streak of the season", value: "4", display: "4 wins", teams: ["barjalona"], details: "Weeks 4–7" },',
    '{ label: "Longest winning streak of the season", value: "7", display: "7 wins", teams: ["drhtown"], details: "Weeks 6–12" },'
  ],
  [
    '{ label: "Longest losing streak of the season", value: "4", display: "4 losses (tied)", teams: ["barjalona","snorlax"], details: null },',
    '{ label: "Longest losing streak of the season", value: "6", display: "6 losses (tied)", teams: ["drhtown","barjalona"], details: null },'
  ],
  [
    '{ label: "Longest winning streak of the season", value: "4", display: "4 wins (tied)", teams: ["abethe3arab","angolarookie"], details: null },',
    '{ label: "Longest winning streak of the season", value: "4", display: "4 wins (tied)", teams: ["angolarookie","abethe3arab","daddytate","drhtown","barjalona"], details: null },'
  ],
  [
    '{ label: "Longest losing streak of the season", value: "4", display: "4 losses (tied)", teams: ["barjalona","miami"], details: null },',
    '{ label: "Longest losing streak of the season", value: "5", display: "5 losses (tied)", teams: ["angolarookie","barjalona"], details: null },'
  ],
  [
    '{ label: "Longest winning streak of the season", value: "4", display: "4 wins (tied)", teams: ["maleksexcornflex","arshamaa"], details: null },',
    '{ label: "Longest winning streak of the season", value: "5", display: "5 wins (tied)", teams: ["maleksexcornflex","daddytate","angolarookie"], details: null },'
  ],
  [
    '{ label: "Lowest total points scored", value: "1673.02", display: "1673.02", teams: ["barjalona"], details: null },',
    '{ label: "Lowest total points scored", value: "1508.90", display: "1508.90", teams: ["miami"], details: null },'
  ]
];

for (const [before, after] of replacements) {
  const count = source.split(before).length - 1;
  if (count !== 1) {
    throw new Error(`Expected exactly one match for correction, found ${count}: ${before}`);
  }
  source = source.replace(before, after);
}

await writeFile(file, source, 'utf8');
console.log(`Applied ${replacements.length} commissioner-confirmed SCL corrections.`);
