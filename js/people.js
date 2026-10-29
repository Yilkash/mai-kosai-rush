// People, built from shapes, with real body proportions.
//
// Every person is a group facing +z, standing on y = 0, about 1.65 m tall at
// h = 1. Joints are groups so poses and animation rotate them: hips → torso,
// head, shoulders → elbows, hips → knees.
import * as THREE from 'three';
import { M, box, mesh } from './util.js';

function limb(len, rad, mat) {
  const pivot = new THREE.Group();
  pivot.add(mesh(new THREE.CapsuleGeometry(rad, Math.max(len - rad * 2, .01), 4, 12), mat, { y: -len / 2 }));
  return pivot;
}

/** A torso turned on a lathe: hips, waist, chest, shoulders. */
function torsoGeo({ female, chubby }) {
  const w = chubby ? 1.22 : 1;
  const pts = [
    [female ? .165 : .150, 0], [female ? .172 : .158, .05], [female ? .122 : .140, .13], [chubby ? .2 : female ? .135 : .148, .22],
    [female ? .158 : .168, .33], [.165, .41], [.13, .48], [.07, .52], [.001, .53],
  ].map(([r, y]) => new THREE.Vector2(r * (y > .1 && y < .3 ? w : Math.min(w, 1.08)), y));
  const g = new THREE.LatheGeometry(pts, 22);
  g.scale(1, 1, chubby ? .82 : .66);
  return g;
}

export function makeHuman(o) {
  const {
    skin = '#7a4a2e', top = '#3f7fbf', bottom = '#2b3340', wrapperMap = null, hair = 'short',
    female = false, chubby = false, sleeves = 'short', h = 1, shoes = '#1d1a17',
    shorts = false,   // shorts: cloth on the thighs only, bare shins
    skirt = null,     // a short skirt in this colour, bare legs
    dress = null,     // a dress to the knee in this colour (top and skirt together)
    earrings = false, handbag = null,
    curvy = false,    // fuller hips and bum
  } = o;
  if (dress) { o.top = dress; }
  const skinM = M({ color: skin, roughness: .6 });
  const lipM = M({ color: new THREE.Color(skin).multiplyScalar(.62), roughness: .5 });
  const topM = M({ color: dress || top });
  const botM = wrapperMap ? M({ map: wrapperMap }) : M({ color: bottom });

  const g = new THREE.Group();
  const body = new THREE.Group(); body.scale.setScalar(h); g.add(body);
  const hips = new THREE.Group(); hips.position.y = .9; body.add(hips);

  const torso = mesh(torsoGeo({ female, chubby }), topM); hips.add(torso);
  if (female) [-1, 1].forEach((s) => { const b = mesh(new THREE.SphereGeometry(.06, 12, 10), topM, { x: s * .055, y: .33, z: .085 }); b.scale.set(1, .9, .8); torso.add(b); });
  if (curvy) [-1, 1].forEach((s) => { const b = mesh(new THREE.SphereGeometry(.088, 14, 12), botM, { x: s * .068, y: -.02, z: -.06 }); b.scale.set(1, .95, .9); hips.add(b); });
  let wr = null;
  if (wrapperMap) {
    // a wrapper tied at the waist, down to mid-calf
    wr = mesh(new THREE.CylinderGeometry(.16, .2, .66, 20, 1, true), botM, { y: -.28 });
    wr.scale.z = .78; hips.add(wr);
    hips.add(mesh(new THREE.TorusGeometry(.155, .015, 6, 20), botM, { y: .06, rx: Math.PI / 2 }));
  }

  const bareLegs = !!(skirt || dress);
  if (bareLegs) {
    const len = dress ? .5 : .3;
    const sk = mesh(new THREE.CylinderGeometry(.165, .23, len, 20, 1, true), M({ color: dress || skirt, side: THREE.DoubleSide }), { y: -len / 2 + .04 });
    sk.scale.z = .78; hips.add(sk);
  }
  if (handbag) {
    const bag = new THREE.Group(); bag.position.set(.19, .02, .02); hips.add(bag);
    bag.add(mesh(box(.05, .16, .2), M({ color: handbag, roughness: .4 })));
    bag.add(mesh(new THREE.TorusGeometry(.2, .006, 4, 16, Math.PI * .9), M({ color: handbag }), { x: -.06, y: .2, rz: 1.75 }));
  }

  // neck and head
  hips.add(mesh(new THREE.CylinderGeometry(.045, .05, .1, 10), skinM, { y: .58 }));
  const head = new THREE.Group(); head.position.y = .7; hips.add(head);
  const skull = mesh(new THREE.SphereGeometry(.1, 24, 18), skinM); skull.scale.set(.95, 1.12, 1.04); head.add(skull);
  const jaw = mesh(new THREE.SphereGeometry(.082, 18, 14), skinM, { y: -.05, z: .012 }); jaw.scale.set(.95, .82, 1); head.add(jaw);
  // face: eyes with whites, brows, a broad nose, full lips, ears
  const white = M({ color: '#f1ece4', roughness: .3 }), iris = M({ color: '#1a0f0a', roughness: .2 });
  [-1, 1].forEach((s) => {
    const e = mesh(new THREE.SphereGeometry(.016, 12, 10), white, { x: s * .035, y: .012, z: .088, cast: false }); e.scale.z = .55; head.add(e);
    head.add(mesh(new THREE.SphereGeometry(.009, 10, 8), iris, { x: s * .035, y: .012, z: .097, cast: false }));
    head.add(mesh(box(.032, .007, .008), M({ color: '#15100c' }), { x: s * .036, y: .037, z: .094, rz: s * -.12, cast: false }));
    const ear = mesh(new THREE.SphereGeometry(.024, 10, 8), skinM, { x: s * .097, y: 0 }); ear.scale.set(.45, 1, .7); head.add(ear);
  });
  const nose = mesh(new THREE.SphereGeometry(.019, 12, 10), skinM, { y: -.012, z: .101 }); nose.scale.set(1, 1.15, 1.1); head.add(nose);
  const nostrils = mesh(new THREE.SphereGeometry(.022, 12, 10), skinM, { y: -.03, z: .094 }); nostrils.scale.set(1.35, .7, .8); head.add(nostrils);
  [[-.052, .028], [-.064, .024]].forEach(([y, r], i) => { const l = mesh(new THREE.SphereGeometry(r, 12, 8), lipM, { y, z: .087 - i * .003, cast: false }); l.scale.set(1.35, .42, .62); head.add(l); });
  addHair(head, hair);
  if (earrings) [-1, 1].forEach((sx) => head.add(mesh(new THREE.TorusGeometry(.016, .003, 4, 12), M({ color: '#e6b84a', metalness: .8, roughness: .3 }), { x: sx * .1, y: -.035, ry: Math.PI / 2, cast: false })));

  // arms: short sleeves over the upper arm, bare forearms, simple hands
  const shoulderX = (chubby ? .2 : .165) + .03;
  const arms = [-1, 1].map((s) => {
    const sh = new THREE.Group(); sh.position.set(s * shoulderX, .45, 0); hips.add(sh);
    const up = limb(.29, chubby ? .055 : .044, skinM); sh.add(up);
    if (sleeves !== 'none') up.add(mesh(new THREE.CylinderGeometry(chubby ? .068 : .056, chubby ? .066 : .054, sleeves === 'long' ? .3 : .14, 12), topM, { y: sleeves === 'long' ? -.15 : -.07 }));
    const el = new THREE.Group(); el.position.y = -.29; up.add(el);
    const lo = limb(.25, .037, sleeves === 'long' ? topM : skinM); el.add(lo);
    const hand = new THREE.Group(); hand.position.y = -.26; lo.add(hand);
    hand.add(mesh(box(.06, .085, .028), skinM, { y: -.035 }));
    hand.add(mesh(new THREE.CapsuleGeometry(.011, .03, 3, 6), skinM, { x: s * -.034, y: -.03, z: .012, rz: s * .5 }));
    return { sh, up, el, lo, hand };
  });

  // legs
  const legs = [-1, 1].map((s) => {
    const hp = new THREE.Group(); hp.position.set(s * .085, 0, 0); hips.add(hp);
    const th = limb(.43, chubby ? .085 : curvy ? .076 : .068, wrapperMap || bareLegs ? skinM : botM); hp.add(th);
    const kn = new THREE.Group(); kn.position.y = -.43; th.add(kn);
    const shin = limb(.42, .05, wrapperMap || shorts || bareLegs ? skinM : botM); kn.add(shin);
    if (shorts) th.add(mesh(new THREE.CylinderGeometry(chubby ? .095 : .078, .072, .3, 12), botM, { y: -.15 }));
    shin.add(mesh(box(.095, .06, .23), M({ color: shoes, roughness: .5 }), { y: -.44, z: .05 }));
    return { hp, th, kn, shin };
  });

  g.userData = { hips, torso, head, arms, legs, h, phase: Math.random() * 6, wrapper: wr, wrapperMat: wrapperMap ? botM : null };
  return g;
}

function addHair(head, kind) {
  const dark = M({ color: '#15100d', roughness: .95 });
  const cap = (r = .106, mat = dark) => { const m = mesh(new THREE.SphereGeometry(r, 22, 12, 0, Math.PI * 2, 0, Math.PI / 2.05), mat, { y: .018, rx: -.22 }); m.scale.y = 1.08; head.add(m); return m; };
  if (kind === 'short') cap(.104);
  if (kind === 'bun') { cap(.108); head.add(mesh(new THREE.SphereGeometry(.058, 14, 12), dark, { y: .1, z: -.085 })); }
  if (kind === 'locs') {      // Racheal: medium locs down to the neck
    const locM = M({ color: '#2a1d14', roughness: .95 }); cap(.11, locM);
    for (let i = 0; i < 26; i++) {
      const a = (-155 + i * (310 / 25)) * Math.PI / 180 + Math.PI;
      head.add(mesh(new THREE.CapsuleGeometry(.016, .19, 3, 6), locM, { x: Math.sin(a) * .104, y: -.045, z: Math.cos(a) * .104 - .005, rx: Math.cos(a) * .18, rz: -Math.sin(a) * .18 }));
    }
  }
  if (kind === 'allback') {   // V: plaited all back
    cap(.107);
    const ridge = M({ color: '#2a1f1a', roughness: .8 });
    for (let i = -3; i <= 3; i++) {
      const t = new THREE.Mesh(new THREE.TorusGeometry(.108, .007, 4, 20, Math.PI * .92), ridge);
      t.rotation.set(-.15, Math.PI / 2, 0); t.position.set(i * .024, .018, -.005); t.castShadow = true; head.add(t);
    }
    head.add(mesh(new THREE.SphereGeometry(.045, 12, 10), dark, { y: -.03, z: -.11 }));
  }
  if (kind === 'braids') {    // long box braids down the back
    const bM = M({ color: '#1b1411', roughness: .9 }); cap(.109, bM);
    for (let i = 0; i < 30; i++) {
      const a = (-120 + i * (240 / 29)) * Math.PI / 180 + Math.PI;
      head.add(mesh(new THREE.CapsuleGeometry(.012, .34, 3, 5), bM, { x: Math.sin(a) * .1, y: -.13, z: Math.cos(a) * .1 - .02, rx: Math.cos(a) * .12, rz: -Math.sin(a) * .1 }));
    }
  }
  if (kind === 'longbraids') {   // Lois: long plaited braids, past the shoulders
    const bM = M({ color: '#1b1411', roughness: .9 }); cap(.109, bM);
    for (let i = 0; i < 24; i++) {
      const a = (-120 + i * (240 / 23)) * Math.PI / 180 + Math.PI;
      head.add(mesh(new THREE.CapsuleGeometry(.01, .46, 3, 5), bM, { x: Math.sin(a) * .1, y: -.21, z: Math.cos(a) * .1 - .025, rx: Math.cos(a) * .1, rz: -Math.sin(a) * .08 }));
    }
  }
  if (kind === 'weave') {     // a long weave to the shoulders
    const wM = M({ color: '#241812', roughness: .6 }); cap(.112, wM);
    const back = mesh(new THREE.CylinderGeometry(.118, .14, .26, 20, 1, true, Math.PI * .28, Math.PI * 1.44), wM, { y: -.1 });
    back.material.side = THREE.DoubleSide; head.add(back);
  }
  if (kind === 'puff') {      // afro puff
    const pM = M({ color: '#17110e', roughness: 1 }); cap(.106, pM);
    head.add(mesh(new THREE.SphereGeometry(.09, 14, 12), pM, { y: .12, z: -.05 }));
  }
  if (kind === 'headtie') {   // gele
    const tie = M({ color: '#c2362f', roughness: .7 });
    const t = mesh(new THREE.SphereGeometry(.125, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), tie, { y: .02, rx: -.15 }); t.scale.set(1, 1.45, 1.05); head.add(t);
    head.add(mesh(new THREE.TorusGeometry(.06, .025, 6, 12), tie, { y: .16, z: -.04, rx: .6 }));
  }
  if (kind === 'helmet') {
    head.add(mesh(new THREE.SphereGeometry(.125, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), M({ color: '#e0b23a', roughness: .35 }), { y: .02 }));
    head.add(mesh(box(.24, .018, .07), M({ color: '#222' }), { y: .03, z: .11 }));
  }
  if (kind === 'cap') { cap(.11, M({ color: '#2f5a3a' })); head.add(mesh(box(.13, .012, .1), M({ color: '#2f5a3a' }), { y: .05, z: .12 })); }
}

// ---- poses
export function sit(p, seatY) {
  const u = p.userData;
  p.position.y = seatY - .9 * u.h + .05;
  u.legs.forEach((l) => { l.hp.rotation.x = -Math.PI / 2; l.kn.rotation.x = Math.PI / 2; });
  if (u.wrapper) {
    // seated, the wrapper covers the lap: shorten the skirt and dress the thighs in it
    u.thighMats ??= u.legs.map((l) => l.th.children[0].material);
    u.wrapper.scale.y = .25; u.wrapper.position.y = -.06;
    u.legs.forEach((l) => l.th.children[0].material = u.wrapperMat);
  }
}
/** Back on their feet after sit(). */
export function stand(p) {
  const u = p.userData;
  p.position.y = 0;
  u.legs.forEach((l) => { l.hp.rotation.x = 0; l.kn.rotation.x = 0; });
  if (u.wrapper && u.thighMats) {
    u.wrapper.scale.y = 1; u.wrapper.position.y = -.28;
    u.legs.forEach((l, i) => l.th.children[0].material = u.thighMats[i]);
  }
}
export function lapHands(p) {
  p.userData.arms.forEach((a, i) => { a.up.rotation.x = -.35; a.el.rotation.x = -1.1; a.up.rotation.z = (i ? -1 : 1) * .12; });
}
export function faceTowards(p, x, z) {
  p.rotation.y = Math.atan2(x - p.position.x, z - p.position.z);
}

/**
 * Walks a person one frame toward `target`, legs and arms swinging.
 * Returns true once they are there, and leaves them standing.
 */
export function walkStep(p, target, dt, t, speed = .9) {
  const u = p.userData;
  const d = Math.hypot(target.x - p.position.x, target.z - p.position.z);
  if (d < .04) {
    u.legs.forEach((l) => { l.hp.rotation.x = 0; l.kn.rotation.x = 0; });
    return true;
  }
  const dx = (target.x - p.position.x) / d, dz = (target.z - p.position.z) / d, step = Math.min(d, speed * dt);
  p.position.x += dx * step; p.position.z += dz * step;
  p.rotation.y = Math.atan2(dx, dz);
  const w = Math.sin(t * (u.wrapper ? 9 : 7) + u.phase);
  // a wrapper keeps the steps short, and swings a little with them
  const stride = u.wrapper ? .16 : .45, knee = u.wrapper ? .25 : .5;
  u.legs[0].hp.rotation.x = w * stride; u.legs[1].hp.rotation.x = -w * stride;
  u.legs[0].kn.rotation.x = Math.max(0, -w) * knee; u.legs[1].kn.rotation.x = Math.max(0, w) * knee;
  if (u.wrapper) u.wrapper.rotation.z = w * .05;
  u.arms[0].up.rotation.x = -w * .35; u.arms[1].up.rotation.x = w * .35;
  return false;
}
