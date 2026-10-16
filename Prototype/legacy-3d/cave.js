// The pit around the board: rocky cave wall behind the cells, timber frame,
// brown cliffs on both sides with plants, the rim at the top and a depth vignette.
import * as THREE from 'three';
import { rand } from './models.js';

const lerp = THREE.MathUtils.lerp;
const pick = (a) => a[Math.floor(rand() * a.length)];

function boulders(count, place, colorAt, matOpts = {}) {
  const geo = new THREE.DodecahedronGeometry(1, 0);
  const mat = new THREE.MeshStandardMaterial({ roughness: 1, flatShading: true, ...matOpts });
  const mesh = new THREE.InstancedMesh(geo, mat, count);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(), p = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    const { x, y, z, r, sx = 1, sy = 1, sz = .6 } = place(i);
    p.set(x, y, z);
    q.setFromEuler(e.set(rand() * 3, rand() * 3, rand() * 3));
    s.set(r * sx, r * sy, r * sz);
    m.compose(p, q, s);
    mesh.setMatrixAt(i, m);
    mesh.setColorAt(i, colorAt(x, y));
  }
  mesh.receiveShadow = true;
  mesh.castShadow = true;
  return mesh;
}

export function buildCave({ halfW = 3.5, top = -.4, bottom = -6.4 }) {
  const g = new THREE.Group();
  const lanterns = [];
  const FRAME_X = halfW + .2;          // timber posts just outside the board
  const PIT_BOTTOM = bottom - 1.6;     // the pit keeps going below the board

  /* ---- 1. back wall: very dark plate + dark boulders that get darker with depth ---- */
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(FRAME_X * 2 + .4, 9), new THREE.MeshBasicMaterial({ color: 0x090605 }));
  plate.position.set(0, -4.2, -.62);
  g.add(plate);
  const caveCols = ['#2c241f', '#352b24', '#241d19', '#3b3029', '#1f1916'].map(c => new THREE.Color(c));
  const back = boulders(340, () => ({
    x: (rand() * 2 - 1) * (FRAME_X + .1), y: lerp(top + .2, PIT_BOTTOM, rand()), z: -.6 + rand() * .04,
    r: .22 + rand() * .3, sx: 1 + rand() * .4, sy: .8 + rand() * .3, sz: .5,
  }), (x, y) => {
    const depth = THREE.MathUtils.clamp((top - y) / (top - PIT_BOTTOM), 0, 1);
    const edge = Math.abs(x) / FRAME_X;
    return pick(caveCols).clone().multiplyScalar(1.05 - depth * .45 - edge * .2);
  });
  g.add(back);

  /* ---- 2. soil and roots between the rim and the first row ---- */
  const soil = new THREE.MeshStandardMaterial({ color: 0x4a2f1c, roughness: 1, flatShading: true });
  for (const side of [-1, 1]) {
    const band = new THREE.Mesh(new THREE.BoxGeometry(halfW - .5, .42, .5), soil);
    band.position.set(side * (halfW + .5) / 2, -.2, .02);
    band.receiveShadow = true;
    g.add(band);
  }
  const rootMat = new THREE.MeshStandardMaterial({ color: 0x6b4a2b, roughness: 1 });
  for (let i = 0; i < 14; i++) {
    const x = (rand() * 2 - 1) * halfW;
    if (Math.abs(x) < .7) continue;
    const len = .2 + rand() * .3;
    const root = new THREE.Mesh(new THREE.CylinderGeometry(.015, .03, len, 5), rootMat);
    root.position.set(x, -.38 - len / 2 + .1, .3);
    root.rotation.z = (rand() - .5) * .8;
    g.add(root);
  }

  /* ---- 3. timber frame with braces ---- */
  const wood = new THREE.MeshStandardMaterial({ color: 0x8a5428, roughness: .8 });
  const woodDark = new THREE.MeshStandardMaterial({ color: 0x5a3216, roughness: .85 });
  const iron = new THREE.MeshStandardMaterial({ color: 0x3b3f44, roughness: .4, metalness: .8 });
  const beam = (w, h, x, y, z = .32, rz = 0, mat = wood) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, .26), mat);
    b.position.set(x, y, z); b.rotation.z = rz; b.castShadow = b.receiveShadow = true; g.add(b);
    // darker grain line so the timber doesn't read as a flat bar
    const grain = new THREE.Mesh(new THREE.BoxGeometry(w > h ? w * .96 : .03, w > h ? .03 : h * .96, .01), woodDark);
    grain.position.set(x, y, z + .135); grain.rotation.z = rz; g.add(grain);
    return b;
  };
  const postH = (0 - PIT_BOTTOM);
  for (const side of [-1, 1]) {
    beam(.26, postH, side * FRAME_X, -postH / 2);
    // iron bands
    for (let y = -.9; y > PIT_BOTTOM; y -= 2.2) {
      const band = new THREE.Mesh(new THREE.BoxGeometry(.3, .06, .3), iron);
      band.position.set(side * FRAME_X, y, .32); g.add(band);
    }
  }
  // top beam split around the shaft, bottom beam under the board
  const topHalf = FRAME_X - .55;
  for (const side of [-1, 1]) beam(topHalf, .2, side * (.55 + topHalf / 2), top + .08, .34);
  beam(FRAME_X * 2 + .26, .24, 0, bottom - .14, .34);
  // corner braces
  for (const side of [-1, 1]) {
    beam(.14, .9, side * (FRAME_X - .3), top - .28, .36, side * .78, woodDark);
    beam(.14, .9, side * (FRAME_X - .3), bottom + .2, .36, -side * .78, woodDark);
  }

  /* ---- 4. lanterns on the posts ---- */
  for (const side of [-1, 1]) for (const y of [-1.25, -3.4, -5.55]) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(.22, .05, .05), iron);
    arm.position.set(side * (FRAME_X - .16), y + .2, .48); g.add(arm);
    lanterns.push(new THREE.Vector3(side * (FRAME_X - .26), y, .55));
  }
  lanterns.push(new THREE.Vector3(.38, -.15, .5)); // by the shaft head

  /* ---- 5. cliffs either side ---- */
  // one continuous cliff face per side, built from fused rock domes so it has real
  // relief: bulging slabs, dark crevices between them, and layered strata colours
  const strata = ['#8b5d36', '#7a4e2c', '#9a6a40', '#6a4226', '#845632', '#5c3a22'].map(s => new THREE.Color(s));
  const n2 = (x, y) => .05 * Math.sin(x * 4.1 + y * 2.3) + .04 * Math.sin(y * 6.7 - x * 3.1);
  const CW = 3.6, CH = 10;
  for (const side of [-1, 1]) {
    // rock slabs: centre (u, y), radii, height
    const rocks = [];
    for (let y = .1; y > -CH; y -= .35 + rand() * .5) {
      let u = rand() * .12;
      while (u < 1.05) {
        const rx = .25 + rand() * .6, ry = .2 + rand() * .45;
        rocks.push({ u: u + rx / CW * .8, y: y - ry * .6 + (rand() - .5) * .35, rx, ry, h: .3 + rand() * .5 + (u < .2 ? .25 : 0),
          tx: (rand() - .5) * .5, ty: (rand() - .5) * .5, col: strata[Math.floor(rand() * strata.length)] });
        u += (rx * 1.3) / CW + rand() * .04;
      }
    }
    // flat-topped, steep-sided slabs with a random tilt read as broken rock, not pillows
    let top = null;
    const height = (u, wy) => {
      let z = 0; top = null;
      for (const r of rocks) {
        const dx = (u - r.u) * CW / r.rx, dy = (wy - r.y) / r.ry;
        const d = Math.max(Math.abs(dx), Math.abs(dy)) * .6 + (dx * dx + dy * dy) * .4;
        if (d < 1) {
          const zz = r.h * Math.pow(1 - d, .22) + (dx * r.tx + dy * r.ty) * .25;
          if (zz > z) { z = zz; top = r; }
        }
      }
      return z;
    };
    const geo = new THREE.PlaneGeometry(CW, CH, 44, 120);
    const pos = geo.attributes.position, col = [];
    for (let i = 0; i < pos.count; i++) {
      const u = (pos.getX(i) + CW / 2) / CW;           // 0 at the timber frame, 1 at the outer edge
      const wx = side * (FRAME_X + .1 + u * CW);
      const wy = pos.getY(i) - CH / 2 + .06;           // top edge sits at the grass rim
      const hgt = height(u, wy);
      const z = -.1 + hgt + n2(wx, wy) + (rand() - .5) * .025;
      pos.setXYZ(i, wx, wy, z);
      // crevices dark, slab tops lighter; darker close to the pit
      const ao = .5 + .65 * Math.min(1, hgt / .55);
      const nearPit = u < .2 ? .75 + u * 1.25 : 1;
      const bandF = (wy + .25 * Math.sin(wx * 1.7)) * 2.1;
      const cc = (top ? top.col : strata[((Math.floor(bandF) % strata.length) + strata.length) % strata.length]).clone().multiplyScalar(ao * nearPit * (.95 + rand() * .1));
      col.push(cc.r, cc.g, cc.b);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    geo.computeVertexNormals();
    const face = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true, side: THREE.DoubleSide }));
    face.receiveShadow = true; face.castShadow = true;
    g.add(face);
    // a few rocks half-sunk into the face for detail
    for (let i = 0; i < 7; i++) {
      const r = new THREE.Mesh(new THREE.DodecahedronGeometry(.16 + rand() * .16, 0), new THREE.MeshStandardMaterial({ color: pick(strata).clone().multiplyScalar(.85), roughness: 1, flatShading: true }));
      const x = side * (FRAME_X + .7 + rand() * 2.4), y = lerp(-1.2, PIT_BOTTOM, rand());
      r.position.set(x, y, .35);
      r.scale.set(1.3, .8, .5); r.rotation.set(rand() * 3, rand() * 3, rand() * 3);
      r.castShadow = r.receiveShadow = true; g.add(r);
    }
  }

  /* ---- 6. plants: bushes on the cliffs, grass rim, vines hanging into the pit ---- */
  const leafA = new THREE.MeshStandardMaterial({ color: 0x4f9e35, roughness: .9, flatShading: true });
  const leafB = new THREE.MeshStandardMaterial({ color: 0x356f26, roughness: .9, flatShading: true });
  const bushGeo = new THREE.IcosahedronGeometry(1, 0);
  const bush = (x, y, z, s) => {
    for (let k = 0; k < 3; k++) {
      const b = new THREE.Mesh(bushGeo, rand() > .5 ? leafA : leafB);
      b.position.set(x + (rand() - .5) * s, y + (rand() - .5) * s * .6, z + rand() * .1);
      b.scale.set(s * (.6 + rand() * .4), s * (.45 + rand() * .3), s * .4);
      b.castShadow = true; g.add(b);
    }
  };
  for (const side of [-1, 1]) {
    for (let i = 0; i < 7; i++) bush(side * (FRAME_X + .5 + rand() * 1.2), lerp(-.8, PIT_BOTTOM + .5, rand()), .45, .14 + rand() * .1);
    bush(side * (FRAME_X + .35), -.15, .55, .35);
  }
  // grass rim along the whole top
  const rim = new THREE.Mesh(new THREE.BoxGeometry(16, .16, .7), leafA);
  rim.position.set(0, .03, .25); rim.receiveShadow = true; g.add(rim);
  const rimSoil = new THREE.Mesh(new THREE.BoxGeometry(16, .14, .62), soil);
  rimSoil.position.set(0, -.1, .24); g.add(rimSoil);
  // short upright blades on the rim
  for (let i = 0; i < 70; i++) {
    const x = -8 + rand() * 16;
    if (Math.abs(x) < .6) continue;
    const t = new THREE.Mesh(new THREE.ConeGeometry(.025 + rand() * .02, .1 + rand() * .1, 4), rand() > .5 ? leafA : leafB);
    t.position.set(x, .16 + rand() * .02, .35 + rand() * .2); g.add(t);
  }
  // soft grass overhang along the edge: flattened clumps that droop slightly
  for (let x = -8; x < 8; x += .16 + rand() * .1) {
    if (Math.abs(x) < .6) continue;
    const b = new THREE.Mesh(bushGeo, rand() > .5 ? leafA : leafB);
    const s = .1 + rand() * .07;
    b.position.set(x, -.04 - rand() * .05, .58 + rand() * .04);
    b.scale.set(s * 1.4, s * .7, s * .6);
    b.castShadow = true; g.add(b);
  }
  // vines
  const vineMat = new THREE.MeshStandardMaterial({ color: 0x3f8a2c, roughness: .9 });
  const leafGeo = new THREE.SphereGeometry(.06, 5, 4);
  for (let i = 0; i < 12; i++) {
    const side = i % 2 ? 1 : -1;
    const x = side * (FRAME_X - .3 + rand() * 1.6);
    const len = .6 + rand() * 1.6;
    const v = new THREE.Mesh(new THREE.CylinderGeometry(.015, .015, len, 4), vineMat);
    v.position.set(x, -len / 2 - .05, .6); v.rotation.z = (rand() - .5) * .15; g.add(v);
    for (let y = .1; y < len; y += .14) {
      const l = new THREE.Mesh(leafGeo, rand() > .5 ? leafA : leafB);
      l.position.set(x + (rand() - .5) * .1, -y - .05, .62); l.scale.set(1.2, .7, .5); g.add(l);
    }
  }

  /* ---- 7. depth vignette over the pit (edges and bottom darker) ---- */
  const c = document.createElement('canvas'); c.width = 256; c.height = 512;
  const x = c.getContext('2d');
  const rg = x.createRadialGradient(128, 200, 60, 128, 260, 300);
  rg.addColorStop(0, 'rgba(0,0,0,0)'); rg.addColorStop(.6, 'rgba(0,0,0,.12)'); rg.addColorStop(1, 'rgba(0,0,0,.55)');
  x.fillStyle = rg; x.fillRect(0, 0, 256, 512);
  const lg = x.createLinearGradient(0, 0, 0, 512);
  lg.addColorStop(0, 'rgba(0,0,0,.35)'); lg.addColorStop(.12, 'rgba(0,0,0,0)'); lg.addColorStop(.8, 'rgba(0,0,0,0)'); lg.addColorStop(1, 'rgba(0,0,0,.45)');
  x.fillStyle = lg; x.fillRect(0, 0, 256, 512);
  const vt = new THREE.CanvasTexture(c);
  const vig = new THREE.Mesh(new THREE.PlaneGeometry(FRAME_X * 2, (top - PIT_BOTTOM)), new THREE.MeshBasicMaterial({ map: vt, transparent: true, depthWrite: false }));
  vig.position.set(0, (top + PIT_BOTTOM) / 2, .75);
  vig.renderOrder = 5;
  g.add(vig);

  return { group: g, lanterns };
}
