// Sprite loading. Every key has a size and a placeholder painter. If assets/sprites/<key>.png
// exists (listed by serve.js at /__sprites) the real image is used instead of the placeholder.
import * as PIXI from 'pixi.js';

export const SPRITES = {
  bg_surface: [1080, 520], bg_cave: [1080, 1300], cliff_left: [240, 1400],
  frame_post: [64, 640], frame_beam: [640, 56], frame_brace: [140, 140], grass_edge: [540, 70],
  cell_tile: [104, 104], ore_gold: [96, 96], ore_copper: [96, 96], ore_jade: [96, 96], ore_iron: [96, 96],
  ore_diamond: [96, 96], rock: [96, 96], hidden: [96, 96], crate: [96, 96], bedrock: [104, 104], tunnel: [104, 104],
  rail_v: [104, 104], rail_h: [104, 104], rail_ramp: [210, 210], shaft_head: [150, 120], switch_plate: [76, 76],
  elevator: [96, 116], cart: [96, 66],
  pile_gold: [80, 42], pile_copper: [80, 42], pile_jade: [80, 42], pile_iron: [80, 42], pile_rock: [80, 42], pile_diamond: [80, 42],
  mine_entrance: [300, 260], miner: [110, 150], furnace: [230, 300], fire: [96, 110], siding_bay: [150, 120],
  chest: [110, 90], lantern: [40, 64], hand: [120, 120],
};

export const ORE_KEY = { G: 'ore_gold', C: 'ore_copper', J: 'ore_jade', I: 'ore_iron', D: 'ore_diamond' };
export const PILE_KEY = { G: 'pile_gold', C: 'pile_copper', J: 'pile_jade', I: 'pile_iron', D: 'pile_diamond', R: 'pile_rock' };
export const ORE_COL = {
  G: ['#fff0a0', '#ffc629', '#b77a06'], C: ['#ffc0a0', '#e8642a', '#8f2f0d'],
  J: ['#c8ffd8', '#1fcf63', '#0b6a30'], I: ['#ffffff', '#c3ccd6', '#5d6773'], D: ['#e8fbff', '#55c8ff', '#1468b8'],
};

let seed = 4242;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const OUT = '#2b1a0e';

/* ---------------- placeholder painters (canvas 2D, drawn at 2x) ---------------- */
function gem(x, w, h, [hi, mid, lo], shape = 'cube') {
  const cx = w / 2, cy = h / 2, r = w * .38;
  x.lineJoin = 'round';
  let pts;
  if (shape === 'diamond') pts = [[cx, cy - r], [cx + r, cy - r * .25], [cx, cy + r], [cx - r, cy - r * .25]];
  else if (shape === 'crystal') pts = [[cx, cy - r * 1.05], [cx + r * .75, cy - r * .3], [cx + r * .6, cy + r * .7], [cx - r * .6, cy + r * .7], [cx - r * .75, cy - r * .3]];
  else pts = [[cx - r * .55, cy - r], [cx + r * .55, cy - r], [cx + r, cy - r * .35], [cx + r * .8, cy + r * .75], [cx - r * .8, cy + r * .75], [cx - r, cy - r * .35]];
  const path = () => { x.beginPath(); pts.forEach(([a, b], i) => i ? x.lineTo(a, b) : x.moveTo(a, b)); x.closePath(); };
  // drop shadow
  x.save(); x.translate(4, 6); path(); x.fillStyle = 'rgba(0,0,0,.35)'; x.fill(); x.restore();
  path();
  const g = x.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  g.addColorStop(0, hi); g.addColorStop(.45, mid); g.addColorStop(1, lo);
  x.fillStyle = g; x.fill();
  // facets
  x.save(); path(); x.clip();
  x.fillStyle = 'rgba(255,255,255,.35)';
  x.beginPath(); x.moveTo(pts[0][0], pts[0][1]); x.lineTo(pts[1][0], pts[1][1]); x.lineTo(cx, cy - r * .1); x.closePath(); x.fill();
  x.fillStyle = 'rgba(0,0,0,.18)';
  x.beginPath(); x.moveTo(cx, cy - r * .1); x.lineTo(pts[pts.length - 2][0], pts[pts.length - 2][1]); x.lineTo(pts[pts.length - 3][0], pts[pts.length - 3][1]); x.closePath(); x.fill();
  x.strokeStyle = 'rgba(255,255,255,.45)'; x.lineWidth = w * .015;
  pts.forEach(([a, b]) => { x.beginPath(); x.moveTo(cx, cy - r * .1); x.lineTo(a, b); x.stroke(); });
  x.restore();
  path(); x.strokeStyle = OUT; x.lineWidth = w * .045; x.stroke();
  // sparkle
  x.fillStyle = '#fff';
  x.beginPath(); x.arc(cx - r * .35, cy - r * .55, w * .045, 0, Math.PI * 2); x.fill();
}

function stoneBlock(x, w, h, base, rim, inner) {
  const rr = w * .14;
  const rect = (a, b, c, d, r) => { x.beginPath(); x.roundRect(a, b, c, d, r); };
  rect(2, 2, w - 4, h - 4, rr); x.fillStyle = rim; x.fill();
  rect(w * .07, h * .07, w * .86, h * .86, rr * .8); x.fillStyle = base; x.fill();
  const g = x.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, 'rgba(255,255,255,.12)'); g.addColorStop(1, 'rgba(0,0,0,.25)');
  rect(w * .12, h * .12, w * .76, h * .76, rr * .6); x.fillStyle = inner || g; x.fill();
  rect(2, 2, w - 4, h - 4, rr); x.strokeStyle = 'rgba(0,0,0,.6)'; x.lineWidth = w * .03; x.stroke();
}

function boulders(x, w, h, cols, n = 3, s = .3) {
  for (let i = 0; i < n; i++) {
    const cx = w * (.3 + rnd() * .4), cy = h * (.32 + rnd() * .4), r = w * (s * (.7 + rnd() * .5));
    x.beginPath();
    for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2, rr = r * (.8 + rnd() * .3); x.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * .85); }
    x.closePath();
    const g = x.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    g.addColorStop(0, cols[0]); g.addColorStop(1, cols[1]);
    x.fillStyle = g; x.fill(); x.strokeStyle = OUT; x.lineWidth = w * .03; x.stroke();
  }
}

function wood(x, w, h, horizontal) {
  const g = horizontal ? x.createLinearGradient(0, 0, 0, h) : x.createLinearGradient(0, 0, w, 0);
  g.addColorStop(0, '#b47a3e'); g.addColorStop(.5, '#8a5428'); g.addColorStop(1, '#5a3216');
  x.fillStyle = g; x.fillRect(0, 0, w, h);
  x.strokeStyle = 'rgba(40,20,8,.45)'; x.lineWidth = 2;
  for (let i = 1; i < 4; i++) { x.beginPath(); if (horizontal) { x.moveTo(0, h * i / 4); x.lineTo(w, h * i / 4 + (rnd() - .5) * 4); } else { x.moveTo(w * i / 4, 0); x.lineTo(w * i / 4 + (rnd() - .5) * 4, h); } x.stroke(); }
  x.strokeStyle = OUT; x.lineWidth = 4; x.strokeRect(1, 1, w - 2, h - 2);
}

function rails(x, w, h, vertical) {
  x.save();
  if (!vertical) { x.translate(w, 0); x.rotate(Math.PI / 2); }
  for (let y = 6; y < h; y += h / 4) { x.fillStyle = '#7a4b24'; x.fillRect(w * .18, y, w * .64, h * .08); x.strokeStyle = OUT; x.lineWidth = 2; x.strokeRect(w * .18, y, w * .64, h * .08); }
  for (const rx of [.3, .7]) { x.fillStyle = '#c9d0d6'; x.fillRect(w * rx - 4, 0, 8, h); x.fillStyle = '#6c757d'; x.fillRect(w * rx + 1, 0, 3, h); }
  x.restore();
}

const PAINT = {
  bg_surface(x, w, h) {
    const sky = x.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#3b9cf0'); sky.addColorStop(.7, '#9fd8ff'); sky.addColorStop(1, '#d7f0ff');
    x.fillStyle = sky; x.fillRect(0, 0, w, h);
    const mount = (cx, base, mw, mh, col) => { x.beginPath(); x.moveTo(cx - mw, base); x.lineTo(cx, base - mh); x.lineTo(cx + mw, base); x.closePath(); x.fillStyle = col; x.fill();
      x.beginPath(); x.moveTo(cx - mw * .25, base - mh * .75); x.lineTo(cx, base - mh); x.lineTo(cx + mw * .25, base - mh * .75); x.lineTo(cx + mw * .1, base - mh * .68); x.lineTo(cx - mw * .08, base - mh * .72); x.closePath(); x.fillStyle = '#f4f8fc'; x.fill(); };
    mount(w * .2, h * .78, w * .3, h * .55, '#7d98bf'); mount(w * .62, h * .8, w * .36, h * .62, '#6f8db7'); mount(w * .95, h * .78, w * .26, h * .5, '#87a2c6');
    for (let i = 0; i < 46; i++) { const tx = rnd() * w, ty = h * (.66 + rnd() * .22), th = h * (.12 + rnd() * .1);
      x.beginPath(); x.moveTo(tx, ty - th); x.lineTo(tx + th * .32, ty); x.lineTo(tx - th * .32, ty); x.closePath(); x.fillStyle = rnd() > .5 ? '#2f8a3e' : '#3fa24a'; x.fill(); }
    const gr = x.createLinearGradient(0, h * .84, 0, h); gr.addColorStop(0, '#6cbc47'); gr.addColorStop(1, '#4f9a33');
    x.fillStyle = gr; x.fillRect(0, h * .84, w, h * .16);
  },
  bg_cave(x, w, h) {
    x.fillStyle = '#0d0907'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 520; i++) {
      const cx = rnd() * w, cy = rnd() * h, r = 14 + rnd() * 30, d = cy / h;
      const v = Math.floor(28 + rnd() * 26 - d * 14);
      x.beginPath(); for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2 + rnd() * .4; x.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r * .8); }
      x.closePath(); x.fillStyle = `rgb(${v + 6},${v},${v - 4})`; x.fill(); x.strokeStyle = 'rgba(0,0,0,.6)'; x.lineWidth = 3; x.stroke();
    }
  },
  cliff_left(x, w, h) {
    const cols = ['#9a6a40', '#8b5d36', '#7a4e2c', '#6a4226', '#a4744a'];
    x.fillStyle = '#4a2e1a'; x.fillRect(0, 0, w, h);
    for (let y = -20; y < h; y += 34 + rnd() * 30) for (let xx = -20; xx < w; xx += 50 + rnd() * 40) {
      const ww = 60 + rnd() * 70, hh = 40 + rnd() * 40;
      x.beginPath(); x.moveTo(xx, y + rnd() * 10); x.lineTo(xx + ww, y + rnd() * 10); x.lineTo(xx + ww - rnd() * 10, y + hh); x.lineTo(xx + rnd() * 8, y + hh - rnd() * 6); x.closePath();
      x.fillStyle = cols[Math.floor(rnd() * cols.length)]; x.fill(); x.strokeStyle = 'rgba(40,20,10,.8)'; x.lineWidth = 3; x.stroke();
      x.fillStyle = 'rgba(255,230,190,.12)'; x.fillRect(xx + 4, y + 3, ww * .6, 5);
    }
    const sh = x.createLinearGradient(w * .55, 0, w, 0); sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,.55)');
    x.fillStyle = sh; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 10; i++) { const bx = rnd() * w * .8, by = 60 + rnd() * h * .9; x.fillStyle = rnd() > .5 ? '#4f9e35' : '#3a7d28'; x.beginPath(); x.ellipse(bx, by, 18 + rnd() * 16, 10 + rnd() * 8, 0, 0, Math.PI * 2); x.fill(); }
  },
  frame_post(x, w, h) { wood(x, w, h, false); x.fillStyle = '#3b3f44'; for (let y = 60; y < h; y += 200) { x.fillRect(0, y, w, 14); } },
  frame_beam(x, w, h) { wood(x, w, h, true); },
  frame_brace(x, w, h) { x.save(); x.translate(0, h); x.rotate(-Math.PI / 4); wood(x, w * 1.3, h * .22, true); x.restore(); },
  grass_edge(x, w, h) { for (let xx = 0; xx < w; xx += 14) { x.fillStyle = rnd() > .5 ? '#5fae3e' : '#3f8a2c'; x.beginPath(); x.ellipse(xx, h * .35, 16, 12 + rnd() * 10, 0, 0, Math.PI * 2); x.fill(); } },
  cell_tile(x, w, h) { stoneBlock(x, w, h, '#2a2422', '#3d3430'); },
  ore_gold(x, w, h) { gem(x, w, h, ORE_COL.G, 'cube'); },
  ore_copper(x, w, h) { gem(x, w, h, ORE_COL.C, 'cube'); },
  ore_jade(x, w, h) { gem(x, w, h, ORE_COL.J, 'crystal'); },
  ore_iron(x, w, h) { gem(x, w, h, ORE_COL.I, 'cube'); },
  ore_diamond(x, w, h) { gem(x, w, h, ORE_COL.D, 'diamond'); },
  rock(x, w, h) { boulders(x, w, h, ['#9a948e', '#5e5853'], 3, .22); },
  hidden(x, w, h) { boulders(x, w, h, ['#3a3532', '#1d1a18'], 1, .4); },
  crate(x, w, h) {
    wood(x, w * .84, h * .84, true); x.save(); x.translate(w * .08, h * .08); x.restore();
    x.clearRect(0, 0, w, h); x.save(); x.translate(w * .08, h * .08); wood(x, w * .84, h * .84, true);
    x.strokeStyle = '#5a3216'; x.lineWidth = w * .1; x.beginPath(); x.moveTo(w * .06, h * .06); x.lineTo(w * .78, h * .78); x.moveTo(w * .78, h * .06); x.lineTo(w * .06, h * .78); x.stroke();
    x.strokeStyle = OUT; x.lineWidth = 4; x.strokeRect(0, 0, w * .84, h * .84); x.restore();
  },
  bedrock(x, w, h) { stoneBlock(x, w, h, '#161211', '#211b19', '#120f0e'); boulders(x, w, h, ['#2a2422', '#141110'], 2, .2); },
  tunnel(x, w, h) { x.fillStyle = '#0f0b09'; x.fillRect(0, 0, w, h); const g = x.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, w * .7); g.addColorStop(0, 'rgba(60,40,25,.6)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); },
  rail_v(x, w, h) { rails(x, w, h, true); },
  rail_h(x, w, h) { rails(x, w, h, false); },
  rail_ramp(x, w, h) { x.save(); x.translate(0, h); x.rotate(-Math.PI / 4); x.translate(0, -w * .25); rails(x, w * .5, w * 1.42, true); x.restore(); },
  shaft_head(x, w, h) {
    x.strokeStyle = '#8a5428'; x.lineWidth = 16; x.strokeRect(10, 10, w - 20, h - 20);
    x.lineWidth = 12; x.beginPath(); x.moveTo(14, 14); x.lineTo(w - 14, h - 14); x.moveTo(w - 14, 14); x.lineTo(14, h - 14); x.stroke();
    x.strokeStyle = OUT; x.lineWidth = 3; x.strokeRect(2, 2, w - 4, h - 4);
  },
  switch_plate(x, w, h) { x.beginPath(); x.roundRect(3, 3, w - 6, h - 6, 12); x.fillStyle = '#6b3f1f'; x.fill(); x.lineWidth = 7; x.strokeStyle = '#f2b93a'; x.stroke(); },
  elevator(x, w, h) {
    x.beginPath(); x.roundRect(4, 4, w - 8, h - 8, 8); x.fillStyle = 'rgba(30,90,180,.35)'; x.fill(); x.lineWidth = 8; x.strokeStyle = '#2f7ad6'; x.stroke();
    x.strokeStyle = '#1b4f99'; x.lineWidth = 4; for (let i = 1; i < 4; i++) { x.beginPath(); x.moveTo(w * i / 4, 8); x.lineTo(w * i / 4, h - 8); x.stroke(); }
    x.fillStyle = '#c9d0d6'; x.fillRect(w / 2 - 3, 0, 6, 10);
  },
  cart(x, w, h) {
    x.beginPath(); x.moveTo(w * .06, h * .18); x.lineTo(w * .94, h * .18); x.lineTo(w * .82, h * .78); x.lineTo(w * .18, h * .78); x.closePath();
    const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#8d969f'); g.addColorStop(1, '#4b535b'); x.fillStyle = g; x.fill(); x.strokeStyle = OUT; x.lineWidth = 5; x.stroke();
    x.fillStyle = '#b8c0c8'; x.fillRect(w * .04, h * .12, w * .92, h * .1);
    x.fillStyle = '#2b2f33'; for (const wx of [.28, .72]) { x.beginPath(); x.arc(w * wx, h * .84, h * .13, 0, Math.PI * 2); x.fill(); }
  },
  ...Object.fromEntries(Object.entries({ G: 'gold', C: 'copper', J: 'jade', I: 'iron', D: 'diamond' }).map(([k, n]) => ['pile_' + n, (x, w, h) => {
    for (let i = 0; i < 7; i++) { const cx = w * (.18 + rnd() * .64), cy = h * (.35 + rnd() * .4), r = h * .28;
      x.beginPath(); for (let a = 0; a < 6; a++) x.lineTo(cx + Math.cos(a * 1.05) * r, cy + Math.sin(a * 1.05) * r * .8); x.closePath();
      const g = x.createLinearGradient(cx - r, cy - r, cx + r, cy + r); g.addColorStop(0, ORE_COL[k][0]); g.addColorStop(.5, ORE_COL[k][1]); g.addColorStop(1, ORE_COL[k][2]);
      x.fillStyle = g; x.fill(); x.strokeStyle = OUT; x.lineWidth = 3; x.stroke(); }
  }])),
  pile_rock(x, w, h) { boulders(x, w, h, ['#9a948e', '#5e5853'], 4, .2); },
  mine_entrance(x, w, h) {
    x.beginPath(); x.moveTo(0, h); x.quadraticCurveTo(w * .1, h * .25, w * .5, h * .2); x.quadraticCurveTo(w * .9, h * .25, w, h); x.closePath(); x.fillStyle = '#7d756d'; x.fill(); x.strokeStyle = OUT; x.lineWidth = 5; x.stroke();
    x.fillStyle = '#120d0a'; x.fillRect(w * .32, h * .45, w * .36, h * .55);
    x.fillStyle = '#8a5428'; x.fillRect(w * .27, h * .4, w * .07, h * .6); x.fillRect(w * .66, h * .4, w * .07, h * .6); x.fillRect(w * .22, h * .36, w * .56, h * .08);
    x.beginPath(); x.moveTo(w * .15, h * .38); x.lineTo(w * .5, h * .1); x.lineTo(w * .85, h * .38); x.closePath(); x.fillStyle = '#6b3f1f'; x.fill(); x.stroke();
  },
  miner(x, w, h) {
    x.fillStyle = '#2f6fd0'; x.beginPath(); x.roundRect(w * .28, h * .48, w * .44, h * .36, 10); x.fill(); x.strokeStyle = OUT; x.lineWidth = 4; x.stroke();
    x.fillStyle = '#6b4a2b'; x.fillRect(w * .32, h * .82, w * .14, h * .16); x.fillRect(w * .54, h * .82, w * .14, h * .16);
    x.fillStyle = '#f2c4a0'; x.beginPath(); x.arc(w * .5, h * .36, w * .24, 0, Math.PI * 2); x.fill(); x.stroke();
    x.fillStyle = '#ffc21f'; x.beginPath(); x.arc(w * .5, h * .3, w * .26, Math.PI, 0); x.fill(); x.stroke(); x.fillRect(w * .18, h * .28, w * .64, h * .05);
    x.fillStyle = '#fff4c2'; x.beginPath(); x.arc(w * .5, h * .22, w * .06, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#2a1a10'; for (const ex of [.42, .58]) { x.beginPath(); x.arc(w * ex, h * .38, w * .03, 0, Math.PI * 2); x.fill(); }
  },
  furnace(x, w, h) {
    const or = '#d8622a', od = '#a8461d', gr = '#8f979f';
    x.fillStyle = '#6e3420'; x.beginPath(); x.roundRect(w * .05, h * .88, w * .9, h * .1, 10); x.fill();
    x.strokeStyle = or; x.lineWidth = w * .05; x.beginPath(); x.moveTo(w * .5, h * .12); x.bezierCurveTo(w * .55, -h * .02, w * .9, 0, w * .86, h * .3); x.lineTo(w * .86, h * .5); x.stroke();
    x.fillStyle = '#5b6168'; x.beginPath(); x.roundRect(w * .78, h * .48, w * .16, h * .4, 8); x.fill();
    x.fillStyle = or; x.beginPath(); x.moveTo(w * .36, h * .14); x.lineTo(w * .64, h * .14); x.lineTo(w * .72, h * .46); x.lineTo(w * .28, h * .46); x.closePath(); x.fill(); x.strokeStyle = OUT; x.lineWidth = 4; x.stroke();
    x.fillStyle = gr; x.fillRect(w * .26, h * .46, w * .48, h * .16); x.strokeRect(w * .26, h * .46, w * .48, h * .16);
    x.strokeStyle = '#5b6168'; x.lineWidth = 3; for (let i = 1; i < 6; i++) { x.beginPath(); x.moveTo(w * (.26 + i * .08), h * .46); x.lineTo(w * (.26 + i * .08), h * .62); x.stroke(); }
    x.fillStyle = od; x.beginPath(); x.ellipse(w * .5, h * .64, w * .32, h * .05, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = or; x.beginPath(); x.roundRect(w * .2, h * .64, w * .6, h * .25, 16); x.fill(); x.strokeStyle = OUT; x.lineWidth = 4; x.stroke();
    x.fillStyle = '#3a0a00'; x.beginPath(); x.roundRect(w * .38, h * .72, w * .24, h * .16, [20, 20, 0, 0]); x.fill();
    x.strokeStyle = gr; x.lineWidth = w * .035; for (const px of [.38, .62]) { x.beginPath(); x.moveTo(w * .5, h * .1); x.quadraticCurveTo(w * px, h * .1, w * (px + (px - .5) * .4), h * .3); x.stroke(); }
  },
  fire(x, w, h) {
    const tongue = (cx, top, wd, col) => { x.beginPath(); x.moveTo(cx - wd, h); x.quadraticCurveTo(cx - wd, h * .5, cx, top); x.quadraticCurveTo(cx + wd, h * .5, cx + wd, h); x.closePath(); x.fillStyle = col; x.fill(); };
    tongue(w * .5, h * .05, w * .36, '#ff7a1a'); tongue(w * .3, h * .3, w * .2, '#ff9a2a'); tongue(w * .7, h * .28, w * .2, '#ff9a2a'); tongue(w * .5, h * .35, w * .18, '#ffe27a');
  },
  siding_bay(x, w, h) {
    x.beginPath(); x.roundRect(4, 10, w - 8, h - 14, 10); const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#4a525c'); g.addColorStop(1, '#2b3036'); x.fillStyle = g; x.fill(); x.strokeStyle = OUT; x.lineWidth = 5; x.stroke();
    x.fillStyle = '#14171a'; x.beginPath(); x.roundRect(16, 24, w - 32, h - 40, 8); x.fill();
    x.fillStyle = '#8a5428'; x.fillRect(0, 0, w, 16); x.strokeRect(0, 0, w, 16);
  },
  chest(x, w, h) { wood(x, w, h * .9, true); x.fillStyle = '#f2b93a'; x.fillRect(0, h * .4, w, h * .08); x.fillRect(w * .45, h * .35, w * .1, h * .2); },
  lantern(x, w, h) {
    x.fillStyle = '#3b3f44'; x.fillRect(w * .2, h * .18, w * .6, h * .7); x.fillStyle = '#ffc35a'; x.fillRect(w * .3, h * .28, w * .4, h * .5);
    x.strokeStyle = '#3b3f44'; x.lineWidth = 3; x.beginPath(); x.arc(w / 2, h * .16, w * .18, Math.PI, 0); x.stroke();
  },
  hand(x, w, h) {
    x.save(); x.translate(w * .55, h * .55); x.rotate(-.6);
    x.fillStyle = '#fff'; x.strokeStyle = OUT; x.lineWidth = 5;
    x.beginPath(); x.roundRect(-w * .08, -h * .5, w * .16, h * .5, 12); x.fill(); x.stroke();
    x.beginPath(); x.roundRect(-w * .22, -h * .1, w * .44, h * .42, 20); x.fill(); x.stroke();
    x.restore();
  },
};

/* ---------------- loading ---------------- */
const textures = {};
export const tex = (key) => textures[key];

export async function loadArt() {
  let available = [];
  try { const r = await fetch('__sprites'); if (r.ok) available = await r.json(); } catch { /* opened without serve.js */ }
  for (const [key, [w, h]] of Object.entries(SPRITES)) {
    if (available.includes(key + '.png')) {
      try { textures[key] = await PIXI.Assets.load(`assets/sprites/${key}.png`); textures[key].__real = true; continue; } catch (e) { console.warn('sprite failed', key, e); }
    }
    const c = document.createElement('canvas'); c.width = w * 2; c.height = h * 2;
    const x = c.getContext('2d'); x.scale(2, 2);
    (PAINT[key] || (() => {}))(x, w, h);
    textures[key] = PIXI.Texture.from(c);
  }
  return { real: Object.keys(textures).filter(k => textures[k].__real) };
}

// A sprite sized to the key's design size (works for 1x placeholders and 2x real art alike).
export function sprite(key, w, h) {
  const [dw, dh] = SPRITES[key];
  const s = new PIXI.Sprite(textures[key]);
  s.width = w ?? dw; s.height = h ?? dh;
  return s;
}
