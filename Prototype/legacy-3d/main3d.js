// Mine Rush prototype – map scene only (no gameplay logic yet).
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { LEVEL, ORE_INFO, parseCell, exposedSet } from './level.js';
import * as M from './models.js';
import { buildCave } from './cave.js';
import { MODELS } from '../assets/manifest.js';

const W = 1080, H = 1920;
const stage = document.getElementById('stage');

/* ---------------- stage scaling ---------------- */
function fit() {
  const s = Math.min(innerWidth / W, innerHeight / H);
  stage.style.transform = `scale(${s}) translate(-50%, -50%)`;
}
addEventListener('resize', fit);
fit();

/* ---------------- renderer, camera, lights ---------------- */
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('scene'), antialias: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
{
  const c = document.createElement('canvas'); c.width = 4; c.height = 256;
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#2f8ee8'); g.addColorStop(.5, '#7cc4ff'); g.addColorStop(1, '#d6efff');
  x.fillStyle = g; x.fillRect(0, 0, 4, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  scene.background = t;
}
scene.fog = new THREE.Fog(0xb9dcff, 70, 170);
// soft studio reflections so gold, iron and jade read as shiny instead of black
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), .04).texture;

const TARGET = new THREE.Vector3(0, -1.05, 0);
const DIST = 29, TILT = THREE.MathUtils.degToRad(10);
const camera = new THREE.PerspectiveCamera(32, W / H, .1, 200);
camera.position.set(0, TARGET.y + DIST * Math.sin(TILT), DIST * Math.cos(TILT));
camera.lookAt(TARGET);

scene.add(new THREE.HemisphereLight(0xd8eeff, 0x4a3020, .8));
const sun = new THREE.DirectionalLight(0xfff0d8, 2.1);
sun.position.set(-6, 11, 13);
sun.target.position.copy(TARGET);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 7, bottom: -10, near: 1, far: 50 });
sun.shadow.bias = -.0006;
scene.add(sun, sun.target);

/* ---------------- optional .glb overrides ---------------- */
const loaded = {};
async function preload() {
  const loader = new GLTFLoader();
  await Promise.all(Object.entries(MODELS).filter(([, p]) => p).map(([k, p]) =>
    loader.loadAsync(p).then(g => { loaded[k] = g.scene; }).catch(e => console.warn('Model failed, using procedural', k, e))));
}
const model = (key, fallback) => loaded[key] ? loaded[key].clone(true) : fallback();

/* ---------------- board ---------------- */
const ROWS = LEVEL.grid.length, COLS = LEVEL.grid[0].length;
const cx = c => c - (COLS - 1) / 2;
const cy = r => -.9 - r;
const animGems = [];

function buildBoard() {
  const board = new THREE.Group();
  const exposed = exposedSet(LEVEL.grid);
  const isTunnel = (r, c) => (r === -1 && LEVEL.grid[0][c] === '#') || (r >= 0 && r < ROWS && c >= 0 && c < COLS && LEVEL.grid[r][c] === '#');
  const glowFrames = [];

  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const cell = parseCell(LEVEL.grid[r][c]);
    let obj;
    if (cell.type === 'dirt') continue; // outside the mountain: the cave wall shows through
    else if (cell.type === 'tunnel') obj = M.makeTunnelCell({ up: isTunnel(r - 1, c), down: isTunnel(r + 1, c), left: isTunnel(r, c - 1), right: isTunnel(r, c + 1) });
    else if (cell.type === 'rock') obj = model('rock', M.makeRockCell);
    else if (cell.hidden) obj = model('hidden', M.makeHiddenCell);
    else { obj = model('ore_' + cell.color, () => M.makeOreCell(cell.color)); if (obj.userData.gem) animGems.push(obj.userData.gem); }
    obj.position.set(cx(c), cy(r), 0);
    board.add(obj);

    if (cell.type === 'ore' || cell.type === 'rock') {
      if (exposed.has(r + ',' + c)) {
        const f = M.makeGlowFrame(); f.position.set(cx(c), cy(r), .27); board.add(f); glowFrames.push(f);
      } else if (!cell.hidden) {
        const d = new THREE.Mesh(new THREE.PlaneGeometry(.92, .92), M.MAT.dim);
        d.position.set(cx(c), cy(r), .66); board.add(d);
      }
    }
  }

  // shaft collar between the surface and row 0
  for (let c = 0; c < COLS; c++) if (LEVEL.grid[0][c] === '#') {
    const t = M.makeTunnelCell({ up: true, down: true });
    t.scale.y = .4; t.position.set(cx(c), -.2, 0); board.add(t);
  }
  // rocky cave, timber frame, cliffs, plants and depth vignette
  const cave = buildCave({ halfW: COLS / 2, top: -.4, bottom: cy(ROWS - 1) - .5 });
  board.add(cave.group);
  cave.lanterns.forEach((p) => {
    const l = M.makeLantern(); l.position.copy(p); board.add(l); lanterns.push(l);
    const halo = M.makeGlowSprite(0xffa24a, 1.25, .55); halo.position.set(p.x, p.y, p.z + .15); board.add(halo); halos.push(halo);
    const pl = new THREE.PointLight(0xffb85a, 2.4, 2.8, 1.8); pl.position.set(p.x * .9, p.y, .95); board.add(pl); lanternLights.push(pl);
  });

  scene.add(board);
  return glowFrames;
}

/* ---------------- surface ---------------- */
const lanterns = [], lanternLights = [], furnaces = [], chimneys = [], halos = [];
let miner;
const anchors = {}; // world positions for HTML tags

function buildSurface() {
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(220, 120), M.MAT.grass);
  ground.rotation.x = -Math.PI / 2; ground.position.set(0, 0, -59.9); ground.receiveShadow = true;
  scene.add(ground);
  // a dirt path behind the rail
  const path = new THREE.Mesh(new THREE.PlaneGeometry(9.6, 1.4), M.MAT.soil);
  path.rotation.x = -Math.PI / 2; path.position.set(.3, .01, -.35); path.receiveShadow = true; scene.add(path);

  // surface rail from the mine door to the furnaces
  const rail = new THREE.Group();
  for (const z of [.06, .3]) { const r = new THREE.Mesh(new THREE.BoxGeometry(8.4, .05, .05), M.MAT.metal); r.position.set(.5, .1, z); r.castShadow = true; rail.add(r); }
  for (let x = -3.6; x <= 4.6; x += .32) { const t = new THREE.Mesh(new THREE.BoxGeometry(.08, .05, .5), M.MAT.wood); t.position.set(x, .07, .18); t.receiveShadow = true; rail.add(t); }
  scene.add(rail);

  const head = model('headframe', M.makeHeadFrame);
  head.position.set(0, -.2, .32); scene.add(head);

  const ent = model('entrance', M.makeMineEntrance);
  ent.position.set(-3.55, 0, -.75); ent.scale.setScalar(.95); scene.add(ent);
  miner = model('miner', M.makeMiner);
  miner.position.set(-2.95, .02, .55); miner.rotation.y = .35; miner.scale.setScalar(1.15); scene.add(miner);
  const cart = model('cart', () => M.makeCart());
  cart.position.set(-2.25, .12, .18); scene.add(cart);

  // siding platform + bays
  const deck = new THREE.Mesh(new THREE.BoxGeometry(4.4, .1, 1.1), M.MAT.woodDark);
  deck.position.set(-.08, .05, -.5); deck.receiveShadow = true; deck.castShadow = true; scene.add(deck);
  const n = LEVEL.sidings, gap = 1.04, x0 = -.08 - (n - 1) * gap / 2;
  for (let i = 0; i < n; i++) {
    const b = model('siding', M.makeSidingBay);
    b.position.set(x0 + i * gap, .1, -.55); scene.add(b);
  }
  anchors.siding = new THREE.Vector3(-.08, 1.25, -.55);

  // two active furnaces
  const oreHex = { G: 0xffc629, C: 0xe8642a, J: 0x1fcf63, I: 0xd7dee6 };
  [2.55, 3.74].forEach((x, i) => {
    const f = model('furnace', () => M.makeFurnace(oreHex[LEVEL.queue[i][0]]));
    f.position.set(x, 0, -.45); f.scale.setScalar(.88); scene.add(f); furnaces.push(f);
    const fh = M.makeGlowSprite(0xff7a1a, 1.2, .7); fh.position.set(x, .35, .25); scene.add(fh); halos.push(fh);
    chimneys.push(new THREE.Vector3(x + .58 * .88, 1.25, -.7));
    anchors['furnace' + i] = new THREE.Vector3(x, .02, .1);
  });
  // trees and mountains
  // far forest band
  for (let i = 0; i < 70; i++) {
    const t = M.makePine(1.6 + M.rand() * 1.6); t.position.set(-30 + M.rand() * 60, 0, -18 - M.rand() * 30); scene.add(t);
  }
  for (let i = 0; i < 18; i++) {
    const side = i % 2 ? 1 : -1;
    const x = side * (2.2 + M.rand() * 9), z = -1.6 - M.rand() * 9;
    if (x > 1.6 && x < 5 && z > -3) continue;
    const t = M.makePine(1.2 + M.rand() * 1.4); t.position.set(x, 0, z); scene.add(t);
  }
  [[-18, -70, 11, 8.5], [-5, -78, 13, 10], [10, -72, 11, 9], [24, -78, 12, 9.5], [-31, -78, 12, 8], [3, -60, 7, 5, false], [-12, -58, 6, 4.5, false], [17, -58, 7, 5, false]]
    .forEach(([x, z, r, h, snow = true]) => { const m = M.makeMountain(r, h, snow); m.position.set(x, -.2, z); scene.add(m); });
}

/* ---------------- smoke ---------------- */
const smokeTex = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const x = c.getContext('2d'); const g = x.createRadialGradient(32, 32, 2, 32, 32, 30);
  g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
})();
const puffs = [];
function spawnPuff(p) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeTex, color: 0x9a9a9a, transparent: true, opacity: .55, depthWrite: false }));
  s.position.copy(p); s.scale.setScalar(.25); s.userData.life = 0;
  scene.add(s); puffs.push(s);
}

/* ---------------- HUD ---------------- */
function furnaceSVG(color) {
  return `<svg viewBox="0 0 96 92"><rect x="14" y="16" width="68" height="70" rx="10" fill="#8f3a1f" stroke="#3a1608" stroke-width="4"/>
  <path d="M14 36 H82 M14 56 H82" stroke="#5e220f" stroke-width="3"/><rect x="58" y="2" width="12" height="18" fill="#4b535b"/>
  <path d="M26 86 V52 a22 22 0 0 1 44 0 V86 Z" fill="#ff8a1f" stroke="#2b1a10" stroke-width="4"/>
  <path d="M48 84 c-14 -6 -10 -20 0 -28 c10 8 14 22 0 28z" fill="#ffe27a"/>
  <rect x="32" y="60" width="32" height="16" rx="3" fill="${color}" stroke="#3a2410" stroke-width="3"/></svg>`;
}
function gemSVG(color) {
  return `<svg viewBox="0 0 54 54"><path d="M27 4 L48 20 L40 48 L14 48 L6 20 Z" fill="${color}" stroke="#1d140c" stroke-width="3"/>
  <path d="M27 4 L22 20 L27 48 L32 20 Z M6 20 H48" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="2"/></svg>`;
}
function buildHUD() {
  document.getElementById('level-num').textContent = LEVEL.number;
  const [a, b, ...rest] = LEVEL.queue;
  document.getElementById('furnace-active').innerHTML = [a, b].map(([k, n]) =>
    `<div class="f-card">${furnaceSVG(ORE_INFO[k].css)}<div class="f-name">${ORE_INFO[k].name.toUpperCase()}</div><div class="f-count">0/${n}</div></div>`).join('');
  document.getElementById('furnace-next-list').innerHTML = rest.slice(0, 2).map(([k, n]) =>
    `<div class="n-card">${gemSVG(ORE_INFO[k].css)}<div class="n-name">${ORE_INFO[k].name}</div><div class="n-need">${n}</div></div>`).join('');

  const labels = document.getElementById('labels');
  const cartIco = `<svg viewBox="0 0 40 32"><path d="M4 8 H36 L32 24 H8 Z" fill="#cfd6dd"/><circle cx="12" cy="27" r="4" fill="#cfd6dd"/><circle cx="28" cy="27" r="4" fill="#cfd6dd"/></svg>`;
  labels.innerHTML = `<div class="tag siding" data-a="siding">${cartIco}Sân ga: 0/${LEVEL.sidings}</div>`
    + [a, b].map(([, n], i) => `<div class="tag furnace" data-a="furnace${i}">0/${n}</div>`).join('');
}
const v = new THREE.Vector3();
function placeLabels() {
  for (const el of document.querySelectorAll('#labels [data-a]')) {
    v.copy(anchors[el.dataset.a]).project(camera);
    el.style.left = ((v.x + 1) / 2 * W) + 'px';
    el.style.top = ((1 - v.y) / 2 * H) + 'px';
  }
}

/* ---------------- loop ---------------- */
let glowFrames = [];
const clock = new THREE.Clock();
let puffTimer = 0;
function tick() {
  const dt = Math.min(clock.getDelta(), .05), t = clock.elapsedTime;
  M.MAT.glow.opacity = .55 + .4 * (.5 + .5 * Math.sin(t * 4));
  glowFrames.forEach(f => f.scale.setScalar(1 + .015 * Math.sin(t * 4)));
  animGems.forEach((g, i) => { g.userData.spin.rotation.y += dt * .35 * (i % 2 ? 1 : -1); });
  furnaces.forEach((f, i) => {
    f.userData.flames?.forEach((fl, j) => { fl.scale.y = .85 + .3 * Math.abs(Math.sin(t * 9 + j * 1.7 + i)); });
    if (f.userData.light) f.userData.light.intensity = 5.5 + 1.8 * Math.sin(t * 13 + i * 2);
    if (f.userData.molten) f.userData.molten.emissiveIntensity = 1.4 + .5 * Math.sin(t * 5 + i);
  });
  halos.forEach((h, i) => { h.material.opacity = .5 + .12 * Math.sin(t * 8 + i * 2.3); });
  lanternLights.forEach((l, i) => { l.intensity = 2 + .35 * Math.sin(t * 7 + i * 3) * Math.sin(t * 3.1 + i); });
  if (miner) miner.position.y = .02 + .02 * Math.abs(Math.sin(t * 2.2));

  puffTimer -= dt;
  if (puffTimer <= 0) { puffTimer = .35; chimneys.forEach(p => spawnPuff(p)); }
  for (let i = puffs.length - 1; i >= 0; i--) {
    const s = puffs[i]; s.userData.life += dt;
    const k = s.userData.life / 2.6;
    s.position.y += dt * .45; s.position.x += dt * .12;
    s.scale.setScalar(.25 + k * .7);
    s.material.opacity = .5 * (1 - k);
    if (k >= 1) { scene.remove(s); s.material.dispose(); puffs.splice(i, 1); }
  }

  renderer.render(scene, camera);
  placeLabels();
  requestAnimationFrame(tick);
}

(async () => {
  await Promise.all([preload(), document.fonts.ready]);
  glowFrames = buildBoard();
  buildSurface();
  buildHUD();
  tick();
  const ld = document.getElementById('loading');
  ld.style.opacity = 0; setTimeout(() => ld.remove(), 450);
})();
