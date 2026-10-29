// Small helpers for building meshes.
import * as THREE from 'three';

export const M = (o) => new THREE.MeshStandardMaterial({ roughness: .85, metalness: 0, ...o });
export const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);

export function mesh(geo, mat, { x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, cast = true, receive = true } = {}) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  m.castShadow = cast;
  m.receiveShadow = receive;
  return m;
}
