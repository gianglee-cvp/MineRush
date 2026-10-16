// Mirrored 9x11 level generator.  Usage: node tools/gen.mjs <tries> <seed> [out.json]
import { writeFileSync } from 'node:fs';
import { solve, bot } from './solver.mjs';
import { colourBalance } from '../js/logic.js';

const TRIES = +process.argv[2] || 200;
let seed = +process.argv[3] || 1;
const OUT = process.argv[4];
const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
const pick = (a) => a[Math.floor(rnd() * a.length)];

const COLS = 9, ROWS = 11, SHAFT = 4, GALLERIES = [2, 5, 8];
const COLORS = ['G', 'C', 'J', 'I'];

const NOISE = +process.argv[5] || .25;
const GAL_FROM = +(process.env.GAL_FROM || 1);   // galleries are pre-dug from this column to the shaft
const SIDINGS = +(process.env.SIDINGS || 5);   // 0 = strict layering (hard), 1 = random (easy)

// Layered generator: ore needed early sits deep, ore needed late sits next to the tunnels.
function genLevel() {
  const g = Array.from({ length: ROWS }, () => Array(COLS).fill('.'));
  for (let r = 0; r < ROWS; r++) {
    g[r][SHAFT] = '#';
    for (let c = 0; c < SHAFT; c++) g[r][c] = GALLERIES.includes(r) && c >= GAL_FROM ? '=' : '?';
  }
  // blockers on the left half
  const cr = pick([3, 4, 6, 7]), cc = pick([1, 2]);
  g[cr][cc] = 'X';
  const dr = pick([9, 10]), dc = pick([0, 1]);
  g[dr][dc] = 'D';
  const free = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < SHAFT; c++) if (g[r][c] === '?') free.push([r, c]);
  const nRock = 3 + Math.floor(rnd() * 3);
  for (let k = 0; k < nRock; k++) { const [r, c] = free.splice(Math.floor(rnd() * free.length), 1)[0]; g[r][c] = 'R'; }
  // depth of every free cell = steps from the starting tunnels through diggable cells
  const depth = {}, q = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c <= SHAFT; c++) if (g[r][c] === '#' || g[r][c] === '=') { depth[r + ',' + c] = 0; q.push([r, c]); }
  while (q.length) {
    const [r, c] = q.shift();
    for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nr = r + a, nc = c + b;
      if (nr < 0 || nc < 0 || nr >= ROWS || nc > SHAFT) continue;
      const k = nr + ',' + nc;
      if (k in depth || g[nr][nc] === 'X' || g[nr][nc] === '.') continue;
      depth[k] = depth[r + ',' + c] + 1; q.push([nr, nc]);
    }
  }
  const cells = free.map(([r, c]) => ({ r, c, d: (depth[r + ',' + c] ?? 9) + rnd() * NOISE * 6 }));
  cells.sort((x, y) => x.d - y.d);
  // queue of even-sized batches so mirrored pairs share a colour
  const pairs = cells.length;
  const batches = [];
  let left = pairs * 2, last = null;
  while (left > 0) {
    let size = left <= 6 ? left : pick([4, 4, 6]);
    if (left - size === 2) size = 4;
    let col; do { col = pick(COLORS); } while (col === last);
    batches.push([col, size]); left -= size; last = col;
  }
  // consumption order expanded to pairs; the shallowest cells get the LAST pairs
  const order = [];
  batches.forEach(([k, n]) => { for (let i = 0; i < n / 2; i++) order.push(k); });
  order.reverse();
  cells.forEach((cell, i) => { g[cell.r][cell.c] = order[i]; });
  // a couple of hidden ores deep down
  for (let k = 0; k < 2; k++) { const c = cells[cells.length - 1 - Math.floor(rnd() * 6)]; g[c.r][c.c] = g[c.r][c.c].toLowerCase(); }
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < SHAFT; c++) g[r][COLS - 1 - c] = g[r][c];
  // two symmetry breaks: swap colours of two right-side ore cells (keeps the colour balance)
  for (let t = 0; t < 2; t++) {
    const a1 = [Math.floor(rnd() * ROWS), SHAFT + 1 + Math.floor(rnd() * 4)], a2 = [Math.floor(rnd() * ROWS), SHAFT + 1 + Math.floor(rnd() * 4)];
    const x = g[a1[0]][a1[1]], y = g[a2[0]][a2[1]];
    if (COLORS.includes(x.toUpperCase()) && COLORS.includes(y.toUpperCase()) && x.toUpperCase() !== y.toUpperCase()) { g[a1[0]][a1[1]] = y; g[a2[0]][a2[1]] = x; }
  }
  return {
    id: 'lv01', number: 1, sidings: SIDINGS, furnaces: 2, shaftCol: SHAFT,
    switches: GALLERIES.map((row, i) => ({ row, start: i % 2 ? 'R' : 'L' })),
    crateDefault: 5,
    grid: g.map(r => r.join('')), queue: batches,
  };
}

let best = null;
for (let n = 0; n < TRIES; n++) {
  const L = genLevel();
  if (!L || !colourBalance(L).ok) { console.log('#' + n, 'unbalanced'); continue; }
  const s5 = solve(L, SIDINGS, 150000);
  if (!s5.res) { console.log('#' + n, s5.aborted ? 'search aborted' : 'unsolvable'); continue; }
  const s2 = solve(L, 2, 60000);
  const greedy = bot(L, 'greedy', 200);
  const score = Math.abs(greedy - .62);
  console.log(`#${n} greedy ${(greedy * 100).toFixed(0)}% 2-sidings ${s2.res ? 'yes' : s2.aborted ? '?' : 'no'} taps ${s5.res.length}`);
  if (greedy >= .4 && greedy <= .85 && (!best || score < best.score)) best = { L, greedy, score };
}
if (best) {
  console.log('BEST greedy', (best.greedy * 100).toFixed(0) + '%');
  console.log(JSON.stringify(best.L));
  if (OUT) writeFileSync(OUT, JSON.stringify(best.L, null, 2));
} else console.log('no candidate');
