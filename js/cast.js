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
  let loisHand = 0;         // > 0 while Lois is handing an order over

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
    // Lois packs, and reaches out when she hands an order over
    const la = lois.userData.arms, s = Math.sin(t * 1.6);
    loisHand = Math.max(0, loisHand - dt);
    if (loisHand > 0) { la[1].up.rotation.x = -1.5; la[1].el.rotation.x = -.2; }
    else { la[1].up.rotation.x = -.7 - s * .3; la[1].el.rotation.x = -.8; }
    la[0].up.rotation.x = -.9 + s * .25; la[0].el.rotation.x = -.6;
    lois.userData.head.rotation.y = Math.sin(t * .8) * .35;
    // Oluwasegun's flash for the WhatsApp group
    flash.intensity = (t % flashEvery) < .12 ? 6 : 0;
    // V chatting with Lois
    vee.userData.head.rotation.y = Math.sin(t * .9) * .25;
    vee.userData.arms[0].up.rotation.x = -.4 + Math.sin(t * 2.2) * .15;
    baba.userData.head.rotation.y = Math.sin(t * .4) * .3;

    // Mama Yan Bui: walks in, puts the awara down, talks, goes home
    const mu = mama.userData;
    if (mamaStage === 'walking') {
      if (walkStep(mama, MAMA_STOP, dt, t, .95)) { mamaStage = 'placing'; mamaWait = 0; faceTowards(mama, L.x, L.z); }
    } else if (mamaStage === 'placing') {
      mamaWait += dt;
      mu.arms[1].up.rotation.x = -.5 - Math.min(1, mamaWait) * .6;
      if (mamaWait > 1) {
        scene.attach(awara); awara.position.copy(AWARA_ON_TABLE); awara.rotation.set(0, .3, 0);
        mamaStage = 'talking'; mamaWait = 0;
        events.onMamaArrives?.(mama);
      }
    } else if (mamaStage === 'talking') {
      mu.arms[1].up.rotation.x = -.2 + Math.sin(t * 3) * .1;
    } else if (mamaStage === 'leaving') {
      if (walkStep(mama, MAMA_HOME, dt, t, 1.0)) { mamaStage = 'away'; mama.visible = false; }
    }
  }

  return {
    update, events, vee, seg, lois, mama, racheal,
    /** Mama Yan Bui comes with the awara. */
    mamaComes() {
      mama.visible = true; mama.position.copy(MAMA_FROM); mamaStage = 'walking';
      mama.userData.arms[1].hand.attach(awara); awara.position.set(0, -.08, 0); awara.rotation.set(0, 0, 0);
    },
    mamaLeaves() { mamaStage = 'leaving'; },
    handOver() { loisHand = .8; },
    setRush(on) { flashEvery = on ? 1.2 : 4.5; },
  };
}
