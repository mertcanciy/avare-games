import * as THREE from "three";
import type { Building } from "../shared/cityGen";

export const SLING = {
  range: 30,
  minCharge: 0.25,
  maxCharge: 1.5,
  minSpeed: 25,
  maxSpeed: 45,
  pitch: Math.PI / 9,
  layoutTime: 1,
  cancelStick: 0.85,
};

const _candidate = new THREE.Vector3();

/** Segment/AABB intersection, without allocating raycast hit objects. */
function blocked(a: THREE.Vector3, b: THREE.Vector3, solids: Building[]) {
  for (const box of solids) {
    let near = 0;
    let far = 1;
    for (let axis = 0; axis < 3; axis++) {
      const p = axis === 0 ? a.x : axis === 1 ? a.y : a.z;
      const d = (axis === 0 ? b.x : axis === 1 ? b.y : b.z) - p;
      const lo = axis === 0 ? box.x - box.w / 2 : axis === 1 ? box.y0 : box.z - box.d / 2;
      const hi = axis === 0 ? box.x + box.w / 2 : axis === 1 ? box.h : box.z + box.d / 2;
      if (Math.abs(d) < 1e-8) {
        if (p < lo || p > hi) { far = -1; break; }
      } else {
        const t0 = (lo - p) / d;
        const t1 = (hi - p) / d;
        near = Math.max(near, Math.min(t0, t1));
        far = Math.min(far, Math.max(t0, t1));
        if (near > far) break;
      }
    }
    if (near <= far && far > 0.001 && near < 0.999) return true;
  }
  return false;
}

/** Run only on a fresh press. Both anchors must be visible, real vertical faces. */
export function findSlingAnchors(origin: THREE.Vector3, yaw: number, faces: Building[], solids: Building[], left: THREE.Vector3, right: THREE.Vector3) {
  const fx = -Math.sin(yaw);
  const fz = -Math.cos(yaw);
  const rx = -fz;
  const rz = fx;
  let leftBuilding: Building | null = null;
  for (let side = -1; side <= 1; side += 2) {
    let best = Infinity;
    let found: Building | null = null;
    const out = side < 0 ? left : right;
    const tx = origin.x - fx * 4 + rx * side * 8;
    const tz = origin.z - fz * 4 + rz * side * 8;
    for (const b of faces) {
      if (b === leftBuilding || b.h < origin.y - 1.5 || b.y0 > origin.y + 3) continue;
      if (Math.abs(b.x - origin.x) > b.w / 2 + SLING.range || Math.abs(b.z - origin.z) > b.d / 2 + SLING.range) continue;
      for (let face = 0; face < 4; face++) {
        const nx = face < 2 ? (face === 0 ? -1 : 1) : 0;
        const nz = face >= 2 ? (face === 2 ? -1 : 1) : 0;
        const x = nx ? b.x + nx * b.w / 2 : THREE.MathUtils.clamp(tx, b.x - b.w / 2 + 0.1, b.x + b.w / 2 - 0.1);
        const z = nz ? b.z + nz * b.d / 2 : THREE.MathUtils.clamp(tz, b.z - b.d / 2 + 0.1, b.z + b.d / 2 - 0.1);
        if ((origin.x - x) * nx + (origin.z - z) * nz < 0.01) continue;
        _candidate.set(x, THREE.MathUtils.clamp(origin.y + 1.5, b.y0 + 0.1, b.h - 0.1), z);
        const dx = x - origin.x;
        const dz = z - origin.z;
        const ahead = dx * fx + dz * fz;
        if ((dx * rx + dz * rz) * side < 2 || ahead > 0.5) continue;
        const dist = origin.distanceTo(_candidate);
        const score = dist + Math.abs(ahead + 4) * 0.5;
        if (dist > SLING.range || score >= best || blocked(origin, _candidate, solids)) continue;
        best = score;
        found = b;
        out.copy(_candidate);
      }
    }
    if (!found) return false;
    leftBuilding = found;
  }
  return true;
}
