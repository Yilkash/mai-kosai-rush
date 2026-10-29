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
const cast = buildCast(scene);
const customers = createCustomers(scene);
const clock = new THREE.Clock();

// ---- camera: sideways shows the whole stall; upright moves in on Lois and the crowd
const camera = new THREE.PerspectiveCamera(40, 2, .1, 400);
const VIEWS = {
  wide: { pos: new THREE.Vector3(0.2, 5.6, 12.2), look: new THREE.Vector3(-0.4, .9, 3.0), halfWidth: 7.6 },
  tall: { pos: new THREE.Vector3(1.6, 4.6, 10.8), look: new THREE.Vector3(0.6, .95, 3.4), halfWidth: 3.4 },
};
let view = VIEWS.wide;
const START = new THREE.Vector3(-14, 8, 26);
function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  view = camera.aspect < 1 ? VIEWS.tall : VIEWS.wide;
  const dist = view.pos.distanceTo(view.look);
  camera.fov = THREE.MathUtils.clamp(2 * Math.atan(view.halfWidth / dist / camera.aspect) * 180 / Math.PI, 28, 66);
  camera.updateProjectionMatrix();
  document.body.classList.toggle('tall', camera.aspect < 1);
}
window.addEventListener('resize', resize);
resize();

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
    b.el.style.top = `${Math.max(60, (-above.y * .5 + .5) * innerHeight)}px`;
  }
}

// ---- the game
const game = createGame({ world, cast, customers, say, store, onClock: setTime });
document.getElementById('pause').addEventListener('click', () => game.pause());
document.addEventListener('visibilitychange', () => { if (document.hidden) game.pause(); });

// tapping someone in the scene: V for her sandal, a customer to start their order
const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2();
renderer.domElement.addEventListener('pointerup', (e) => {
  pointer.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
  if (raycaster.intersectObject(cast.vee, true).length) { game.tapV(); return; }
  for (const c of customers.waiting) if (raycaster.intersectObject(c.person, true).length) { game.select(c); return; }
});

// ---- sound
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

// ---- full screen, and sideways where the phone allows it
const fsBtn = document.getElementById('fullscreen');
if (!document.documentElement.requestFullscreen) fsBtn.hidden = true;
fsBtn.addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) { await document.exitFullscreen(); return; }
    await document.documentElement.requestFullscreen();
    await screen.orientation?.lock?.('landscape');
  } catch { /* some phones refuse the lock; full screen alone still helps */ }
});
document.addEventListener('fullscreenchange', () => { fsBtn.textContent = document.fullscreenElement ? 'Exit full screen' : 'Full screen'; });

// ---- "best sideways" tip, closable, remembered
const tip = document.getElementById('tip');
if (store.get('tipClosed') !== '1') tip.hidden = false;
document.getElementById('tipClose').addEventListener('click', () => { tip.hidden = true; store.set('tipClosed', '1'); });

// ---- the loop
// ?speed=10 runs the evening faster, for testing; players never see it.
const SPEED = Math.min(20, Math.max(1, Number(new URLSearchParams(location.search).get('speed')) || 1));
let intro = matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : 0;
function frame() {
  const dt = Math.min(clock.getDelta(), .05), t = clock.elapsedTime;
  if (intro < 1) intro = Math.min(1, intro + dt / 3.2);
  const e = 1 - Math.pow(1 - intro, 3);
  camera.position.lerpVectors(START, view.pos, e);
  camera.position.x += Math.sin(t * .15) * .12 * e;
  camera.lookAt(view.look);

  const gdt = dt * SPEED;
  game.update(gdt);
  const running = game.running;
  cast.update(t, running ? gdt : 0);
  customers.update(running ? gdt : 0, t, game.min);
  placeBubbles();
  // fire, oil and smoke keep going even when paused
  world.flames.forEach((f, i) => { const k = .7 + .5 * Math.abs(Math.sin(t * (7 + i) + i)); f.scale.set(1, k, 1); f.position.y = .18 + k * .08; f.material.opacity = .5 + .35 * k; });
  world.fireLight.intensity = 5 + Math.sin(t * 13) * .8 + Math.sin(t * 7.3) * .6;
  world.panKosai.forEach((k, i) => { k.position.y = .5 + Math.abs(Math.sin(t * 4 + i)) * .012; k.rotation.y += .01; });
  world.smoke.forEach((s) => {
    s.userData.t = (s.userData.t + dt * .25) % 1; const u = s.userData.t;
    s.position.set(-2.25 + Math.sin(u * 6 + t) * .15, .6 + u * 1.6, 1.85); s.scale.setScalar(.3 + u * .9); s.material.opacity = .35 * (1 - u);
  });
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
document.getElementById('loading').remove();
requestAnimationFrame(frame);
window.__ready = true;
window.__game = game;   // handy when testing in a browser console

// Works offline after the first visit.
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => {});
