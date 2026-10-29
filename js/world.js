// The stall and the street around it, laid out from the photos.
//
// x runs along the road (right is toward the black gate), z comes out toward
// the road and the camera, y is up. The house front is at z = 0.
import * as THREE from 'three';
import { M, box, mesh } from './util.js';
import { rnd } from './textures.js';

// Where things are, shared with the people and the animation.
export const SPOTS = {
  fire: new THREE.Vector3(-2.25, 0, 1.75),   // the three stones, inside the zinc house
  stool: new THREE.Vector3(-3.05, 0, 1.5),   // Racheal's small stool
  table: new THREE.Vector3(1.35, 0, 4.05),   // Lois's table, outside by the end post
  lois: new THREE.Vector3(1.35, 0, 3.45),
  bench: { x: 3.05, z0: .55, z1: 3.55 },     // from the wall by the gate out toward the road
  gate: new THREE.Vector3(2.3, 0, .45),      // just in front of the black gate, left of the bench
  tap: new THREE.Vector3(-2.6, 0, 5.4),      // the tap out front where Lois fetches water
};

export function buildWorld(scene, T) {
  const wood = M({ map: T.wood });
  const blockMat = M({ map: T.block });
  const roofMat = M({ map: T.zinc, metalness: .4, roughness: .55, side: THREE.DoubleSide });
  const oldRoofMat = M({ map: T.zincOld, metalness: .3, roughness: .7, side: THREE.DoubleSide });

  // ground and the road in front
  scene.add(mesh(new THREE.PlaneGeometry(220, 220), M({ map: T.dirt, roughness: 1 }), { rx: -Math.PI / 2, cast: false }));
  scene.add(mesh(new THREE.PlaneGeometry(160, 5.5), M({ map: T.road, roughness: 1 }), { rx: -Math.PI / 2, y: .01, z: 10.5, cast: false }));
  const pebble = M({ color: '#9a8270', flatShading: true });
  for (let i = 0; i < 110; i++) scene.add(mesh(new THREE.DodecahedronGeometry(rnd(.03, .1)), pebble, { x: rnd(-30, 30), y: .02, z: rnd(3.5, 16), ry: rnd(0, 3), cast: false }));

  // hills, far behind the houses
  const hill = M({ color: '#3f4d36', flatShading: true });
  [[-40, -75, 30, 20], [-5, -85, 34, 26], [30, -80, 28, 18], [65, -90, 30, 22], [-75, -90, 30, 18]].forEach(([x, z, r, h]) => {
    const g = new THREE.ConeGeometry(r, h, 8, 3); const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) if (p.getY(i) > -h / 2 + .1) { p.setX(i, p.getX(i) + rnd(-2.5, 2.5)); p.setZ(i, p.getZ(i) + rnd(-2.5, 2.5)); }
    g.computeVertexNormals();
    scene.add(mesh(g, hill, { x, y: h / 2 - .5, z, cast: false }));
  });

  // ---- the block house with the blue-trimmed zinc roof
  scene.add(mesh(box(10.4, 2.9, 6), blockMat, { x: -3.9, y: 1.45, z: -3 }));
  const hip = new THREE.ConeGeometry(8.2, 1.9, 4, 1, true); hip.rotateY(Math.PI / 4); hip.scale(1, 1, .62);
  scene.add(mesh(hip, roofMat, { x: -3.9, y: 3.85, z: -3 }));
  scene.add(mesh(box(11.6, .22, .08), M({ color: '#2f6fb8', roughness: .5 }), { x: -3.9, y: 2.95, z: .74 }));
  const windowMat = M({ color: '#ffcf73', emissive: '#ffb347', emissiveIntensity: 0 });
  scene.add(mesh(box(.9, .7, .05), windowMat, { x: .55, y: 2.1, z: .02 }));

  // ---- boundary wall and the black gate on the right
  const wallMat = M({ map: T.block.clone() }); wallMat.map.repeat.set(2, 1); wallMat.map.needsUpdate = true;
  scene.add(mesh(box(.5, 2.45, .5), blockMat, { x: 1.05, y: 1.22, z: .25 }));
  scene.add(mesh(box(.5, 2.3, .3), wallMat, { x: 1.55, y: 1.15, z: .15 }));
  scene.add(mesh(box(2.9, 2.2, .1), M({ map: T.gate, roughness: .7, metalness: .3 }), { x: 3.25, y: 1.1, z: .1 }));
  const spikeMat = M({ color: '#1a1512' });
  for (let i = 0; i < 13; i++) scene.add(mesh(new THREE.ConeGeometry(.04, .18, 4), spikeMat, { x: 1.9 + i * .22, y: 2.29, z: .1 }));
  scene.add(mesh(box(4.4, 2.3, .3), wallMat, { x: 6.9, y: 1.15, z: .15 }));
  // the compound behind the gate
  const nRoof = new THREE.ConeGeometry(4, 1.3, 4, 1, true); nRoof.rotateY(Math.PI / 4);
  scene.add(mesh(box(6, 2.4, 5), blockMat, { x: 5.2, y: 1.2, z: -4 }));
  scene.add(mesh(nRoof, roofMat, { x: 5.2, y: 3.05, z: -4 }));

  // ---- the zinc house: a lean-to on wooden posts jutting toward the road
  const X0 = -8.9, X1 = .55, D = 3.2;
  scene.add(mesh(box(X1 - X0, .06, D), M({ color: '#6f4c35', roughness: 1 }), { x: (X0 + X1) / 2, y: .03, z: D / 2, cast: false }));
  const leanMat = M({ map: T.zinc.clone(), metalness: .35, roughness: .55, side: THREE.DoubleSide });
  leanMat.map.repeat.set(14, 1); leanMat.map.needsUpdate = true;
  scene.add(mesh(new THREE.PlaneGeometry(X1 - X0 + .4, D + .5), leanMat, { x: (X0 + X1) / 2, y: 2.35, z: D / 2 + .1, rx: -Math.PI / 2 + .18 }));
  [X0 + .1, -4.2, X1 - .1].forEach((x) => scene.add(mesh(box(.12, 2.2, .12), wood, { x, y: 1.1, z: D })));
  scene.add(mesh(box(X1 - X0, .1, .1), wood, { x: (X0 + X1) / 2, y: 2.15, z: D }));
  scene.add(mesh(box(X1 - X0, .08, .06), wood, { x: (X0 + X1) / 2, y: .06, z: D + .05 }));
  const log = M({ color: '#5a3d26' });
  for (let i = 0; i < 7; i++) scene.add(mesh(new THREE.CylinderGeometry(.04, .05, rnd(.8, 1.3), 6), log, { x: -7 + rnd(0, 1.2), y: .07 + (i % 3) * .05, z: 1.6 + rnd(-.3, .3), rz: Math.PI / 2, ry: rnd(-.5, .5) }));
  scene.add(mesh(new THREE.SphereGeometry(.18, 10, 8), M({ color: '#ece6d8', roughness: 1 }), { x: X0 + .35, y: 1.65, z: D - .1 }));

  // ---- three stones, fire, pan of oil with kosai
  const F = SPOTS.fire;
  const stone = M({ color: '#7a716a', flatShading: true });
  [0, 2.1, 4.2].forEach((a) => scene.add(mesh(new THREE.DodecahedronGeometry(.2, 0), stone, { x: F.x + Math.cos(a) * .3, y: .16, z: F.z + Math.sin(a) * .3, ry: a })));
  const prof = []; for (let i = 0; i <= 10; i++) { const t = i / 10; prof.push(new THREE.Vector2(.05 + .5 * Math.sin(t * Math.PI / 2), .02 + .17 * (1 - Math.cos(t * Math.PI / 2)))); }
  const pan = [
    mesh(new THREE.LatheGeometry(prof, 24), M({ color: '#1c1c1c', metalness: .6, roughness: .45, side: THREE.DoubleSide }), { x: F.x, y: .33, z: F.z }),
    mesh(new THREE.CircleGeometry(.47, 24), M({ color: '#b07a18', roughness: .2, emissive: '#3a2000' }), { x: F.x, y: .49, z: F.z, rx: -Math.PI / 2, cast: false }),
  ];
  pan.forEach((m) => scene.add(m));
  const kosaiMat = M({ color: '#c9862e', roughness: .7 });
  const kosaiGeo = new THREE.SphereGeometry(.045, 10, 8); kosaiGeo.scale(1, .8, 1);
  // the kosai in the pan have their own material, so the game can colour them raw, golden or burnt
  const panKosaiMat = M({ color: '#e8cf9a', roughness: .7 });
  const panKosai = [];
  for (let i = 0; i < 9; i++) { const a = i / 9 * 6.28, r = rnd(.1, .33); const k = mesh(kosaiGeo, panKosaiMat, { x: F.x + Math.cos(a) * r, y: .5, z: F.z + Math.sin(a) * r }); panKosai.push(k); scene.add(k); }
  const flameMat = new THREE.MeshBasicMaterial({ color: '#ffb03a', transparent: true, opacity: .85, blending: THREE.AdditiveBlending, depthWrite: false });
  const flames = [];
  for (let i = 0; i < 5; i++) { const f = new THREE.Mesh(new THREE.ConeGeometry(.08, .32, 6), flameMat.clone()); f.position.set(F.x + rnd(-.15, .15), .2, F.z + rnd(-.15, .15)); scene.add(f); flames.push(f); }
  const fireLight = new THREE.PointLight('#ff8a2a', 6, 9, 1.6); fireLight.position.set(F.x, .55, F.z + .2); scene.add(fireLight);
  const smoke = [];
  for (let i = 0; i < 10; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.smoke, transparent: true, depthWrite: false, opacity: .4 })); s.userData.t = i / 10; scene.add(s); smoke.push(s); }

  // Racheal's small stool
  const S = SPOTS.stool;
  scene.add(mesh(box(.42, .05, .3), wood, { x: S.x, y: .4, z: S.z }));
  [[-.17, -.11], [.17, -.11], [-.17, .11], [.17, .11]].forEach(([dx, dz]) => scene.add(mesh(box(.05, .4, .05), wood, { x: S.x + dx, y: .2, z: S.z + dz })));

  // ---- Lois's table: green basket, pepper jar, nylons, the red flask underneath
  const Tb = SPOTS.table;
  scene.add(mesh(box(1.15, .06, .62), wood, { x: Tb.x, y: .8, z: Tb.z }));
  [[-.5, -.26], [.5, -.26], [-.5, .26], [.5, .26]].forEach(([dx, dz]) => scene.add(mesh(box(.06, .8, .06), wood, { x: Tb.x + dx, y: .4, z: Tb.z + dz })));
  const basket = mesh(new THREE.CylinderGeometry(.27, .2, .2, 20, 1, true), M({ map: T.holes, side: THREE.DoubleSide, roughness: .6 }), { x: Tb.x - .2, y: .93, z: Tb.z });
  scene.add(basket);
  scene.add(mesh(new THREE.CircleGeometry(.2, 20), M({ color: '#2f9a4a' }), { x: Tb.x - .2, y: .835, z: Tb.z, rx: -Math.PI / 2 }));
  // what is in the green basket: shown up to 24, as the stock rises and falls
  const basketKosai = [];
  for (let i = 0; i < 24; i++) { const a = rnd(0, 6.28), r = rnd(0, .19); const k = mesh(kosaiGeo, kosaiMat, { x: Tb.x - .2 + Math.cos(a) * r, y: .87 + (i / 24) * .1, z: Tb.z + Math.sin(a) * r }); k.visible = false; basketKosai.push(k); scene.add(k); }
  const jar = mesh(new THREE.CylinderGeometry(.08, .08, .2, 16), new THREE.MeshPhysicalMaterial({ color: '#dff3f8', roughness: .1, transparent: true, opacity: .5 }), { x: Tb.x + .3, y: .93, z: Tb.z - .05 });
  scene.add(jar);
  scene.add(mesh(new THREE.CylinderGeometry(.07, .07, .14, 16), M({ color: '#c8331f' }), { x: Tb.x + .3, y: .9, z: Tb.z - .05 }));
  scene.add(mesh(new THREE.CylinderGeometry(.008, .008, .26, 6), M({ color: '#bbb', metalness: .6 }), { x: Tb.x + .33, y: 1.0, z: Tb.z - .05, rz: -.3 }));
  scene.add(mesh(box(.18, .02, .14), M({ color: '#f4f2ec' }), { x: Tb.x + .05, y: .84, z: Tb.z + .18 }));
  // a small bowl of puff-puff at the corner of the table
  scene.add(mesh(new THREE.SphereGeometry(.13, 18, 8, 0, 6.3, Math.PI / 2, Math.PI / 2), M({ color: '#e9e4da', roughness: .4, side: THREE.DoubleSide }), { x: .9, y: .96, z: Tb.z - .2 }));
  const bowl = mesh(new THREE.CylinderGeometry(.13, .13, .12, 16), M({ transparent: true, opacity: 0 }), { x: .9, y: .9, z: Tb.z - .2, cast: false });
  scene.add(bowl);   // invisible: just something to tap
  const puffMat = M({ color: '#b8742c', roughness: .75 });
  const bowlPuff = [];
  for (let i = 0; i < 12; i++) { const a = i * 2.4, r = i < 6 ? .07 : .03; const p = mesh(new THREE.SphereGeometry(.035, 10, 8), puffMat, { x: .9 + Math.cos(a) * r, y: .87 + (i < 6 ? 0 : .04), z: Tb.z - .2 + Math.sin(a) * r }); p.visible = false; bowlPuff.push(p); scene.add(p); }
  // the black nylon an order is packed into; it fills out as things go in
  const nylon = mesh(new THREE.SphereGeometry(.1, 16, 12), M({ color: '#141414', roughness: .35 }), { x: Tb.x + .3, y: .88, z: Tb.z + .17 });
  nylon.scale.set(1, .35, 1);
  scene.add(nylon);
  const flask = new THREE.Group(); flask.position.set(Tb.x - .1, 0, Tb.z); scene.add(flask);
  flask.add(mesh(new THREE.CylinderGeometry(.19, .19, .52, 20), M({ color: '#c62f2a', roughness: .4 }), { y: .26 }));
  flask.add(mesh(new THREE.CylinderGeometry(.13, .15, .08, 16), M({ color: '#8e1f1b' }), { y: .56 }));
  flask.add(mesh(new THREE.TorusGeometry(.12, .02, 6, 16, Math.PI), M({ color: '#222' }), { y: .62, ry: Math.PI / 2 }));
  // V's black sandal by the end post
  const sandal = mesh(box(.12, .03, .3), M({ color: '#141414', roughness: .5 }), { x: .75, y: .02, z: 3.55, ry: .4 });
  scene.add(sandal);

  // ---- lantern at the end of the zinc house
  const lantern = new THREE.Group(); lantern.position.set(.2, 1.75, 3.05); scene.add(lantern);
  lantern.add(mesh(new THREE.CylinderGeometry(.005, .005, .35, 4), M({ color: '#222' }), { y: .25 }));
  lantern.add(mesh(new THREE.CylinderGeometry(.1, .1, .03, 12), M({ color: '#222' }), { y: .07 }));
  const lanternGlass = mesh(new THREE.CylinderGeometry(.08, .08, .16, 12), M({ color: '#ffd77f', emissive: '#ffb347', emissiveIntensity: 0, transparent: true, opacity: .9 }));
  lantern.add(lanternGlass);
  lantern.add(mesh(new THREE.CylinderGeometry(.1, .1, .03, 12), M({ color: '#222' }), { y: -.09 }));
  const lanternLight = new THREE.PointLight('#ffc670', 0, 11, 1.4); lantern.add(lanternLight);

  // ---- the long bench
  const B = SPOTS.bench;
  scene.add(mesh(box(.32, .06, B.z1 - B.z0), wood, { x: B.x, y: .46, z: (B.z0 + B.z1) / 2 }));
  [B.z0 + .15, B.z1 - .15].forEach((z) => [-.12, .12].forEach((dx) => scene.add(mesh(box(.05, .46, .05), wood, { x: B.x + dx, y: .23, z }))));

  // ---- the street: neighbours' houses, poles and wires, maize, trees
  const lit = [];
  const plaster = M({ map: T.plaster });
  function house(x, z, w, d, h, { ry = 0, mat = blockMat, roof = oldRoofMat } = {}) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g);
    g.add(mesh(box(w, h, d), mat, { y: h / 2 }));
    const r = new THREE.ConeGeometry(Math.hypot(w, d) / 2 * 1.05, 1.4, 4, 1, true); r.rotateY(Math.PI / 4); r.scale(w / Math.hypot(w, d) * 1.41, 1, d / Math.hypot(w, d) * 1.41);
    g.add(mesh(r, roof, { y: h + .7 }));
    const win = M({ color: '#ffcf73', emissive: '#ffb347', emissiveIntensity: 0 });
    g.add(mesh(box(.8, .6, .05), win, { x: -w / 4, y: h * .62, z: d / 2 + .01 }));
    g.add(mesh(box(.9, 1.9, .05), M({ color: '#3b2a20' }), { x: w / 4, y: .95, z: d / 2 + .01 }));
    lit.push(win);
    return g;
  }
  // along our side of the road, left and right of the stall
  house(-16, -2, 7, 5, 2.7, { mat: plaster });
  house(-25, -3, 6, 5, 2.6);
  house(-34, -2, 8, 5, 2.8, { mat: plaster });
  house(13.5, -2.5, 6, 5, 2.6, { mat: plaster });
  house(22, -3, 7, 5, 2.7);
  house(31, -2, 6, 5, 2.6, { mat: plaster });
  // across the road, facing the stall
  house(-14, 20, 7, 5, 2.7, { ry: Math.PI });
  house(-3, 21, 8, 5, 2.8, { ry: Math.PI, mat: plaster });
  house(10, 20, 7, 5, 2.6, { ry: Math.PI });
  house(21, 21, 6, 5, 2.7, { ry: Math.PI, mat: plaster });
  // the small zinc toilet down the road
  scene.add(mesh(box(1.1, 2, 1.1), M({ map: T.zincOld }), { x: -11.5, y: 1, z: 2.5 }));

  // electric poles along the road, wired together
  const poleMat = M({ color: '#3a2c22' }); const wireMat = M({ color: '#111' });
  const poles = [-36, -18, 0, 18, 36].map((x) => new THREE.Vector3(x + 8, 7.6, 7.2));
  poles.forEach((p) => scene.add(mesh(new THREE.CylinderGeometry(.08, .11, 8, 8), poleMat, { x: p.x, y: 4, z: p.z })));
  for (let i = 0; i < poles.length - 1; i++) {
    const a = poles[i], b = poles[i + 1], m = a.clone().lerp(b, .5); m.y -= .9;
    scene.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(a, m, b), 24, .015, 4), wireMat));
  }

  // maize beside the houses
  const stalk = new THREE.CylinderGeometry(.015, .02, 1.9, 4);
  const leaf = new THREE.PlaneGeometry(.08, .55);
  const stalkMat = M({ color: '#8a8a3a' }), leafMat = M({ color: '#9b9a4a', side: THREE.DoubleSide });
  const fields = [[-11, -6, 5, 4], [9.5, 3, 2.5, 3], [-20, 6, 4, 2.5], [26, 5.5, 5, 2]];
  const count = fields.reduce((n, f) => n + Math.round(f[2] * f[3] * 6), 0);
  const stalks = new THREE.InstancedMesh(stalk, stalkMat, count), leaves = new THREE.InstancedMesh(leaf, leafMat, count * 2);
  const q = new THREE.Object3D(); let si = 0, li = 0;
  fields.forEach(([cx, cz, w, d]) => {
    for (let i = 0; i < Math.round(w * d * 6); i++) {
      const x = cx + rnd(-w / 2, w / 2), z = cz + rnd(-d / 2, d / 2), h = rnd(.85, 1.15);
      q.position.set(x, .95 * h, z); q.rotation.set(rnd(-.08, .08), 0, rnd(-.08, .08)); q.scale.set(1, h, 1); q.updateMatrix(); stalks.setMatrixAt(si++, q.matrix);
      for (let k = 0; k < 2; k++) { q.position.set(x, rnd(.8, 1.6), z); q.rotation.set(rnd(-.6, .6), rnd(0, 6.3), rnd(.6, 1.1) * (k ? 1 : -1)); q.scale.set(1, 1, 1); q.updateMatrix(); leaves.setMatrixAt(li++, q.matrix); }
    }
  });
  stalks.castShadow = leaves.castShadow = true; scene.add(stalks, leaves);

  // a few trees
  const trunk = M({ color: '#4a3526' }), crown = M({ color: '#3d5a2c', flatShading: true });
  [[-21, -9], [8, -9], [-30, 15], [28, 15], [16, -12]].forEach(([x, z]) => {
    scene.add(mesh(new THREE.CylinderGeometry(.18, .25, 3, 7), trunk, { x, y: 1.5, z }));
    const c = new THREE.IcosahedronGeometry(rnd(1.8, 2.4), 1); scene.add(mesh(c, crown, { x, y: 4, z }));
  });

  // Things on and under Lois's table that a tap can land on.
  const tappable = { basket, jar, flask, nylon, bowl };

  // Racheal's small MP3 speaker on the ground beside her; it glows with the music
  const speaker = new THREE.Group(); speaker.position.set(-3.55, 0, 1.15); speaker.rotation.y = .5; scene.add(speaker);
  speaker.add(mesh(box(.16, .1, .07), M({ color: '#202226', roughness: .4 }), { y: .05 }));
  speaker.add(mesh(new THREE.CircleGeometry(.032, 16), M({ color: '#55585e', roughness: .9 }), { y: .05, z: .036, cast: false }));
  const speakerLed = mesh(box(.03, .012, .005), M({ color: '#3fd0ff', emissive: '#3fd0ff', emissiveIntensity: 0 }), { x: .05, y: .085, z: .036, cast: false });
  speaker.add(speakerLed);
  // the small white jerrycan the leftover oil goes back into at closing
  const jerrycan = new THREE.Group(); jerrycan.position.set(-2.7, 0, 2.4); jerrycan.visible = false; scene.add(jerrycan);
  jerrycan.add(mesh(box(.16, .22, .1), M({ color: '#f2f2ee', roughness: .5 }), { y: .11 }));
  jerrycan.add(mesh(new THREE.CylinderGeometry(.02, .02, .04, 8), M({ color: '#f2b84b' }), { x: .04, y: .24 }));
  // how bright the fire is (0 = not lit yet), eased toward `target` in main.js
  const fire = { on: 1, target: 1 };

  // the tap in front of the stall where Lois fills her bucket; `water` is the stream
  const TAP = SPOTS.tap;
  scene.add(mesh(new THREE.CylinderGeometry(.04, .04, .85, 8), M({ color: '#7d8a8f', metalness: .6, roughness: .4 }), { x: TAP.x, y: .42, z: TAP.z }));
  scene.add(mesh(new THREE.CylinderGeometry(.02, .02, .16, 8), M({ color: '#7d8a8f', metalness: .6 }), { x: TAP.x, y: .8, z: TAP.z + .08, rx: Math.PI / 2 }));
  scene.add(mesh(box(.5, .05, .5), M({ color: '#8f8a82', roughness: 1 }), { x: TAP.x, y: .025, z: TAP.z + .12, cast: false }));
  const water = mesh(new THREE.CylinderGeometry(.012, .012, 1, 6), new THREE.MeshStandardMaterial({ color: '#bfe3ff', transparent: true, opacity: .75 }), { x: TAP.x, y: .55, z: TAP.z + .16, cast: false });
  water.visible = false; scene.add(water);
  return { pan, fire, prof, water, bowlPuff, speaker, speakerLed, jerrycan, windowMat, lit, lanternGlass, lanternLight, fireLight, flames, smoke, panKosai, panKosaiMat, basketKosai, sandal, nylon, tappable };
}
