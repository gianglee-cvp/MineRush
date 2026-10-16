// Procedural 3D models. Every builder returns a THREE.Group sized for a 1x1 cell.
// To swap in real art later, put a .glb path in assets/manifest.js under the same key.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

let seed = 1337;
export const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const jitter = (geo, amt) => {
  const p = geo.attributes.position;
  const map = new Map();
  for (let i = 0; i < p.count; i++) {
    const k = `${p.getX(i).toFixed(3)},${p.getY(i).toFixed(3)},${p.getZ(i).toFixed(3)}`;
    if (!map.has(k)) map.set(k, [(rand() - .5) * amt, (rand() - .5) * amt, (rand() - .5) * amt]);
    const d = map.get(k);
    p.setXYZ(i, p.getX(i) + d[0], p.getY(i) + d[1], p.getZ(i) + d[2]);
  }
  geo.computeVertexNormals();
  return geo;
};
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: .85, metalness: 0, ...o });
const shadow = (m) => { m.castShadow = true; m.receiveShadow = true; return m; };

/* ---------------- shared materials ---------------- */
export const MAT = {
  stone: std(0x2c2624, { roughness: .9 }),
  stoneFace: std(0x221d1b, { roughness: .95 }),
  dirtA: std(0x3a322d, { roughness: 1, flatShading: true }),
  dirtB: std(0x463b33, { roughness: 1, flatShading: true }),
  cave: std(0x120d0a, { roughness: 1 }),
  wood: std(0x8a5428, { roughness: .8 }),
  woodDark: std(0x5a3216, { roughness: .85 }),
  metal: std(0x9aa4ad, { roughness: .35, metalness: .85 }),
  metalDark: std(0x4b535b, { roughness: .45, metalness: .7 }),
  rock: std(0x6e655d, { roughness: .95, flatShading: true }),
  rockDark: std(0x554d47, { roughness: .95, flatShading: true }),
  brick: std(0x7c3a24, { roughness: .95 }),
  brickDark: std(0x6d2a16, { roughness: .9 }),
  soil: std(0x7a4a28, { roughness: 1, flatShading: true }),
  soilDark: std(0x5e3820, { roughness: 1, flatShading: true }),
  grass: std(0x5fae3e, { roughness: .9, flatShading: true }),
  grassDark: std(0x3f8a2c, { roughness: .9, flatShading: true }),
  glow: new THREE.MeshBasicMaterial({ color: 0xffd34d, transparent: true, opacity: .9 }),
  dim: new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: .3, depthWrite: false }),
};

/* ---------------- ores ---------------- */
const ORE_STYLE = {
  G: { color: 0xffc629, emissive: 0x8a5600, metalness: .55, roughness: .22 },
  C: { color: 0xe8642a, emissive: 0x4a1400, metalness: .55, roughness: .3 },
  J: { color: 0x1fcf63, emissive: 0x04461b, metalness: .05, roughness: .08 },
  I: { color: 0xd7dee6, emissive: 0x2a3036, metalness: .7, roughness: .3 },
};
const oreMat = {};
for (const k in ORE_STYLE) {
  const s = ORE_STYLE[k];
  oreMat[k] = k === 'J'
    ? new THREE.MeshPhysicalMaterial({ ...s, flatShading: true, clearcoat: 1, clearcoatRoughness: .05, emissiveIntensity: .9 })
    : new THREE.MeshStandardMaterial({ ...s, flatShading: true, emissiveIntensity: 1 });
}
export const oreMaterial = (k) => oreMat[k];

function gemGeometry(k) {
  if (k === 'G') return jitter(new THREE.IcosahedronGeometry(.3, 0), .05).scale(1.05, .95, .8);
  if (k === 'C') return jitter(new THREE.DodecahedronGeometry(.3, 0), .07).scale(1, 1, .82);
  if (k === 'J') return new THREE.OctahedronGeometry(.31, 0).scale(.95, 1.15, .7);
  return jitter(new THREE.IcosahedronGeometry(.29, 1), .045).scale(1, .95, .8);
}

export function makeGem(k, size = 1) {
  const g = new THREE.Group();
  const main = shadow(new THREE.Mesh(gemGeometry(k), oreMat[k]));
  main.rotation.set(rand() * .6, rand() * Math.PI, rand() * .6);
  main.scale.setScalar(size * 1.18);
  g.add(main);
  // a couple of small chips make the cluster read as ore, not a single jewel
  for (let i = 0; i < 2; i++) {
    const chip = shadow(new THREE.Mesh(gemGeometry(k), oreMat[k]));
    chip.scale.setScalar(.32 * size);
    chip.position.set((i ? .24 : -.24) * size, (-.2 + rand() * .1) * size, .05);
    chip.rotation.set(rand() * 3, rand() * 3, rand() * 3);
    g.add(chip);
  }
  g.userData.spin = main;
  return g;
}

/* ---------------- cells ---------------- */
const baseGeo = new RoundedBoxGeometry(.94, .94, .5, 3, .09);
const faceGeo = new RoundedBoxGeometry(.8, .8, .04, 2, .06);

function cellBase() {
  const g = new THREE.Group();
  const b = shadow(new THREE.Mesh(baseGeo, MAT.stone));
  const f = new THREE.Mesh(faceGeo, MAT.stoneFace);
  f.position.z = .25; f.receiveShadow = true;
  g.add(b, f);
  return g;
}

export function makeOreCell(k) {
  const g = cellBase();
  const gem = makeGem(k);
  gem.position.z = .45;
  g.add(gem);
  g.userData.gem = gem;
  return g;
}

export function makeRockCell() {
  const g = cellBase();
  const pos = [[-.14, .08, .42, .25], [.15, .1, .4, .22], [0, -.14, .45, .27]];
  pos.forEach(([x, y, z, r], i) => {
    const m = shadow(new THREE.Mesh(jitter(new THREE.DodecahedronGeometry(r, 0), .08), i % 2 ? MAT.rockDark : MAT.rock));
    m.position.set(x, y, z); m.rotation.set(rand() * 3, rand() * 3, rand() * 3);
    g.add(m);
  });
  return g;
}

let qTex;
function questionTexture() {
  if (qTex) return qTex;
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d');
  x.font = '800 104px "Baloo 2", sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillStyle = 'rgba(0,0,0,.6)'; x.fillText('?', 66, 74);
  x.fillStyle = '#8c8580'; x.fillText('?', 64, 70);
  qTex = new THREE.CanvasTexture(c); qTex.colorSpace = THREE.SRGBColorSpace;
  return qTex;
}
export function makeHiddenCell() {
  const g = new THREE.Group();
  const b = shadow(new THREE.Mesh(baseGeo, MAT.stone));
  g.add(b);
  const lump = shadow(new THREE.Mesh(jitter(new THREE.IcosahedronGeometry(.36, 1), .1).scale(1, 1, .45), std(0x2a2523, { roughness: 1, flatShading: true })));
  lump.position.z = .3;
  g.add(lump);
  const q = new THREE.Mesh(new THREE.PlaneGeometry(.55, .55), new THREE.MeshBasicMaterial({ map: questionTexture(), transparent: true }));
  q.position.z = .48;
  g.add(q);
  return g;
}

export function makeDirtBlock(variant = 0) {
  const geo = jitter(new THREE.BoxGeometry(1, 1, .7, 2, 2, 1), .12);
  const m = shadow(new THREE.Mesh(geo, variant ? MAT.dirtB : MAT.dirtA));
  const g = new THREE.Group(); g.add(m);
  m.rotation.z = (rand() - .5) * .15;
  return g;
}

// Highlight frame for a tappable cell
export function makeGlowFrame() {
  const g = new THREE.Group();
  const t = .05, s = .96;
  const bar = (w, h, x, y) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, .04), MAT.glow); m.position.set(x, y, 0); g.add(m); };
  bar(s, t, 0, s / 2); bar(s, t, 0, -s / 2); bar(t, s, s / 2, 0); bar(t, s, -s / 2, 0);
  return g;
}

/* ---------------- tunnels and rails ---------------- */
// dirs: {up, down, left, right} booleans – which neighbours are tunnels
export function makeTunnelCell(dirs) {
  const g = new THREE.Group();
  const back = new THREE.Mesh(new THREE.BoxGeometry(1, 1, .1), MAT.cave);
  back.position.z = -.3; back.receiveShadow = true;
  g.add(back);
  const vertical = dirs.up || dirs.down;
  // timber supports along the walls
  const post = new THREE.BoxGeometry(.1, 1, .16);
  if (vertical) {
    for (const x of [-.44, .44]) { const p = shadow(new THREE.Mesh(post, MAT.woodDark)); p.position.set(x, 0, -.12); g.add(p); }
  }
  if (dirs.left || dirs.right) {
    for (const y of [.44]) { const b = shadow(new THREE.Mesh(new THREE.BoxGeometry(1, .1, .16), MAT.woodDark)); b.position.set(0, y, -.12); g.add(b); }
  }
  // rails from centre to each open side
  const seg = (dx, dy) => {
    const len = .5;
    const along = new THREE.Vector2(dx, dy);
    const perp = new THREE.Vector2(-dy, dx);
    for (const s of [-.14, .14]) {
      const r = new THREE.Mesh(new THREE.BoxGeometry(dx ? len : .04, dy ? len : .04, .05), MAT.metal);
      r.position.set(along.x * len / 2 + perp.x * s, along.y * len / 2 + perp.y * s, -.12);
      r.castShadow = true; g.add(r);
    }
    for (let i = 0; i < 2; i++) {
      const t = new THREE.Mesh(new THREE.BoxGeometry(dx ? .07 : .42, dy ? .07 : .42, .04), MAT.wood);
      t.position.set(along.x * (.12 + i * .25), along.y * (.12 + i * .25), -.17);
      g.add(t);
    }
  };
  if (dirs.up) seg(0, 1);
  if (dirs.down) seg(0, -1);
  if (dirs.left) seg(-1, 0);
  if (dirs.right) seg(1, 0);
  return g;
}

/* ---------------- props ---------------- */
export function makeCart(load = null) {
  const g = new THREE.Group();
  const tub = shadow(new THREE.Mesh(new THREE.CylinderGeometry(.4, .3, .32, 4, 1).rotateY(Math.PI / 4).scale(1.1, 1, .8), MAT.metalDark));
  tub.position.y = .26; g.add(tub);
  const rim = shadow(new THREE.Mesh(new THREE.BoxGeometry(.66, .05, .48), MAT.metal));
  rim.position.y = .43; g.add(rim);
  for (const x of [-.2, .2]) for (const z of [-.16, .16]) {
    const w = shadow(new THREE.Mesh(new THREE.CylinderGeometry(.085, .085, .06, 14).rotateX(Math.PI / 2), MAT.metal));
    w.position.set(x, .09, z); g.add(w);
  }
  if (load) {
    for (let i = 0; i < 6; i++) {
      const n = shadow(new THREE.Mesh(gemGeometry(load), oreMat[load]));
      n.scale.setScalar(.38);
      n.position.set((rand() - .5) * .4, .47 + rand() * .08, (rand() - .5) * .22);
      n.rotation.set(rand() * 3, rand() * 3, rand() * 3);
      g.add(n);
    }
  }
  return g;
}

export function makeLantern() {
  const g = new THREE.Group();
  const frame = new THREE.Mesh(new THREE.BoxGeometry(.16, .22, .16), MAT.metalDark);
  const glass = new THREE.Mesh(new THREE.BoxGeometry(.11, .15, .17), new THREE.MeshBasicMaterial({ color: 0xffc35a }));
  const hook = new THREE.Mesh(new THREE.BoxGeometry(.03, .14, .03), MAT.metalDark);
  hook.position.y = .17;
  g.add(frame, glass, hook);
  g.userData.glass = glass;
  return g;
}

// Small timber head-frame over the shaft mouth (the "X" box in the mockup)
export function makeHeadFrame() {
  const g = new THREE.Group();
  const b = (w, h, d, x, y, z, m = MAT.wood, rz = 0) => { const s = shadow(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m)); s.position.set(x, y, z); s.rotation.z = rz; g.add(s); };
  b(.12, .62, .14, -.46, 0, 0); b(.12, .62, .14, .46, 0, 0);
  b(1.06, .12, .16, 0, .3, 0); b(1.06, .12, .16, 0, -.28, 0);
  b(1.1, .08, .1, 0, 0, .02, MAT.woodDark, .52); b(1.1, .08, .1, 0, 0, .02, MAT.woodDark, -.52);
  return g;
}

// Blast furnace: orange tapered stack with a grey panel band, downcomer pipes,
// a big arcing gas pipe, and a glowing tap hole with flickering flames at the base.
export function makeFurnace(signColor = 0xffc629) {
  const g = new THREE.Group();
  const orange = std(0xd8622a, { roughness: .55, metalness: .35 });
  const orangeDark = std(0xa8461d, { roughness: .6, metalness: .3 });
  const grey = std(0x8f979f, { roughness: .45, metalness: .6 });
  const greyDark = std(0x5b6168, { roughness: .5, metalness: .6 });
  const rust = std(0x6e3420, { roughness: .9 });
  const add = (mesh, x = 0, y = 0, z = 0) => { mesh.position.set(x, y, z); shadow(mesh); g.add(mesh); return mesh; };

  // base platform and hearth
  add(new THREE.Mesh(new RoundedBoxGeometry(1.34, .16, 1.14, 3, .06), rust), 0, .08, 0);
  add(new THREE.Mesh(new RoundedBoxGeometry(1.2, .06, 1.0, 2, .03), orangeDark), 0, .19, 0);
  add(new THREE.Mesh(new THREE.CylinderGeometry(.5, .54, .34, 24), orange), 0, .39, -.05);
  add(new THREE.Mesh(new THREE.TorusGeometry(.5, .085, 10, 28).rotateX(Math.PI / 2), orangeDark), 0, .57, -.05);
  // grey panel band with ribs, and a walkway ring
  add(new THREE.Mesh(new THREE.CylinderGeometry(.42, .48, .36, 24), grey), 0, .8, -.05);
  for (let i = 0; i < 12; i++) {
    const ang = i / 12 * Math.PI * 2;
    const rib = add(new THREE.Mesh(new THREE.BoxGeometry(.03, .34, .03), greyDark), Math.sin(ang) * .455, .8, -.05 + Math.cos(ang) * .455);
    rib.rotation.y = ang;
  }
  add(new THREE.Mesh(new THREE.CylinderGeometry(.6, .6, .04, 28), greyDark), 0, .6, -.05);
  add(new THREE.Mesh(new THREE.TorusGeometry(.6, .012, 6, 40).rotateX(Math.PI / 2), grey), 0, .72, -.05);
  // tapered upper stack (lathe profile)
  const prof = [[.42, 0], [.4, .12], [.33, .45], [.24, .78], [.2, .9]].map(([r, y]) => new THREE.Vector2(r, y));
  add(new THREE.Mesh(new THREE.LatheGeometry(prof, 24), orange), 0, .98, -.05);
  add(new THREE.Mesh(new THREE.CylinderGeometry(.33, .33, .05, 24), orangeDark), 0, 1.3, -.05);
  // top deck with railing and four grey downcomers
  add(new THREE.Mesh(new THREE.CylinderGeometry(.34, .34, .05, 20), greyDark), 0, 1.9, -.05);
  add(new THREE.Mesh(new THREE.TorusGeometry(.34, .012, 6, 30).rotateX(Math.PI / 2), grey), 0, 2.0, -.05);
  for (let i = 0; i < 4; i++) {
    const ang = Math.PI / 4 + i * Math.PI / 2, dx = Math.sin(ang), dz = Math.cos(ang);
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(dx * .12, 2.12, -.05 + dz * .12),
      new THREE.Vector3(dx * .3, 2.08, -.05 + dz * .3),
      new THREE.Vector3(dx * .36, 1.8, -.05 + dz * .36),
      new THREE.Vector3(dx * .3, 1.42, -.05 + dz * .3),
    ]);
    add(new THREE.Mesh(new THREE.TubeGeometry(curve, 16, .055, 8), grey));
  }
  add(new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, .3, 10), grey), 0, 2.2, -.05);
  // big arcing gas pipe to a side tank
  const arc = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 2.32, -.05), new THREE.Vector3(.1, 2.62, -.1), new THREE.Vector3(.5, 2.6, -.22),
    new THREE.Vector3(.66, 2.2, -.28), new THREE.Vector3(.66, 1.3, -.28),
  ]);
  add(new THREE.Mesh(new THREE.TubeGeometry(arc, 32, .06, 10), orange));
  add(new THREE.Mesh(new THREE.CylinderGeometry(.16, .16, .7, 16), greyDark), .66, .95, -.28);
  add(new THREE.Mesh(new THREE.SphereGeometry(.16, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), greyDark), .66, 1.3, -.28);
  add(new THREE.Mesh(new THREE.CylinderGeometry(.13, .13, .5, 14), grey), -.6, .5, -.3);
  add(new THREE.Mesh(new THREE.SphereGeometry(.13, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), grey), -.6, .75, -.3);

  // tap hole: dark arch, molten channel to the front, flickering flames
  add(new THREE.Mesh(new RoundedBoxGeometry(.42, .3, .14, 2, .05), greyDark), 0, .36, .44);
  const mouth = new THREE.Mesh(new THREE.PlaneGeometry(.3, .2), new THREE.MeshBasicMaterial({ color: 0xc23a08 }));
  mouth.position.set(0, .34, .515); g.add(mouth);
  const molten = new THREE.MeshStandardMaterial({ color: 0xff8a1f, emissive: 0xff6a00, emissiveIntensity: 1.6, roughness: .3 });
  const channel = new THREE.Mesh(new THREE.BoxGeometry(.12, .03, .42), molten);
  channel.position.set(0, .235, .6); g.add(channel);
  const fireMat = new THREE.MeshBasicMaterial({ color: 0xff8a1f, transparent: true, opacity: .95 });
  const coreMat = new THREE.MeshBasicMaterial({ color: 0xffe27a, transparent: true, opacity: .95 });
  const flames = [];
  [[-.08, .22, .12], [0, .28, .15], [.08, .21, .11]].forEach(([x, h, r]) => {
    const f = new THREE.Mesh(new THREE.ConeGeometry(r * .55, h, 8), fireMat);
    f.position.set(x, .25 + h / 2, .53); g.add(f); flames.push(f);
    const c = new THREE.Mesh(new THREE.ConeGeometry(r * .28, h * .6, 8), coreMat);
    c.position.set(x, .25 + h * .3, .55); g.add(c); flames.push(c);
  });
  // ore sign showing what this furnace is smelting
  const sign = new THREE.Mesh(new RoundedBoxGeometry(.3, .16, .05, 2, .03), new THREE.MeshStandardMaterial({ color: signColor, emissive: signColor, emissiveIntensity: .45, metalness: .4, roughness: .3 }));
  sign.position.set(0, .8, .44); g.add(sign);
  // small warning lights on the base
  for (const x of [-.48, .48]) {
    const l = new THREE.Mesh(new THREE.BoxGeometry(.1, .05, .02), new THREE.MeshBasicMaterial({ color: 0xffd34d }));
    l.position.set(x, .12, .575); g.add(l);
  }
  const light = new THREE.PointLight(0xff7a1a, 7, 3.2, 1.5);
  light.position.set(0, .45, 1); g.add(light);
  g.userData = { flames, light, molten, sign };
  return g;
}

export function makeMineEntrance() {
  const g = new THREE.Group();
  const b = (w, h, d, x, y, z, m = MAT.wood, rz = 0) => { const s = shadow(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m)); s.position.set(x, y, z); s.rotation.z = rz; g.add(s); return s; };
  // rocky mound
  const mound = shadow(new THREE.Mesh(jitter(new THREE.SphereGeometry(1, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), .18).scale(1.1, .9, .7), MAT.rock));
  mound.position.set(0, 0, -.3); g.add(mound);
  const door = new THREE.Mesh(new THREE.BoxGeometry(.62, .78, .1), MAT.cave);
  door.position.set(0, .39, .32); g.add(door);
  b(.13, .95, .16, -.4, .47, .36); b(.13, .95, .16, .4, .47, .36);
  b(1.06, .14, .2, 0, .98, .38);
  b(.7, .1, .7, -.26, 1.18, .1, MAT.woodDark, .45); b(.7, .1, .7, .26, 1.18, .1, MAT.woodDark, -.45);
  const sign = b(.5, .2, .05, 0, 1.12, .5, MAT.woodDark);
  sign.rotation.z = .03;
  return g;
}

export function makeMiner() {
  const g = new THREE.Group();
  const skin = std(0xf2c4a0, { roughness: .7 });
  const blue = std(0x2f6fd0, { roughness: .7 });
  const brown = std(0x6b4a2b, { roughness: .8 });
  const yellow = std(0xffc21f, { roughness: .4, metalness: .1 });
  const legs = shadow(new THREE.Mesh(new THREE.CylinderGeometry(.13, .14, .22, 12), brown)); legs.position.y = .11;
  const body = shadow(new THREE.Mesh(new THREE.CylinderGeometry(.15, .17, .26, 14), blue)); body.position.y = .34;
  const head = shadow(new THREE.Mesh(new THREE.SphereGeometry(.2, 18, 14), skin)); head.position.y = .64;
  const helmet = shadow(new THREE.Mesh(new THREE.SphereGeometry(.215, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), yellow)); helmet.position.y = .67;
  const brim = shadow(new THREE.Mesh(new THREE.CylinderGeometry(.25, .25, .03, 18), yellow)); brim.position.y = .67;
  const lamp = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, .04, 12).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xfff4c2 }));
  lamp.position.set(0, .78, .2);
  const eyeM = new THREE.MeshBasicMaterial({ color: 0x2a1a10 });
  for (const x of [-.07, .07]) { const e = new THREE.Mesh(new THREE.SphereGeometry(.028, 8, 6), eyeM); e.position.set(x, .63, .18); g.add(e); }
  for (const x of [-.2, .2]) { const a = shadow(new THREE.Mesh(new THREE.CapsuleGeometry(.05, .14, 4, 8), blue)); a.position.set(x, .36, 0); a.rotation.z = x > 0 ? -.5 : .4; g.add(a); }
  g.add(legs, body, head, helmet, brim, lamp);
  return g;
}

export function makePine(h = 1.6) {
  const g = new THREE.Group();
  const trunk = shadow(new THREE.Mesh(new THREE.CylinderGeometry(.06, .08, h * .25, 6), MAT.woodDark));
  trunk.position.y = h * .12; g.add(trunk);
  const m = rand() > .5 ? MAT.grassDark : std(0x2f7a3a, { roughness: .9, flatShading: true });
  for (let i = 0; i < 3; i++) {
    const c = shadow(new THREE.Mesh(new THREE.ConeGeometry(h * (.32 - i * .07), h * .42, 7), m));
    c.position.y = h * (.32 + i * .2); g.add(c);
  }
  return g;
}

export function makeMountain(r, h, snow = true) {
  const g = new THREE.Group();
  const m = new THREE.Mesh(jitter(new THREE.ConeGeometry(r, h, 7, 3), r * .08), std(0x5f7fa6, { flatShading: true, roughness: 1 }));
  m.position.y = h / 2; g.add(m);
  if (snow) {
    const s = new THREE.Mesh(new THREE.ConeGeometry(r * .3, h * .3, 7), std(0xf2f6fa, { flatShading: true }));
    s.position.y = h * .86; g.add(s);
  }
  return g;
}

export function makeSidingBay() {
  const g = new THREE.Group();
  const base = shadow(new THREE.Mesh(new RoundedBoxGeometry(.86, .72, .7, 2, .06), std(0x4a525c, { roughness: .45, metalness: .6 })));
  base.position.y = .36; g.add(base);
  const inner = new THREE.Mesh(new THREE.BoxGeometry(.7, .56, .1), std(0x15171a, { roughness: 1 }));
  inner.position.set(0, .38, .32); g.add(inner);
  const lip = shadow(new THREE.Mesh(new THREE.BoxGeometry(.9, .08, .74), MAT.wood));
  lip.position.y = .74; g.add(lip);
  for (const x of [-.14, .14]) {
    const r = new THREE.Mesh(new THREE.BoxGeometry(.04, .04, .7), MAT.metal);
    r.position.set(x, .13, .1); g.add(r);
  }
  return g;
}

let glowTex;
export function makeGlowSprite(color = 0xffa040, size = 1, opacity = .6) {
  if (!glowTex) {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const x = c.getContext('2d'); const gr = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.35, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = gr; x.fillRect(0, 0, 128, 128);
    glowTex = new THREE.CanvasTexture(c);
  }
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false }));
  s.scale.setScalar(size);
  return s;
}
