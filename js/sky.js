// The evening: sky, sun, ambient light and fog from 5:30pm to 9:30pm.
import * as THREE from 'three';

const C = (h) => new THREE.Color(h);

// Minutes after midnight. 5:30pm is 1050, but the game counts from noon, so
// the slider runs 330 (5:30) to 570 (9:30) and these keys use the same scale.
const KEYS = [
  { m: 330, top: C('#6c90c8'), mid: C('#e9c39a'), bottom: C('#f2d6b0'), sun: 1.7, sunC: C('#ffd8ad'), hemi: .9, fog: C('#b9a491'), stars: 0 },
  { m: 400, top: C('#41528f'), mid: C('#d48a63'), bottom: C('#eab07a'), sun: 1.1, sunC: C('#ffad70'), hemi: .6, fog: C('#7d5f62'), stars: 0 },
  { m: 450, top: C('#232454'), mid: C('#6e3a62'), bottom: C('#b8644a'), sun: .35, sunC: C('#ff8a55'), hemi: .34, fog: C('#3a2a45'), stars: .4 },
  { m: 510, top: C('#0d1030'), mid: C('#1c1d45'), bottom: C('#3a2a4a'), sun: .12, sunC: C('#8090d0'), hemi: .24, fog: C('#1a1828'), stars: 1 },
  { m: 570, top: C('#070818'), mid: C('#10122d'), bottom: C('#1c1830'), sun: .08, sunC: C('#7080c0'), hemi: .2, fog: C('#100f1c'), stars: 1 },
];

export function buildSky(scene) {
  const uniforms = { top: { value: new THREE.Color() }, mid: { value: new THREE.Color() }, bottom: { value: new THREE.Color() }, stars: { value: 0 } };
  const dome = new THREE.Mesh(new THREE.SphereGeometry(160, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false, uniforms,
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: `uniform vec3 top; uniform vec3 mid; uniform vec3 bottom; uniform float stars; varying vec3 vP;
      float h(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,45.164)))*43758.5453); }
      void main(){ float y = clamp(vP.y,0.,1.);
        vec3 c = mix(bottom, mid, smoothstep(0.,.16,y)); c = mix(c, top, smoothstep(.16,.6,y));
        vec3 q = floor(vP*240.); c += vec3(step(.9975, h(q)) * smoothstep(.12,.45,y) * stars);
        gl_FragColor = vec4(c,1.); }`,
  }));
  scene.add(dome);

  const hemi = new THREE.HemisphereLight('#ffe2c4', '#3a2a20', .6);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight('#ffb070', 1.6);
  sun.position.set(-14, 9, 10);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -14, right: 12, top: 10, bottom: -8, near: 1, far: 60 });
  sun.shadow.bias = -.0006;
  scene.add(sun);
  scene.fog = new THREE.Fog('#2a2238', 30, 95);

  /** Puts the sky and light at `min` (330 = 5:30pm … 570 = 9:30pm); returns how dark it is, 0–1. */
  function setTime(min) {
    let i = 0;
    while (i < KEYS.length - 2 && min > KEYS[i + 1].m) i++;
    const a = KEYS[i], b = KEYS[i + 1];
    const t = THREE.MathUtils.clamp((min - a.m) / (b.m - a.m), 0, 1);
    uniforms.top.value.copy(a.top).lerp(b.top, t);
    uniforms.mid.value.copy(a.mid).lerp(b.mid, t);
    uniforms.bottom.value.copy(a.bottom).lerp(b.bottom, t);
    uniforms.stars.value = THREE.MathUtils.lerp(a.stars, b.stars, t);
    sun.intensity = THREE.MathUtils.lerp(a.sun, b.sun, t);
    sun.color.copy(a.sunC).lerp(b.sunC, t);
    hemi.intensity = THREE.MathUtils.lerp(a.hemi, b.hemi, t);
    scene.fog.color.copy(a.fog).lerp(b.fog, t);
    sun.position.set(-14, THREE.MathUtils.lerp(9, 4, (min - 330) / 240), 10);
    return THREE.MathUtils.smoothstep(min, 400, 445);
  }

  return { setTime };
}

/** "7:04 pm" for a slider value. */
export function clockText(min) {
  const h = Math.floor(min / 60), m = String(Math.floor(min % 60)).padStart(2, '0');
  return `${h > 12 ? h - 12 : h}:${m} pm`;
}
