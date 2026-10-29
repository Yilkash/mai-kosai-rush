// Who is at the stall, where they are, and how they move.
import * as THREE from 'three';
import { M, box, mesh } from './util.js';
import { ankara, rnd } from './textures.js';
import { makeHuman, sit, lapHands, faceTowards } from './people.js';
import { SPOTS } from './world.js';

export function buildCast(scene) {
  const people = [];
  function add(opts, { x, z, seat = null, face = null, role = 'idle' }) {
    const p = makeHuman(opts);
    p.position.set(x, 0, z);
    scene.add(p);
    if (seat !== null) { sit(p, seat); lapHands(p); }
    if (face) faceTowards(p, face[0], face[1]);
    p.userData.role = role;
    people.push(p);
    return p;
  }
  const L = SPOTS.lois, B = SPOTS.bench;

  // Racheal on her stool in the zinc house, frying
  const racheal = add({ skin: '#7a4a2e', top: '#6a4c9c', wrapperMap: ankara('#2e5a8a', '#f2b84b', '#c62f2a'), hair: 'locs', female: true, h: .98 },
    { x: SPOTS.stool.x, z: SPOTS.stool.z, seat: .43, face: [SPOTS.fire.x, SPOTS.fire.z], role: 'fry' });
  const spoon = new THREE.Group();
  spoon.add(mesh(new THREE.CylinderGeometry(.008, .008, .5, 6), M({ color: '#aaa', metalness: .7 }), { y: -.25 }));
  spoon.add(mesh(new THREE.SphereGeometry(.05, 10, 6, 0, 6.3, 0, 1.2), M({ color: '#aaa', metalness: .7, side: THREE.DoubleSide }), { y: -.5, rx: Math.PI }));
  racheal.userData.arms[1].hand.add(spoon);

  // Lois beside the end post, behind her table
  const lois = add({ skin: '#b9805a', top: '#d84a7a', wrapperMap: ankara('#f2b84b', '#2f7d4f', '#7a2a4a'), hair: 'bun', female: true, h: 1.0 },
    { x: L.x, z: L.z, face: [1.6, 7], role: 'serve' });

  // the bench: Oluwasegun, V and Baba Malam, facing Lois
  const seg = add({ skin: '#6d4129', top: '#3f7fbf', bottom: '#2b3340', hair: 'short', chubby: true, h: 1.02 },
    { x: B.x, z: 1.0, seat: .49, face: [L.x, L.z + .4], role: 'snap' });
  const phone = mesh(box(.07, .13, .012), M({ color: '#111', roughness: .3 }), { y: -.06 });
  seg.userData.arms[1].hand.add(phone);
  const flash = new THREE.PointLight('#fff6d0', 0, 3, 2); phone.add(flash);
  seg.userData.arms[1].up.rotation.set(-2.3, 0, -.2); seg.userData.arms[1].el.rotation.x = -.6;
  const vee = add({ skin: '#8a5636', top: '#e6b02e', wrapperMap: ankara('#4b2f5a', '#e6b02e', '#ffffff'), hair: 'allback', female: true, h: .97 },
    { x: B.x, z: 2.0, seat: .49, face: [L.x, L.z], role: 'chat' });
  add({ skin: '#5a3a26', top: '#e9e1d2', bottom: '#5d4a37', hair: 'cap', sleeves: 'long', h: 1.0 },
    { x: B.x, z: 3.0, seat: .49, face: [L.x, L.z + .6], role: 'idle' });

  // the crowd around Lois's table: university students in everyday clothes,
  // no line, all facing her
  const JEANS = '#2f4f7a', BLACK = '#22252b', KHAKI = '#8a7a5a';
  const crowd = [
    [{ skin: '#6a4330', top: '#2f7d4f', bottom: JEANS, hair: 'short' }, .1, 4.7, 'phone'],
    [{ skin: '#5b3a28', top: '#f0ece2', bottom: BLACK, hair: 'short', sleeves: 'long' }, 1.1, 5.25],
    [{ skin: '#7b4d31', top: '#c2362f', bottom: KHAKI, hair: 'short', shorts: true, shoes: '#2b2b2b' }, 2.15, 4.75],
    [{ skin: '#8a5636', top: '#f2b84b', bottom: JEANS, hair: 'bun', female: true }, .3, 5.75, 'phone'],
    [{ skin: '#6b4429', top: '#1d1d1f', bottom: '#4b5a3a', hair: 'short', shorts: true }, 1.75, 6.05],
    [{ skin: '#9a6440', top: '#e9a6c2', bottom: BLACK, hair: 'allback', female: true, h: .95 }, 2.6, 5.7],
    [{ skin: '#5d3a26', top: '#3f7fbf', bottom: JEANS, hair: 'short', h: .98 }, -.75, 5.3],
    [{ skin: '#704a33', top: '#ffffff', bottom: '#6d3b5a', hair: 'bun', female: true, shorts: true, h: .95 }, .95, 6.55, 'phone'],
  ];
  crowd.forEach(([o, x, z, extra]) => {
    const p = add(o, { x, z, face: [L.x + rnd(-.2, .2), L.z], role: 'wait' });
    if (extra === 'phone') {
      // scrolling while they wait
      p.userData.arms[1].hand.add(mesh(box(.07, .13, .012), M({ color: '#111', roughness: .3 }), { y: -.06 }));
      p.userData.arms[1].up.rotation.x = -.5; p.userData.arms[1].el.rotation.x = -1.4;
      p.userData.role = 'phone';
    }
  });

  // Mama Yan Bui brings the awara: she walks in from the road, puts it on
  // Lois's table and tells her the total
  const mama = add({ skin: '#5e3a24', top: '#3d6b8c', wrapperMap: ankara('#7c3a5a', '#f2b84b', '#3d6b8c'), hair: 'headtie', female: true, h: .97 },
    { x: -4.5, z: 7, face: [L.x, L.z], role: 'walk' });
  const awara = new THREE.Group();
  awara.add(mesh(box(.16, .1, .12), new THREE.MeshPhysicalMaterial({ color: '#fbf6e6', transparent: true, opacity: .85, roughness: .4 })));
  for (let i = 0; i < 6; i++) awara.add(mesh(box(.045, .04, .045), M({ color: '#f4ecd2' }), { x: -.05 + (i % 3) * .05, y: -.02, z: i < 3 ? -.025 : .025 }));
  awara.position.y = -.08; mama.userData.arms[1].hand.add(awara);
  const mamaStop = new THREE.Vector3(.55, 0, 4.55);            // the left end of Lois's table
  const awaraOnTable = new THREE.Vector3(.95, .89, 3.95);
  let mamaStage = 'walking', mamaWait = 0;

  /** Moves everyone a little each frame. */
  function update(t, dt) {
    for (const p of people) {
      const u = p.userData, ph = u.phase;
      u.torso.rotation.z = Math.sin(t * 1.3 + ph) * .02;
      u.head.rotation.y = Math.sin(t * .5 + ph) * .18;
      if (u.role === 'phone') { u.head.rotation.x = .35; continue; }   // eyes on their phone
      if (u.role === 'wait') {
        u.hips.position.y = .9 + Math.sin(t * 2 + ph) * .006;
        u.arms[0].up.rotation.x = Math.sin(t * .7 + ph) * .08;
        u.arms[1].up.rotation.x = -Math.sin(t * .7 + ph) * .08;
      }
    }
    // Racheal stirs the pan
    const ra = racheal.userData.arms[1];
    ra.up.rotation.set(-1.15 + Math.sin(t * 3) * .12, 0, -.25 + Math.cos(t * 3) * .12);
    ra.el.rotation.x = -.5;
    racheal.userData.head.rotation.set(.25, 0, 0);
    // Lois packs and hands over
    const la = lois.userData.arms, s = Math.sin(t * 1.6);
    la[0].up.rotation.x = -.9 + s * .25; la[0].el.rotation.x = -.6;
    la[1].up.rotation.x = -.7 - s * .3; la[1].el.rotation.x = -.8;
    lois.userData.head.rotation.y = Math.sin(t * .8) * .35;
    // Oluwasegun's flash for the WhatsApp group
    flash.intensity = (t % 4.5) < .12 ? 6 : 0;
    // V chatting with Lois
    vee.userData.head.rotation.y = Math.sin(t * .9) * .25;
    vee.userData.arms[0].up.rotation.x = -.4 + Math.sin(t * 2.2) * .15;
    // Mama Yan Bui walks in, puts the awara on the table, tells Lois the total
    const mu = mama.userData;
    if (mamaStage === 'walking') {
      const d = mama.position.distanceTo(mamaStop);
      const dir = mamaStop.clone().sub(mama.position).normalize();
      mama.position.addScaledVector(dir, Math.min(d, .85 * dt));
      faceTowards(mama, mama.position.x + dir.x, mama.position.z + dir.z);
      const w = Math.sin(t * 7);
      mu.legs[0].hp.rotation.x = w * .45; mu.legs[1].hp.rotation.x = -w * .45;
      mu.legs[0].kn.rotation.x = Math.max(0, -w) * .5; mu.legs[1].kn.rotation.x = Math.max(0, w) * .5;
      mu.arms[0].up.rotation.x = -w * .35; mu.arms[1].up.rotation.x = -.3;
      if (d < .05) { mamaStage = 'placing'; mamaWait = 0; }
    } else {
      mu.legs.forEach((l) => { l.hp.rotation.x = 0; l.kn.rotation.x = 0; });
      faceTowards(mama, L.x, L.z);
      if (mamaStage === 'placing') {
        mamaWait += dt;
        mu.arms[1].up.rotation.x = -.5 - Math.min(1, mamaWait) * .6;        // reaching out to the table
        if (mamaWait > 1) {
          scene.attach(awara); awara.position.copy(awaraOnTable); awara.rotation.set(0, .3, 0);
          mamaStage = 'talking'; mamaWait = 0;
          events.onMamaArrives?.(mama);
        }
      } else {
        mu.arms[1].up.rotation.x = -.2 + Math.sin(t * 3) * .1;              // talking with her hands
        mu.head.rotation.y = 0;
      }
    }
  }

  function restartWalk() {
    mama.position.set(-4.5, 0, 7); mamaStage = 'walking';
    mama.userData.arms[1].hand.attach(awara); awara.position.set(0, -.08, 0); awara.rotation.set(0, 0, 0);
  }
  const events = {};
  return { update, restartWalk, events };
}
