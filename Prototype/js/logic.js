// Mine Rush game rules. Pure module: no DOM, no rendering. Used by the game and by tools/solver.mjs.
//
// Grid characters:
//   '#' main shaft (tunnel)        '=' pre-dug gallery (tunnel)     '.' bedrock (never diggable)
//   G C J I  ores (gold, copper, jade, iron); lowercase = hidden ("?") until next to a tunnel
//   D diamond (bonus, goes to the chest)   R rock (goes to the waste heap)   X wooden crate (cave-in)
//
// Level JSON: { grid: [...], queue: [[colour, need], ...], sidings, furnaces, shaftCol,
//               switches: [{ row, start: 'L'|'R' }], crates: { "r,c": n }, crateDefault }

export const ORES = ['G', 'C', 'J', 'I'];
export const DIAMOND_COINS = 50;

export function createState(level, opts = {}) {
  const rows = level.grid.length, cols = level.grid[0].length;
  const cells = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const ch = level.grid[r][c];
    const cell = { type: 'bedrock' };
    if (ch === '#' || ch === '=') cell.type = 'tunnel';
    else if (ch === 'R') cell.type = 'rock';
    else if (ch === 'D') cell.type = 'diamond';
    else if (ch === 'X') { cell.type = 'crate'; cell.n = (level.crates && level.crates[r + ',' + c]) || level.crateDefault || 4; }
    else if (ORES.includes(ch.toUpperCase())) { cell.type = 'ore'; cell.color = ch.toUpperCase(); cell.hidden = ch !== ch.toUpperCase(); }
    cells.push(cell);
  }
  const s = {
    rows, cols, cells,
    shaftCol: level.shaftCol ?? Math.floor(cols / 2),
    switches: {},
    cap: opts.sidings ?? level.sidings ?? 5,
    sidings: [],
    furnaces: [],
    queue: level.queue.map(q => [...q]),
    qi: 0,
    coins: opts.coins ?? 500,
    turn: 0,
    parkSeq: 0,
    lost: false,
    won: false,
    pending: null,
  };
  (level.switches || []).forEach(w => { s.switches[w.row] = w.start; });
  s.sidings = Array(s.cap).fill(null);
  for (let f = 0; f < (level.furnaces ?? 2); f++) s.furnaces.push(nextBatch(s));
  revealAll(s, false);
  return s;
}

export const idx = (s, r, c) => r * s.cols + c;
export const rc = (s, i) => [Math.floor(i / s.cols), i % s.cols];
const inside = (s, r, c) => r >= 0 && c >= 0 && r < s.rows && c < s.cols;
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];

function nextBatch(s) {
  if (s.qi >= s.queue.length) return null;
  const [color, need] = s.queue[s.qi++];
  return { color, need, have: 0 };
}

// Tunnel cells a cart can reach right now, honouring the gallery switches.
export function reachable(s) {
  const seen = new Uint8Array(s.cells.length);
  const stack = [];
  const root = idx(s, 0, s.shaftCol);
  if (s.cells[root].type === 'tunnel') { seen[root] = 1; stack.push(root); }
  s.cells.forEach((cell, i) => { if (cell.link && cell.type === 'tunnel' && !seen[i]) { seen[i] = 1; stack.push(i); } });
  while (stack.length) {
    const i = stack.pop();
    const [r, c] = rc(s, i);
    for (const [dr, dc] of NB) {
      const nr = r + dr, nc = c + dc;
      if (!inside(s, nr, nc)) continue;
      const j = idx(s, nr, nc);
      if (seen[j] || s.cells[j].type !== 'tunnel') continue;
      // leaving the shaft sideways on a switched gallery row needs the switch to point that way
      if (c === s.shaftCol && dc !== 0 && s.switches[r]) {
        if (s.switches[r] !== (dc < 0 ? 'L' : 'R')) continue;
      }
      seen[j] = 1; stack.push(j);
    }
  }
  return seen;
}

const diggable = (cell) => cell.type === 'ore' || cell.type === 'rock' || cell.type === 'diamond';

// Cells the player can tap right now.
export function exposed(s, seen = reachable(s)) {
  const out = [];
  s.cells.forEach((cell, i) => {
    if (!diggable(cell)) return;
    if (cell.unlocked) { out.push(i); return; }
    const [r, c] = rc(s, i);
    for (const [dr, dc] of NB) {
      const nr = r + dr, nc = c + dc;
      if (inside(s, nr, nc) && seen[idx(s, nr, nc)]) { out.push(i); return; }
    }
  });
  return out;
}

// Hidden ores show their colour once they touch any tunnel (switch direction doesn't matter).
function revealAll(s, all, events) {
  s.cells.forEach((cell, i) => {
    if (cell.type !== 'ore' || !cell.hidden) return;
    let show = all;
    if (!show) {
      const [r, c] = rc(s, i);
      show = NB.some(([dr, dc]) => inside(s, r + dr, c + dc) && s.cells[idx(s, r + dr, c + dc)].type === 'tunnel');
    }
    if (show) { cell.hidden = false; events && events.push({ type: 'reveal', cell: i, color: cell.color }); }
  });
}

const snap = (s) => ({ furnaces: s.furnaces.map(f => f && { ...f }), sidings: s.sidings.map(x => x && x.color), qi: s.qi, cap: s.cap });

function chooseFurnace(s, color) {
  let best = -1;
  s.furnaces.forEach((F, f) => {
    if (F && F.color === color && F.have < F.need && (best < 0 || F.need - F.have < s.furnaces[best].need - s.furnaces[best].have)) best = f;
  });
  return best;
}

// Finish full furnaces, load the next batch, and pull waiting carts from the sidings. Repeats until stable.
function settle(s, events) {
  let changed = true, chain = 0;
  while (changed) {
    changed = false;
    s.furnaces.forEach((F, f) => {
      if (F && F.have >= F.need) {
        events.push({ type: 'furnaceDone', f, color: F.color, snap: null });
        s.furnaces[f] = nextBatch(s);
        events.push({ type: 'furnaceLoad', f, batch: s.furnaces[f] && { ...s.furnaces[f] }, snap: snap(s) });
        changed = true;
      }
    });
    s.furnaces.forEach((F, f) => {
      while (F && F.have < F.need) {
        let slot = -1;
        s.sidings.forEach((x, k) => { if (x && x.color === F.color && (slot < 0 || x.seq < s.sidings[slot].seq)) slot = k; });
        if (slot < 0) break;
        s.sidings[slot] = null;
        F.have++;
        chain++;
        events.push({ type: 'sidingToFurnace', slot, f, color: F.color, chain, snap: snap(s) });
        changed = true;
      }
    });
  }
  if (!s.lost && s.furnaces.every(f => f === null) && s.qi >= s.queue.length) { s.won = true; events.push({ type: 'win' }); }
}

// Where an ore goes: a furnace, a free siding, or nowhere (loss).
function deliver(s, color, events, cell) {
  const f = chooseFurnace(s, color);
  if (f >= 0) { s.furnaces[f].have++; events.push({ type: 'toFurnace', cell, f, color, snap: snap(s) }); return true; }
  const slot = s.sidings.indexOf(null);
  if (slot >= 0) { s.sidings[slot] = { color, seq: s.parkSeq++ }; events.push({ type: 'toSiding', cell, slot, color, snap: snap(s) }); return true; }
  s.lost = true; s.pending = color;
  events.push({ type: 'overflow', cell, color });
  return false;
}

function mine(s, i, events) {
  const cell = s.cells[i];
  const kind = cell.type, color = cell.color;
  cell.type = 'tunnel'; delete cell.unlocked; delete cell.hidden;
  events.push({ type: 'dig', cell: i, kind, color });
  if (kind === 'rock') events.push({ type: 'toWaste', cell: i });
  else if (kind === 'diamond') { s.coins += DIAMOND_COINS; events.push({ type: 'toChest', cell: i, coins: DIAMOND_COINS }); }
  else deliver(s, color, events, i);
}

function tickWorld(s, events) {
  s.turn++;
  for (const r in s.switches) s.switches[r] = s.switches[r] === 'L' ? 'R' : 'L';
  events.push({ type: 'switch', switches: { ...s.switches } });
  s.cells.forEach((cell, i) => {
    if (cell.type !== 'crate') return;
    cell.n--;
    if (cell.n <= 0) { cell.type = 'tunnel'; delete cell.n; events.push({ type: 'crateBreak', cell: i }); }
    else events.push({ type: 'crate', cell: i, n: cell.n });
  });
}

/* ---------------- player actions ---------------- */

export function canDig(s, i) {
  return !s.lost && !s.won && exposed(s).includes(i);
}

// Normal tap. Returns the events for the renderer (empty if the tap is not allowed).
export function dig(s, i) {
  if (!canDig(s, i)) return [];
  const events = [];
  mine(s, i, events);
  if (!s.lost) {
    tickWorld(s, events);
    revealAll(s, false, events);
    settle(s, events);
  }
  return events;
}

// After a loss: buy one more siding and park the cart that had nowhere to go.
export function continueWithSiding(s) {
  if (!s.lost) return [];
  const events = [];
  s.lost = false;
  s.cap++; s.sidings.push(null);
  events.push({ type: 'addSiding', snap: snap(s) });
  const color = s.pending; s.pending = null;
  const slot = s.sidings.indexOf(null);
  s.sidings[slot] = { color, seq: s.parkSeq++ };
  events.push({ type: 'toSiding', cell: -1, slot, color, snap: snap(s) });
  tickWorld(s, events);
  revealAll(s, false, events);
  settle(s, events);
  return events;
}

/* ---------------- boosters (free: no switch flip, no crate tick) ---------------- */

export function boosterAddSiding(s) {
  s.cap++; s.sidings.push(null);
  const events = [{ type: 'addSiding', snap: snap(s) }];
  settle(s, events);
  return events;
}

// Cells the elevator can fetch: any visible ore/diamond; if the sidings are full only ones that fit a furnace.
export function liftTargets(s) {
  const full = s.sidings.indexOf(null) < 0;
  const out = [];
  s.cells.forEach((cell, i) => {
    if (cell.type === 'diamond') out.push(i);
    if (cell.type !== 'ore' || cell.hidden) return;
    if (full && chooseFurnace(s, cell.color) < 0) return;
    out.push(i);
  });
  return out;
}
export function boosterLift(s, i) {
  if (!liftTargets(s).includes(i)) return [];
  const events = [{ type: 'lift', cell: i }];
  mine(s, i, events);
  s.cells[i].link = true; // a temporary elevator shaft now connects this cell to the surface
  revealAll(s, false, events);
  settle(s, events);
  return events;
}

// 3x3 blast: rocks and crates become tunnel, hidden ores show, ores in the area become tappable.
export function boosterTNT(s, i) {
  const [r0, c0] = rc(s, i);
  const events = [{ type: 'tnt', cell: i }];
  for (let r = r0 - 1; r <= r0 + 1; r++) for (let c = c0 - 1; c <= c0 + 1; c++) {
    if (!inside(s, r, c)) continue;
    const j = idx(s, r, c), cell = s.cells[j];
    if (cell.type === 'rock' || cell.type === 'crate') { cell.type = 'tunnel'; delete cell.n; cell.link = true; events.push({ type: 'blast', cell: j }); }
    else if (cell.type === 'ore' || cell.type === 'diamond') {
      if (cell.hidden) { cell.hidden = false; events.push({ type: 'reveal', cell: j, color: cell.color }); }
      cell.unlocked = true;
    }
  }
  revealAll(s, false, events);
  return events;
}

export function boosterLamp(s) {
  const events = [{ type: 'lamp' }];
  revealAll(s, true, events);
  return events;
}

/* ---------------- helpers for tools ---------------- */

export function cloneState(s) {
  return {
    ...s,
    cells: s.cells.map(c => ({ ...c })),
    switches: { ...s.switches },
    sidings: s.sidings.map(x => x && { ...x }),
    furnaces: s.furnaces.map(f => f && { ...f }),
    queue: s.queue,
  };
}

export function stateKey(s) {
  let k = '';
  for (const c of s.cells) k += c.type === 'tunnel' ? (c.link ? 'L' : 't') : c.type === 'crate' ? 'x' + c.n : c.unlocked ? 'u' : '.';
  const sid = s.sidings.filter(Boolean).map(x => x.color).sort().join('');
  return k + '|' + sid + '|' + s.furnaces.map(f => f ? f.color + (f.need - f.have) : '-').join(',') + '|' + s.qi + '|' + Object.values(s.switches).join('');
}

export function colourBalance(level) {
  const have = {}, need = {};
  level.grid.join('').split('').forEach(ch => { const u = ch.toUpperCase(); if (ORES.includes(u)) have[u] = (have[u] || 0) + 1; });
  level.queue.forEach(([k, n]) => { need[k] = (need[k] || 0) + n; });
  const ok = [...new Set([...Object.keys(have), ...Object.keys(need)])].every(k => have[k] === need[k]);
  return { have, need, ok };
}
