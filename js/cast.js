// The regulars at the stall, where they are, and how they move.
// Customers come and go; they live in customers.js.
import * as THREE from 'three';
import { M, box, mesh } from './util.js';
import { ankara } from './textures.js';
import { makeHuman, sit, stand, lapHands, faceTowards, walkStep } from './people.js';
import { SPOTS } from './world.js';

export function buildCast(scene, world) {
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
  // Lois: a fitted top and jeans, earrings, her bun. No wrapper.
  const lois = add({ skin: '#b9805a', top: '#d84a7a', bottom: '#2f4f7a', hair: 'bun', female: true, earrings: true, shoes: '#f4f2ec', h: 1.0 },
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

  // ---- the opening. They don't live at the stall: they walk up from the road
  // with loads on their heads. Lois sets her tray on the table; Racheal puts
  // her basin down, goes into the house and brings the pan out, while Lois
  // goes for water. Then Racheal sits and lights the fire.
  const metal = M({ color: '#b9bcc0', metalness: .7, roughness: .35, side: THREE.DoubleSide });
  const basin = new THREE.Group();     // Racheal's basin of batter
  basin.add(mesh(new THREE.CylinderGeometry(.3, .18, .16, 20, 1, true), metal, { y: .08 }));
  basin.add(mesh(new THREE.CircleGeometry(.29, 20), M({ color: '#e8d7a8', roughness: .8 }), { y: .13, rx: -Math.PI / 2, cast: false }));
  const tray = new THREE.Group();      // Lois's tray, covered with a cloth
  tray.add(mesh(new THREE.CylinderGeometry(.34, .3, .07, 20), M({ color: '#2f8a3a', roughness: .6 }), { y: .035 }));
  tray.add(mesh(new THREE.SphereGeometry(.3, 16, 8, 0, 6.3, 0, 1.3), M({ map: ankara('#c62f2a', '#f2b84b', '#2e5a8a'), side: THREE.DoubleSide }), { y: .02 }));
  tray.children[1].scale.y = .45;
  const bucket = new THREE.Group();    // the water Lois fetches
  bucket.add(mesh(new THREE.CylinderGeometry(.16, .12, .3, 16, 1, true), M({ color: '#3a7bd5', roughness: .5, side: THREE.DoubleSide }), { y: .15 }));
  bucket.add(mesh(new THREE.CircleGeometry(.155, 16), M({ color: '#6fa8dc', roughness: .1 }), { y: .27, rx: -Math.PI / 2, cast: false }));
  const panCarry = new THREE.Group();  // the frying pan, on its way out of the house
  panCarry.add(mesh(new THREE.LatheGeometry(world.prof, 20), M({ color: '#1c1c1c', metalness: .6, roughness: .45, side: THREE.DoubleSide })));
  const BASIN_AT = new THREE.Vector3(-1.75, 0, 1.25), BUCKET_AT = new THREE.Vector3(-1.45, 0, 2.05);
  const DOOR = new THREE.Vector3(-1.2, 0, .45);
  const tableThings = [world.tappable.basket, world.tappable.jar, world.tappable.nylon];
  const v = (x, z) => new THREE.Vector3(x, 0, z);

  function carry(p, thing, how) {
    p.userData.carry = thing ? how : null;
    if (!thing) return;
    if (how === 'head') { p.userData.head.add(thing); thing.position.set(0, .14, 0); thing.rotation.set(0, 0, 0); }
    else { p.userData.arms[1].hand.add(thing); thing.position.set(-.18, -.12, .12); thing.rotation.set(0, 0, 0); }
  }
  function putDown(p, thing, at, y = 0) {
    scene.attach(thing); thing.position.set(at.x, y, at.z); thing.rotation.set(0, 0, 0);
    p.userData.carry = null;
  }
  function carryPose(p) {
    const a = p.userData.arms;
    if (p.userData.carry === 'head') { a[1].up.rotation.set(-2.85, 0, -.2); a[1].el.rotation.x = -.45; }
    if (p.userData.carry === 'hands') a.forEach((x) => { x.up.rotation.set(-.9, 0, 0); x.el.rotation.x = -.7; });
  }

  let tracks = null, onOpened = null;
  function setOutAtHome() {
    // everyone off the stage, the stall bare and the fire out
    scene.remove(awara);
    [basin, tray, bucket, panCarry].forEach((o) => o.parent?.remove(o));
    world.pan.forEach((m) => { m.visible = false; });
    tableThings.forEach((m) => { m.visible = false; });
    world.fire.on = world.fire.target = 0;
    stand(racheal); racheal.position.set(-1.6, 0, 9.2); racheal.visible = true;
    lois.position.set(-.8, 0, 9.6); lois.visible = true;
    racheal.userData.head.rotation.set(0, 0, 0); lois.userData.head.rotation.set(0, 0, 0);
    carry(racheal, basin, 'head'); carry(lois, tray, 'head');
  }
  function settled() {
    // where the opening ends; Skip jumps straight here
    [basin, tray, bucket, panCarry].forEach((o) => o.parent?.remove(o));
    racheal.userData.carry = lois.userData.carry = null;
    scene.add(basin); basin.position.copy(BASIN_AT);
    scene.add(bucket); bucket.position.copy(BUCKET_AT);
    world.pan.forEach((m) => { m.visible = true; });
    tableThings.forEach((m) => { m.visible = true; });
    world.fire.target = 1;
    racheal.visible = lois.visible = true;
    racheal.position.set(SPOTS.stool.x, 0, SPOTS.stool.z); sit(racheal, .43); faceTowards(racheal, SPOTS.fire.x, SPOTS.fire.z);
    lois.position.set(L.x, 0, L.z); faceTowards(lois, 1.6, 7);
    lois.userData.legs.forEach((l) => { l.hp.rotation.x = 0; l.kn.rotation.x = 0; });
    tracks = null;
    const done = onOpened; onOpened = null; done?.();
  }
  function opening(done) {
    onOpened = done;
    setOutAtHome();
    tracks = [
      { p: racheal, i: 0, w: 0, steps: [
        { walk: v(-1.9, 2.5) },
        { do: () => putDown(racheal, basin, BASIN_AT) },
        { wait: .3 },
        { walk: DOOR },
        { do: () => { racheal.visible = false; } },
        { wait: 1.3 },
        { do: () => { racheal.visible = true; carry(racheal, panCarry, 'hands'); } },
        { walk: v(-2.25, 2.35) },
        { do: () => { panCarry.parent?.remove(panCarry); racheal.userData.carry = null; world.pan.forEach((m) => { m.visible = true; }); } },
        { walk: v(SPOTS.stool.x, SPOTS.stool.z + .05) },
        { do: () => { sit(racheal, .43); faceTowards(racheal, SPOTS.fire.x, SPOTS.fire.z); world.fire.target = 1; } },
      ] },
      { p: lois, i: 0, w: 0, steps: [
        { walk: v(.15, 4.1) },
        { walk: v(.7, 3.45) },
        { do: () => { tray.parent?.remove(tray); lois.userData.carry = null; tableThings.forEach((m) => { m.visible = true; }); } },
        { wait: .5 },
        { walk: v(-1.2, 4.3), speed: 1.7 },
        { walk: v(-9.8, 6.2), speed: 1.9 },
        { do: () => { lois.visible = false; } },
        { wait: 1.2 },
        { do: () => { lois.visible = true; carry(lois, bucket, 'head'); } },
        { walk: v(-1.3, 2.7), speed: 1.7 },
        { do: () => putDown(lois, bucket, BUCKET_AT) },
        { walk: v(.15, 4.1), speed: 1.5 },
        { walk: v(L.x, L.z), speed: 1.3 },
        { do: () => faceTowards(lois, 1.6, 7) },
        { wait: .6 },
      ] },
    ];
  }
  function runOpening(dt, t) {
    if (!tracks) return;
    for (const tr of tracks) {
      const s = tr.steps[tr.i];
      if (!s) continue;
      if (s.walk) { if (walkStep(tr.p, s.walk, dt, t, s.speed || 1.3)) tr.i++; }
      else if (s.wait != null) { tr.w += dt; if (tr.w >= s.wait) { tr.w = 0; tr.i++; } }
      else { s.do(); tr.i++; }
      carryPose(tr.p);
    }
    if (tracks.every((tr) => tr.i >= tr.steps.length)) settled();
  }
  const busy = (p) => tracks && tracks.some((tr) => tr.p === p && tr.i < tr.steps.length);

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
    runOpening(dt, t);
    // Racheal stirs the pan once she is on her stool
    if (!busy(racheal)) {
      const ra = racheal.userData.arms[1];
      ra.up.rotation.set(-1.15 + Math.sin(t * 3) * .12, 0, -.25 + Math.cos(t * 3) * .12);
      ra.el.rotation.x = -.5;
      racheal.userData.head.rotation.set(.25, 0, 0);
    }
    spoon.visible = !busy(racheal);
    // Lois
    const lu = lois.userData, la = lu.arms;
    const still = () => {
      lu.hips.position.y = .9; lu.hips.rotation.set(0, 0, 0);
      lu.legs.forEach((l) => { l.hp.rotation.x = 0; l.kn.rotation.x = 0; });
      la.forEach((a) => { a.up.rotation.set(0, 0, 0); a.el.rotation.x = 0; });
    };
    if (busy(lois)) { /* walking in, or off for water */ }
    else if ((still(), loisAct)) {
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
    update, events, vee, seg, lois, mama, racheal, awara, baba,
    /** The walk-in at the start of each evening; `done` runs once they're set up. */
    opening,
    skipOpening() { if (tracks) settled(); },
    get isOpening() { return !!tracks; }, get mamaHere() { return mamaStage === 'collecting'; },
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
