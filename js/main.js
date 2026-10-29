// Mai Kosai Rush: the stall, the camera, and the game loop.
import * as THREE from 'three';
import { makeTextures } from './textures.js';
import { buildSky, clockText } from './sky.js';
import { buildWorld } from './world.js';
import { buildCast } from './cast.js';
import { createCustomers } from './customers.js';
import { createGame } from './game.js';
import { createSound } from './audio.js';

// Saved under this game's own name: yilkash.github.io is shared with Abide and
// the Mai Kosai order app, so nothing here may touch their keys.
const KEY = 'maiKosaiRush.';
const store = {
  get(k) { try { return localStorage.getItem(KEY + k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(KEY + k, v); } catch { /* private window: forget it */ } },
};

const app = document.getElementById('app');
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;
app.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const T = makeTextures();
const sky = buildSky(scene);
const world = buildWorld(scene, T);
const cast = buildCast(scene, world);
const customers = createCustomers(scene);
const clock = new THREE.Clock();

// ---- two cameras: the table (over Lois's shoulder) and the whole stall
// "Stall view" shows the place, the bench and the crowd; the game also cuts to
// it by itself for a few seconds when something happens there.
const camera = new THREE.PerspectiveCamera(50, 2, .05, 400);
const VIEWS = {
  stall: {
    wide: { pos: new THREE.Vector3(0.2, 5.6, 12.2), look: new THREE.Vector3(-0.4, .9, 3.0), halfWidth: 7.6 },
    tall: { pos: new THREE.Vector3(-0.2, 6.2, 14.6), look: new THREE.Vector3(-0.25, .8, 2.4), halfWidth: 4.0 },
  },
  table: {
    wide: { pos: new THREE.Vector3(2.25, 2.3, 2.45), look: new THREE.Vector3(1.0, .75, 5.3), fov: 48 },
    tall: { pos: new THREE.Vector3(1.95, 3.0, 1.9), look: new THREE.Vector3(1.0, .7, 5.6), fov: 64 },
  },
};
let chosen = 'table';               // what the player picked with the button
let focusView = null, focusUntil = 0;   // a short cut the game asked for
const START = new THREE.Vector3(-14, 8, 26);
const camPos = new THREE.Vector3().copy(START), camLook = new THREE.Vector3(-0.4, .9, 3.0);
let camFov = 50;
let tall = false;
const viewName = () => (focusView && clock.elapsedTime < focusUntil ? focusView : chosen);
function target() {
  const v = VIEWS[viewName()][tall ? 'tall' : 'wide'];
  if (v.fov) return { ...v, fovNow: v.fov };
  const dist = v.pos.distanceTo(v.look);
  return { ...v, fovNow: THREE.MathUtils.clamp(2 * Math.atan(v.halfWidth / dist / camera.aspect) * 180 / Math.PI, 28, 72) };
}
function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  tall = camera.aspect < 1;
  document.body.classList.toggle('tall', tall);
}
window.addEventListener('resize', resize);
resize();

const viewBtn = document.getElementById('viewBtn');
function showViewBtn() { viewBtn.textContent = chosen === 'table' ? 'Stall view' : 'Table view'; }
viewBtn.addEventListener('click', () => { chosen = chosen === 'table' ? 'stall' : 'table'; focusView = null; showViewBtn(); });
showViewBtn();
function focus(name, seconds) {
  if (name === chosen) return;
  focusView = name; focusUntil = clock.elapsedTime + seconds;
}

// ---- the evening's light, driven by the game clock
const clockEl = document.getElementById('clock');
function setTime(min, nepa = false) {
  const dark = sky.setTime(min);
  const flicker = nepa ? .7 + Math.random() * .3 : 1;   // the lantern flickers when NEPA takes light
  const lantern = Math.max(dark, nepa ? 1 : 0);
  world.lanternLight.intensity = lantern * 10 * flicker;
  world.lanternGlass.material.emissiveIntensity = lantern * 2.2;
  const lightsOn = nepa ? 0 : THREE.MathUtils.smoothstep(min, 420, 470);
  world.windowMat.emissiveIntensity = lightsOn * 1.2;
  world.lit.forEach((m, i) => { m.emissiveIntensity = nepa ? 0 : THREE.MathUtils.smoothstep(min, 425 + i * 6, 470 + i * 6) * 1.1; });
  clockEl.textContent = clockText(min);
}
setTime(330);

// ---- speech bubbles that follow a person on screen
const bubbles = document.getElementById('bubbles');
const talking = [];
const above = new THREE.Vector3();
function say(person, text, seconds = 2.5, kind = '') {
  // one bubble per person, and at most two talking at once: the oldest makes way
  for (let i = talking.length - 1; i >= 0; i--) if (talking[i].person === person && talking[i].kind === kind) { talking[i].el.remove(); talking.splice(i, 1); }
  if (!kind) {
    const lines = talking.filter((b) => !b.kind);
    if (lines.length >= 2) { const old = lines[0]; old.el.remove(); talking.splice(talking.indexOf(old), 1); }
  }
  const el = document.createElement('div');
  el.className = kind ? `say ${kind}` : 'say';
  if (!kind) el.setAttribute('role', 'status');
  el.textContent = text;
  bubbles.appendChild(el);
  talking.push({ person, el, kind, born: clock.elapsedTime, until: clock.elapsedTime + seconds });
}
function placeBubbles() {
  for (let i = talking.length - 1; i >= 0; i--) {
    const b = talking[i];
    if (clock.elapsedTime > b.until || !b.person.parent) { b.el.remove(); talking.splice(i, 1); continue; }
    b.person.getWorldPosition(above); above.y += 1.95 * (b.person.userData.h || 1) + (b.kind === 'coin' ? (clock.elapsedTime - b.born) * .5 : 0);
    above.project(camera);
    b.el.style.left = `${Math.min(innerWidth - 90, Math.max(90, (above.x * .5 + .5) * innerWidth))}px`;
    // above the order bubble, when the person has one
    b.el.style.top = `${Math.max(60, (-above.y * .5 + .5) * innerHeight - (orderEls.has(b.person) && b.kind !== 'coin' ? 30 : 0))}px`;
  }
}


// ---- order bubbles: what each waiting customer wants, in words; tap one to serve them
const labels = document.getElementById('labels');
const orderEls = new Map();
const head = new THREE.Vector3();
function placeOrders() {
  const seen = new Set();
  const list = game.phase === 'open' ? game.bubbles() : [];
  for (const b of list) {
    seen.add(b.person);
    let el = orderEls.get(b.person);
    if (!el) {
      el = document.createElement('button'); el.type = 'button'; el.className = 'order';
      el.addEventListener('click', () => game.select(el.customer));
      labels.appendChild(el); orderEls.set(b.person, el);
    }
    el.customer = b.customer;
    const html = `<span class="nm">${b.name}</span>${b.text}` +
      `<span class="pat"><i style="width:${Math.max(0, b.patience) * 100}%;background:${b.patience > .5 ? 'var(--green)' : b.patience > .25 ? 'var(--warn)' : 'var(--bad)'}"></i></span>`;
    if (el.dataset.html !== html) { el.innerHTML = html; el.dataset.html = html; }
    el.classList.toggle('sel', b.selected);
    el.classList.toggle('pulse', b.guide);
    b.person.getWorldPosition(head); head.y += 2.0 * (b.person.userData.h || 1);
    head.project(camera);
    el.style.display = head.z > 1 ? 'none' : '';
    el.style.left = `${Math.min(innerWidth - 70, Math.max(70, (head.x * .5 + .5) * innerWidth))}px`;
    el.style.top = `${Math.max(tall ? 150 : 100, (-head.y * .5 + .5) * innerHeight)}px`;
  }
  for (const [p, el] of orderEls) if (!seen.has(p)) { el.remove(); orderEls.delete(p); }
}

// name tags over the regulars, in Stall view, so people know who is who
const REGULARS = [[cast.lois, 'Lois'], [cast.racheal, 'Racheal'], [cast.seg, 'Oluwasegun'], [cast.vee, 'V'], [cast.tricia, 'Tricia'], [cast.mama, 'Mama Yan Bui'], [cast.naomi, 'Mama Naomi'], [cast.dany, 'Baban Dany']];
const nameEls = REGULARS.map(([, text]) => { const el = document.createElement('div'); el.className = 'tag'; el.textContent = text; labels.appendChild(el); return el; });
const tagPos = new THREE.Vector3();
function placeNames(show) {
  REGULARS.forEach(([p], i) => {
    const el = nameEls[i];
    if (!show || !p.visible || orderEls.has(p) || talking.some((b) => b.person === p && !b.kind)) { el.style.display = 'none'; return; }
    p.getWorldPosition(tagPos); tagPos.y += 1.85 * (p.userData.h || 1) + (p.userData.carry === 'head' ? .25 : 0);
    tagPos.project(camera);
    el.style.display = '';
    el.style.left = `${(tagPos.x * .5 + .5) * innerWidth}px`;
    el.style.top = `${(-tagPos.y * .5 + .5) * innerHeight - 14}px`;
  });
}

cast.events.say = say;   // the cast's own lines, during the opening

// ---- the game
const game = createGame({ world, cast, customers, say, store, onClock: setTime, focus, onPause: (paused) => pauseSound(paused) });
document.getElementById('pause').addEventListener('click', () => game.pause());
document.addEventListener('visibilitychange', () => { if (document.hidden) game.pause(); });

// taps in the scene: things on the table, a customer, V, Oluwasegun, the pan
const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2();
const hit = (obj) => obj && obj.parent && raycaster.intersectObject(obj, true).length > 0;
document.getElementById('segun').addEventListener('click', () => game.post());
renderer.domElement.addEventListener('pointerup', (e) => {
  pointer.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
  // nearest thing wins, so a customer behind the basket doesn't steal the tap
  const things = [
    ...Object.entries(world.tappable).map(([k, o]) => [o, () => game.tapTable(k)]),
    [cast.awara.parent === scene ? cast.awara : null, () => game.tapTable('awara')],
    [cast.vee, () => game.tapV()],
    [cast.seg, () => game.post()],
    ...customers.waiting.map((c) => [c.person, () => game.select(c)]),
  ];
  let best = null, bestD = Infinity;
  for (const [o, fn] of things) {
    if (!o || !o.parent) continue;
    const h = raycaster.intersectObject(o, true)[0];
    if (h && h.distance < bestD) { best = fn; bestD = h.distance; }
  }
  if (best) best();
});

// ---- sound
// a ♪ floats up from the speaker by Racheal while the music plays
const notePos = new THREE.Vector3();
let nextNote = 0;
function floatNote() {
  world.speaker.getWorldPosition(notePos); notePos.y += .2;
  notePos.project(camera);
  if (notePos.z > 1) return;
  const el = document.createElement('div');
  el.className = 'note'; el.textContent = Math.random() < .5 ? '♪' : '♫';
  el.style.left = `${(notePos.x * .5 + .5) * innerWidth}px`;
  el.style.top = `${(-notePos.y * .5 + .5) * innerHeight}px`;
  labels.appendChild(el);
  setTimeout(() => el.remove(), 1900);
}
// Pause stops the music too; Carry on brings it back if it was on.
function pauseSound(paused) {
  if (paused) sound.stop();
  else if (store.get('sound') === 'on') sound.start();
}
const sound = createSound();
const soundBtn = document.getElementById('sound');
function showSound() { soundBtn.textContent = sound.on ? 'Sound: on' : 'Sound: off'; soundBtn.setAttribute('aria-pressed', String(sound.on)); }
soundBtn.addEventListener('click', async () => {
  if (sound.on && !sound.loading) { await sound.stop(); store.set('sound', 'off'); showSound(); return; }
  soundBtn.textContent = 'Sound: loading…';
  await sound.start(); store.set('sound', 'on');
  showSound();
});
// Someone who had it on gets it back on their first tap, since a page may not start sound by itself.
if (store.get('sound') === 'on') window.addEventListener('pointerdown', async function once(e) {
  window.removeEventListener('pointerdown', once);
  if (e.target === soundBtn) return;
  await sound.start(); showSound();
});
showSound();

// ---- the loop
// ?speed=10 runs the evening faster, for testing; players never see it.
const SPEED = Math.min(20, Math.max(1, Number(new URLSearchParams(location.search).get('speed')) || 1));
let intro = matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : 0;
function frame() {
  const dt = Math.min(clock.getDelta(), .05), t = clock.elapsedTime;
  if (intro < 1) intro = Math.min(1, intro + dt / 3.2);
  const goal = target();
  // the opening swoop, then a soft glide whenever the view changes
  const k = intro < 1 ? 1 - Math.pow(1 - intro, 3) : 1 - Math.exp(-dt * 4);
  if (intro < 1) { camPos.lerpVectors(START, goal.pos, k); camLook.lerp(goal.look, k); camFov += (goal.fovNow - camFov) * k; }
  else { camPos.lerp(goal.pos, k); camLook.lerp(goal.look, k); camFov += (goal.fovNow - camFov) * k; }
  camera.position.copy(camPos);
  if (viewName() === 'stall') camera.position.x += Math.sin(t * .15) * .12;
  camera.lookAt(camLook);
  if (Math.abs(camera.fov - camFov) > .01) { camera.fov = camFov; camera.updateProjectionMatrix(); }

  const gdt = dt * SPEED;
  game.update(gdt);
  const running = game.running;
  cast.update(t, running ? gdt : 0);
  customers.update(running ? gdt : 0, t, game.min);
  placeBubbles();
  placeOrders();
  placeNames(viewName() === 'stall');
  // fire, oil and smoke keep going even when paused
  world.speakerLed.material.emissiveIntensity = sound.on ? 1.5 + Math.sin(t * 13) * 1.2 : 0;
  if (sound.on && viewName() === 'stall' && t > nextNote) { nextNote = t + .9; floatNote(); }
  // the fire takes a few seconds to catch once Racheal lights it
  const fire = world.fire; fire.on += (fire.target - fire.on) * Math.min(1, dt * .8);
  world.flames.forEach((f, i) => { const k = (.7 + .5 * Math.abs(Math.sin(t * (7 + i) + i))) * fire.on + .001; f.scale.set(fire.on + .001, k, fire.on + .001); f.position.y = .18 + k * .08; f.material.opacity = .5 + .35 * k; });
  world.fireLight.intensity = (5 + Math.sin(t * 13) * .8 + Math.sin(t * 7.3) * .6) * fire.on;
  world.panKosai.forEach((k, i) => { k.position.y = .5 + Math.abs(Math.sin(t * 4 + i)) * .012; k.rotation.y += .01; });
  world.smoke.forEach((s) => {
    s.userData.t = (s.userData.t + dt * .25) % 1; const u = s.userData.t;
    s.position.set(-2.25 + Math.sin(u * 6 + t) * .15, .6 + u * 1.6, 1.85); s.scale.setScalar(.3 + u * .9); s.material.opacity = .35 * (1 - u) * fire.on;
  });
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
document.getElementById('loading').remove();
requestAnimationFrame(frame);
window.__ready = true;
window.__game = game; window.__customers = customers; window.__cast = cast;   // handy when testing in a browser console

// Works offline after the first visit.
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => {});
