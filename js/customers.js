// Customers: university students who walk in from the road, crowd round
// Lois's table (no line), wait for their order, and leave.
import * as THREE from 'three';
import { M, box, mesh } from './util.js';
import { rnd } from './textures.js';
import { makeHuman, faceTowards, walkStep } from './people.js';
import { SPOTS } from './world.js';

// Places round the table, nearest first. Scattered, never a queue.
const SPOTS_AROUND = [
  [.1, 4.7], [1.1, 5.3], [2.2, 4.8], [.45, 5.75], [2.65, 5.65], [-.8, 5.35],
  [1.7, 6.15], [.95, 6.6], [-.25, 6.3], [2.2, 6.75],
].map(([x, z]) => new THREE.Vector3(x, 0, z));
const ENTRANCES = [new THREE.Vector3(-11, 0, 9.5), new THREE.Vector3(11, 0, 9.5), new THREE.Vector3(-6, 0, 12), new THREE.Vector3(6, 0, 12)];

const NAMES = {
  m: ['Chidi', 'Tunde', 'Emeka', 'Ibrahim', 'Seyi', 'Dami', 'Musa', 'Femi', 'Uche', 'Kunle', 'Yakubu', 'Dauda', 'Obinna', 'Samuel'],
  f: ['Amaka', 'Halima', 'Zainab', 'Blessing', 'Ngozi', 'Joy', 'Fatima', 'Tolu', 'Ada', 'Precious', 'Rukky', 'Esther', 'Hauwa', 'Kemi'],
};
const SKINS = ['#5b3a28', '#6a4330', '#7b4d31', '#5d3a26', '#6b4429', '#8a5636', '#9a6440', '#704a33', '#a06a46', '#6f4630'];
const TOPS = ['#2f7d4f', '#f0ece2', '#c2362f', '#1d1d1f', '#3f7fbf', '#f2b84b', '#e94e8a', '#ffffff', '#2f9a6a', '#8e5bb5', '#d9c38a'];
const BOTTOMS = ['#2f4f7a', '#22252b', '#8a7a5a', '#4b5a3a', '#4a6fa5', '#6d3b5a'];
const pick = (a) => a[Math.floor(Math.random() * a.length)];

function look(female) {
  const o = { skin: pick(SKINS), top: pick(TOPS), bottom: pick(BOTTOMS), female, h: rnd(.93, 1.02) };
  if (female) {
    o.hair = pick(['braids', 'weave', 'puff', 'braids', 'bun']);
    o.earrings = Math.random() < .7;
    const fit = Math.random();
    if (fit < .25) o.dress = pick(['#1d1a1f', '#b23b5a', '#2f5a8a', '#e6b02e']);
    else if (fit < .45) o.skirt = pick(['#b23b5a', '#1d1a1f', '#4a6fa5']);
    else if (fit < .6) o.shorts = true;
    if (Math.random() < .35) o.handbag = pick(['#c9862e', '#1d1a17', '#7a2a4a']);
  } else {
    o.hair = 'short';
    if (Math.random() < .3) o.shorts = true;
    if (Math.random() < .3) o.sleeves = 'long';
  }
  return o;
}

export function createCustomers(scene) {
  const list = [];
  let nextId = 1;
  const freeSpot = () => SPOTS_AROUND.find((s) => !list.some((c) => c.spot === s && c.state !== 'gone'));

  /** Someone new walks in, if there is room round the table. Returns them, or null. */
  function arrive(order, now) {
    const spot = freeSpot();
    if (!spot) return null;
    const female = Math.random() < .5;
    // a name nobody at the table already has
    const taken = new Set(list.filter((c) => c.state !== 'gone').map((c) => c.name));
    const names = NAMES[female ? 'f' : 'm'].filter((n) => !taken.has(n));
    const person = makeHuman(look(female));
    const from = pick(ENTRANCES);
    person.position.copy(from);
    scene.add(person);
    if (Math.random() < .35) {
      person.userData.arms[1].hand.add(mesh(box(.07, .13, .012), M({ color: '#111', roughness: .3 }), { y: -.06 }));
      person.userData.scrolls = true;
    }
    const c = {
      id: nextId++, name: pick(names.length ? names : NAMES[female ? 'f' : 'm']), female, person, spot, order, state: 'coming',
      arrivedAt: null, patience: 1, waitSeconds: rnd(50, 75), mood: 'ok',
    };
    list.push(c);
    return c;
  }

  /** Off they go: back to the road and out of the picture. */
  function leave(c, mood = 'ok') {
    c.state = 'leaving'; c.mood = mood;
    c.exit = pick(ENTRANCES);
  }

  function update(dt, t, now) {
    for (let i = list.length - 1; i >= 0; i--) {
      const c = list[i], p = c.person, u = p.userData;
      if (c.state === 'coming') {
        if (walkStep(p, c.spot, dt, t, 1.1)) { c.state = 'waiting'; c.arrivedAt = now; faceTowards(p, SPOTS.lois.x + rnd(-.2, .2), SPOTS.lois.z); }
      } else if (c.state === 'waiting') {
        c.patience = Math.max(0, c.patience - dt / c.waitSeconds);
        u.hips.position.y = .9 + Math.sin(t * 2 + u.phase) * .006;
        if (u.scrolls) { u.arms[1].up.rotation.x = -.5; u.arms[1].el.rotation.x = -1.4; u.head.rotation.x = .35; }
        else { u.head.rotation.y = Math.sin(t * .6 + u.phase) * .2; }
        // fed up: shifting, arms folded, then gone
        if (c.patience < .3) { u.torso.rotation.z = Math.sin(t * 6 + u.phase) * .05; u.arms[0].up.rotation.x = -.6; u.arms[0].el.rotation.x = -1.6; }
      } else if (c.state === 'leaving') {
        u.head.rotation.x = 0;
        if (walkStep(p, c.exit, dt, t, c.mood === 'angry' ? 1.5 : 1.0)) { scene.remove(p); c.state = 'gone'; list.splice(i, 1); }
      }
    }
  }

  return {
    list, arrive, leave, update,
    get waiting() { return list.filter((c) => c.state === 'waiting'); },
    clear() { list.forEach((c) => scene.remove(c.person)); list.length = 0; },
  };
}
