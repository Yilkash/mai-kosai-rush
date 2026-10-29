// Mai Kosai Rush: the stall at evening. Look test, before the gameplay.
import * as THREE from 'three';
import { makeTextures } from './textures.js';
import { buildSky, clockText } from './sky.js';
import { buildWorld } from './world.js';
import { buildCast } from './cast.js';
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
renderer.toneMappingExposure = 1.0;
renderer.outputColorSpace = THREE.SRGBColorSpace;
app.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const T = makeTextures();
const sky = buildSky(scene);
const world = buildWorld(scene, T);
const cast = buildCast(scene);

// ---- camera: sideways shows the whole stall; upright moves in on Lois and the crowd
const camera = new THREE.PerspectiveCamera(40, 2, .1, 400);
const VIEWS = {
  wide: { pos: new THREE.Vector3(-0.6, 6.0, 13.6), look: new THREE.Vector3(-1.0, .8, 2.6), halfWidth: 8.4 },
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

// ---- time of evening
const timeInput = document.getElementById('time');
const timeLabel = document.getElementById('timeLabel');
function setTime(min) {
  const dark = sky.setTime(min);
  world.lanternLight.intensity = dark * 10;
  world.lanternGlass.material.emissiveIntensity = dark * 2.2;
  const lightsOn = THREE.MathUtils.smoothstep(min, 420, 470);
  world.windowMat.emissiveIntensity = lightsOn * 1.2;
  world.lit.forEach((m, i) => { m.emissiveIntensity = THREE.MathUtils.smoothstep(min, 425 + i * 6, 470 + i * 6) * 1.1; });
  timeLabel.textContent = clockText(min);
}
let playing = false;
timeInput.addEventListener('input', () => { playing = false; setTime(+timeInput.value); });
document.getElementById('play').addEventListener('click', () => { playing = true; timeInput.value = 330; });
setTime(+timeInput.value);

// ---- intro sweep
let intro = matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : 0;
document.getElementById('intro').addEventListener('click', () => { intro = 0; cast.restartWalk(); talking.splice(0).forEach((b) => b.el.remove()); });

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
// Someone who had it on gets it back on their first tap anywhere, since a page may not start sound by itself.
if (store.get('sound') === 'on') window.addEventListener('pointerdown', async function once(e) {
  window.removeEventListener('pointerdown', once);
  if (e.target === soundBtn) return;
  await sound.start(); showSound();
});
showSound();

// ---- speech bubbles that follow a person on screen
const bubbles = document.getElementById('bubbles');
const talking = [];
const above = new THREE.Vector3();
function say(person, text, seconds = 7) {
  const el = document.createElement('div');
  el.className = 'say'; el.setAttribute('role', 'status'); el.textContent = text;
  bubbles.appendChild(el);
  talking.push({ person, el, until: clock.elapsedTime + seconds });
}
function placeBubbles() {
  for (let i = talking.length - 1; i >= 0; i--) {
    const b = talking[i];
    if (clock.elapsedTime > b.until) { b.el.remove(); talking.splice(i, 1); continue; }
    b.person.getWorldPosition(above); above.y += 1.95 * b.person.userData.h;
    above.project(camera);
    b.el.style.left = `${(above.x * .5 + .5) * innerWidth}px`;
    b.el.style.top = `${(-above.y * .5 + .5) * innerHeight}px`;
  }
}
// Mama Yan Bui tells Lois the total once the awara is on the table
// The total changes with every delivery, between these, in whole ₦100s.
const AWARA_TOTAL = { min: 3000, max: 7500 };
cast.events.onMamaArrives = (mama) => {
  const total = Math.round((AWARA_TOTAL.min + Math.random() * (AWARA_TOTAL.max - AWARA_TOTAL.min)) / 100) * 100;
  say(mama, `Lois, here’s the awara. Total is ₦${total.toLocaleString('en-NG')}.`);
};

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
const clock = new THREE.Clock();
function frame() {
  const dt = Math.min(clock.getDelta(), .05), t = clock.elapsedTime;
  if (intro < 1) intro = Math.min(1, intro + dt / 3.2);
  const e = 1 - Math.pow(1 - intro, 3);
  camera.position.lerpVectors(START, view.pos, e);
  camera.position.x += Math.sin(t * .15) * .15 * e;
  camera.lookAt(view.look);
  if (playing) {
    const v = Math.min(570, +timeInput.value + dt * 8);
    timeInput.value = v; setTime(v);
    if (v >= 570) playing = false;
  }
  cast.update(t, dt);
  placeBubbles();
  // fire, oil and smoke
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

// Works offline after the first visit.
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => {});
