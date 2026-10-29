// The regulars at the stall, where they are, and how they move.
// Customers come and go; they live in customers.js.
import * as THREE from 'three';
import { M, box, mesh } from './util.js';
import { ankara } from './textures.js';
import { makeHuman, sit, lapHands, faceTowards, walkStep } from './people.js';
import { SPOTS } from './world.js';

export function buildCast(scene) {
  function add(opts, { x, z, seat = null, face = null }) {
    const p = makeHuman(opts);
    p.position.set(x, 0, z);
    scene.add(p);
    if (seat !== null) { sit(p, seat); lapHands(p); }
    if (face) faceTowards(p, face[0], face[1]);
    return p;
  }
  const L = SPOTS.lois, B = SPOTS.bench;

  // Racheal on her stool in the zinc house, frying
  const racheal = add({ skin: '#7a4a2e', top: '#6a4c9c', wrapperMap: ankara('#2e5a8a', '#f2b84b', '#c62f2a'), hair: 'locs', female: true, h: .98 },
    { x: SPOTS.stool.x, z: SPOTS.stool.z, seat: .43, face: [SPOTS.fire.x, SPOTS.fire.z] });
  const spoon = new THREE.Group();
  spoon.add(mesh(new THREE.CylinderGeometry(.008, .008, .5, 6), M({ color: '#aaa', metalness: .7 }), { y: -.25 }));
  spoon.add(mesh(new THREE.SphereGeometry(.05, 10, 6, 0, 6.3, 0, 1.2), M({ color: '#aaa', metalness: .7, side: THREE.DoubleSide }), { y: -.5, rx: Math.PI }));
  racheal.userData.arms[1].hand.add(spoon);

  // Lois beside the end post, behind her table
  const lois = add({ skin: '#b9805a', top: '#d84a7a', wrapperMap: ankara('#f2b84b', '#2f7d4f', '#7a2a4a'), hair: 'bun', female: true, h: 1.0 },
    { x: L.x, z: L.z, face: [1.6, 7] });

  // the bench: Oluwasegun, V and Baba Malam, facing Lois
  const seg = add({ skin: '#6d4129', top: '#3f7fbf', bottom: '#2b3340', hair: 'short', chubby: true, h: 1.02 },
    { x: B.x, z: 1.0, seat: .49, face: [L.x, L.z + .4] });
  const phone = mesh(box(.07, .13, .012), M({ color: '#111', roughness: .3 }), { y: -.06 });
  seg.userData.arms[1].hand.add(phone);
  const flash = new THREE.PointLight('#fff6d0', 0, 3, 2); phone.add(flash);
  seg.userData.arms[1].up.rotation.set(-2.3, 0, -.2); seg.userData.arms[1].el.rotation.x = -.6;
  const vee = add({ skin: '#8a5636', top: '#e6b02e', wrapperMap: ankara('#4b2f5a', '#e6b02e', '#ffffff'), hair: 'allback', female: true, earrings: true, h: .97 },
    { x: B.x, z: 2.0, seat: .49, face: [L.x, L.z] });
  const baba = add({ skin: '#5a3a26', top: '#e9e1d2', bottom: '#5d4a37', hair: 'cap', sleeves: 'long', h: 1.0 },
    { x: B.x, z: 3.0, seat: .49, face: [L.x, L.z + .6] });

  // Mama Yan Bui brings the awara at the start of the evening
  const MAMA_FROM = new THREE.Vector3(-4.5, 0, 7), MAMA_STOP = new THREE.Vector3(.55, 0, 4.55), MAMA_HOME = new THREE.Vector3(-12, 0, 9);
  const mama = add({ skin: '#5e3a24', top: '#3d6b8c', wrapperMap: ankara('#7c3a5a', '#f2b84b', '#3d6b8c'), hair: 'headtie', female: true, h: .97 },
    { x: MAMA_FROM.x, z: MAMA_FROM.z, face: [L.x, L.z] });
  const awara = new THREE.Group();
  awara.add(mesh(box(.16, .1, .12), new THREE.MeshPhysicalMaterial({ color: '#fbf6e6', transparent: true, opacity: .85, roughness: .4 })));
  for (let i = 0; i < 6; i++) awara.add(mesh(box(.045, .04, .045), M({ color: '#f4ecd2' }), { x: -.05 + (i % 3) * .05, y: -.02, z: i < 3 ? -.025 : .025 }));
  const AWARA_ON_TABLE = new THREE.Vector3(.95, .89, 3.95);
  let mamaStage = 'away', mamaWait = 0;
  mama.visible = false;

  const events = {};
  let flashEvery = 4.5;     // seconds between Oluwasegun's photos; shorter during a WhatsApp rush
  // What Lois is doing: bending to the kunu flask under the table, reaching
  // into the basket, handing over, or resting with a hand on her hip.
  let loisAct = null, loisActT = 0, loisIdle = 0;
  const LOIS_ACTS = { kunu: 1.3, kosai: .45, awara: .5, hand: .8 };
  let mamaMode = 'deliver';

  function update(t, dt) {
    for (const p of [racheal, lois, seg, vee, baba, mama]) {
      const u = p.userData;
      u.torso.rotation.z = Math.sin(t * 1.3 + u.phase) * .02;
    }
    // Racheal stirs the pan
    const ra = racheal.userData.arms[1];
    ra.up.rotation.set(-1.15 + Math.sin(t * 3) * .12, 0, -.25 + Math.cos(t * 3) * .12);
    ra.el.rotation.x = -.5;
    racheal.userData.head.rotation.set(.25, 0, 0);
    // Lois
    const lu = lois.userData, la = lu.arms;
    const still = () => {
      lu.hips.position.y = .9; lu.hips.rotation.set(0, 0, 0);
      lu.legs.forEach((l) => { l.hp.rotation.x = 0; l.kn.rotation.x = 0; });
      la.forEach((a) => { a.up.rotation.set(0, 0, 0); a.el.rotation.x = 0; });
    };
    still();
    if (loisAct) {
      loisActT += dt; loisIdle = 0;
      const d = LOIS_ACTS[loisAct], k = Math.sin(Math.min(1, loisActT / d) * Math.PI);   // 0 → 1 → 0
      if (loisAct === 'kunu') {
        // bend down to the red flask under the table, then straighten up
        lu.hips.rotation.x = .85 * k; lu.hips.position.y = .9 - .22 * k;
        lu.legs.forEach((l) => { l.hp.rotation.x = -.85 * k - .5 * k; l.kn.rotation.x = 1.0 * k; });
        la.forEach((a) => { a.up.rotation.x = -.5 * k; a.el.rotation.x = -.3 * k; });
        lu.head.rotation.x = .2 * k;
      } else if (loisAct === 'hand') {
        la[1].up.rotation.x = -1.5 * k; la[1].el.rotation.x = -.2;
      } else {
        // a quick reach into the basket (kosai) or the awara on her right
        lu.hips.rotation.y = (loisAct === 'awara' ? -.35 : .25) * k;
        la[loisAct === 'awara' ? 0 : 1].up.rotation.x = -1.1 * k; la[loisAct === 'awara' ? 0 : 1].el.rotation.x = -.5 * k;
        lu.hips.rotation.x = .2 * k;
      }
      if (loisActT >= d) loisAct = null;
    } else {
      loisIdle += dt;
      if (loisIdle > 3) {
        // resting: weight on one leg, hand on her hip
        const r = Math.min(1, (loisIdle - 3) / .6);
        lu.hips.rotation.z = .05 * r;
        la[0].up.rotation.set(-.15 * r, 0, .75 * r); la[0].el.rotation.x = -1.7 * r;
        lu.head.rotation.y = Math.sin(t * .5) * .3;
      } else {
        const s = Math.sin(t * 1.6);
        la[0].up.rotation.x = -.6 + s * .15; la[0].el.rotation.x = -.8;
        la[1].up.rotation.x = -.5 - s * .15; la[1].el.rotation.x = -.8;
        lu.head.rotation.y = Math.sin(t * .8) * .35;
      }
    }
    // Oluwasegun's flash for the WhatsApp group
    flash.intensity = (t % flashEvery) < .12 ? 6 : 0;
    // V chatting with Lois
    vee.userData.head.rotation.y = Math.sin(t * .9) * .25;
    vee.userData.arms[0].up.rotation.x = -.4 + Math.sin(t * 2.2) * .15;
    baba.userData.head.rotation.y = Math.sin(t * .4) * .3;

    // Mama Yan Bui: at opening she puts the awara down and goes; at closing she comes back for her money
    const mu = mama.userData;
    if (mamaStage === 'walking') {
      if (walkStep(mama, MAMA_STOP, dt, t, .95)) { mamaStage = mamaMode === 'deliver' ? 'placing' : 'collecting'; mamaWait = 0; faceTowards(mama, L.x, L.z); if (mamaMode === 'collect') events.onMamaCollects?.(mama); }
    } else if (mamaStage === 'placing') {
      mamaWait += dt;
      mu.arms[1].up.rotation.x = -.5 - Math.min(1, mamaWait) * .6;
      if (mamaWait > 1) {
        scene.attach(awara); awara.position.copy(AWARA_ON_TABLE); awara.rotation.set(0, .3, 0);
        mamaStage = 'leaving';
        events.onMamaDelivers?.(mama);
      }
    } else if (mamaStage === 'collecting') {
      mu.arms[1].up.rotation.x = -1.1; mu.arms[1].el.rotation.x = -.3;          // hand out for the money
    } else if (mamaStage === 'leaving') {
      if (walkStep(mama, MAMA_HOME, dt, t, 1.0)) { mamaStage = 'away'; mama.visible = false; }
    }
  }

  return {
    update, events, vee, seg, lois, mama, racheal, get mamaHere() { return mamaStage === 'collecting'; },
    /** Mama Yan Bui comes: 'deliver' at opening, 'collect' at closing. */
    mamaComes(mode = 'deliver') {
      mamaMode = mode; mama.visible = true; mama.position.copy(MAMA_FROM); mamaStage = 'walking';
      if (mode === 'deliver') { mama.userData.arms[1].hand.attach(awara); awara.position.set(0, -.08, 0); awara.rotation.set(0, 0, 0); }
    },
    mamaLeaves() { mamaStage = 'leaving'; },
    /** Lois does something: 'kunu', 'kosai', 'awara' or 'hand'. */
    loisDoes(kind) { loisAct = kind; loisActT = 0; },
    handOver() { loisAct = 'hand'; loisActT = 0; },
    setRush(on) { flashEvery = on ? 1.2 : 4.5; },
  };
}
