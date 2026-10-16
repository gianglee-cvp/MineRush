// Prototype level "Lớp đá chắn" (proto_01). Verified by the solver with 4 sidings.
// Grid legend: '.' dirt outside the mountain, '#' main shaft (tunnel with rails),
// G gold, C copper, J jade, I iron, R rock; a lowercase ore letter is hidden ("?").
export const LEVEL = {
  id: 'proto_01',
  number: 1,
  name: 'Lớp đá chắn',
  sidings: 4,
  furnaces: 2,
  grid: [
    '.CJ#JC.',
    '.GJ#JG.',
    'IRJRJRC',
    'iJIJJJi',
    'GGJCJGG',
    'iGGiGGi',
  ],
  queue: [
    ['G', 3], ['C', 4], ['J', 4], ['G', 3], ['J', 3],
    ['I', 4], ['G', 4], ['J', 5], ['I', 3],
  ],
};

export const ORE_INFO = {
  G: { name: 'Vàng', css: '#f6b91d' },
  C: { name: 'Đồng', css: '#e0612a' },
  J: { name: 'Ngọc', css: '#22c55e' },
  I: { name: 'Sắt', css: '#b9c2cc' },
};

export function parseCell(ch) {
  if (ch === '.') return { type: 'dirt' };
  if (ch === '#') return { type: 'tunnel' };
  if (ch === 'R') return { type: 'rock' };
  const up = ch.toUpperCase();
  return { type: 'ore', color: up, hidden: ch !== up };
}

// Cells next to a tunnel can be dug; used here only to light up the tappable cells.
export function exposedSet(grid) {
  const rows = grid.length, cols = grid[0].length;
  const isTunnel = (r, c) => r >= 0 && c >= 0 && r < rows && c < cols && grid[r][c] === '#';
  const out = new Set();
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const t = parseCell(grid[r][c]).type;
    if (t === 'dirt' || t === 'tunnel') continue;
    if (isTunnel(r - 1, c) || isTunnel(r + 1, c) || isTunnel(r, c - 1) || isTunnel(r, c + 1)) out.add(r + ',' + c);
  }
  return out;
}
