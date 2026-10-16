// Level checker for Mine Rush.  Usage: node tools/solver.mjs levels/lv01.json
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import * as G from '../js/logic.js';

// Depth-first search with a dead-state memo. Returns the list of tapped cell indices, or null.
export function solve(level, cap, limit = 300000) {
  const dead = new Set();
  let nodes = 0, aborted = false;
  const order = (s, moves) => {
    const score = (i) => {
      const c = s.cells[i];
      if (c.type === 'diamond') return 0;
      if (c.type === 'rock') return 2;
      return s.furnaces.some(f => f && f.color === c.color && f.have < f.need) ? 1 : 3;
    };
    return moves.sort((a, b) => score(a) - score(b));
  };
  const dfs = (s, path) => {
    if (s.won) return path;
    if (nodes++ > limit) { aborted = true; return null; }
    const k = G.stateKey(s);
    if (dead.has(k)) return null;
    for (const i of order(s, G.exposed(s))) {
      const n = G.cloneState(s);
      G.dig(n, i);
      if (n.lost) continue;
      const r = dfs(n, [...path, i]);
      if (r) return r;
      if (aborted) return null;
    }
    dead.add(k);
    return null;
  };
  const res = dfs(G.createState(level, { sidings: cap }), []);
  return { res, nodes, aborted };
}

// Bots: 'greedy' prefers ore that fits a furnace, then rock; 'random' taps anything.
export function bot(level, kind, trials = 500) {
  let wins = 0;
  for (let t = 0; t < trials; t++) {
    const s = G.createState(level);
    while (!s.won && !s.lost) {
      const m = G.exposed(s);
      if (!m.length) break;
      let pool = m;
      if (kind === 'greedy') {
        const fit = m.filter(i => { const c = s.cells[i]; return c.type === 'diamond' || (c.type === 'ore' && s.furnaces.some(f => f && f.color === c.color && f.have < f.need)); });
        const rock = m.filter(i => s.cells[i].type === 'rock');
        pool = fit.length ? fit : rock.length ? rock : m;
      }
      G.dig(s, pool[Math.floor(Math.random() * pool.length)]);
    }
    if (s.won) wins++;
  }
  return wins / trials;
}

export function report(level, { trials = 500, limit = 300000 } = {}) {
  const bal = G.colourBalance(level);
  const main = solve(level, level.sidings, limit);
  let min = null;
  for (let cap = 0; cap <= level.sidings; cap++) {
    const r = cap === level.sidings ? main : solve(level, cap, limit);
    if (r.res) { min = cap; break; }
    if (r.aborted) { min = '≥' + (cap + 1) + '?'; }
  }
  return { bal, solved: !!main.res, solution: main.res, nodes: main.nodes, aborted: main.aborted, min, greedy: bot(level, 'greedy', trials), random: bot(level, 'random', trials) };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const level = JSON.parse(readFileSync(process.argv[2], 'utf8'));
  const r = report(level);
  const s = G.createState(level);
  const name = (i) => { const [row, c] = G.rc(s, i); return `(${row},${c})`; };
  console.log('Colour balance:', r.bal.ok ? 'OK' : 'MISMATCH', r.bal.have, r.bal.need);
  console.log('Solvable with', level.sidings, 'sidings:', r.solved, `(nodes ${r.nodes}${r.aborted ? ', aborted' : ''})`);
  console.log('Min sidings:', r.min);
  console.log('Greedy bot win:', (r.greedy * 100).toFixed(1) + '%', ' Random bot win:', (r.random * 100).toFixed(1) + '%');
  if (r.solution) console.log('Solution (' + r.solution.length + ' taps):', JSON.stringify(r.solution), '\n', r.solution.map(name).join(' '));
}
