import * as THREE from "three";
import type { HeroRig } from "./heroModel";

/**
 * Web wings: a translucent membrane under each arm, wrist to knee, drawn as
 * three triangles per side whose corners follow the hero's bones (world
 * space) every frame. Fixed buffers, no per-frame allocation; while folding,
 * the outer corners slide back to the body, so closed wings are degenerate
 * (zero-area) triangles that draw nothing.
 */
const TRIS = 6;

const _sh = new THREE.Vector3();
const _el = new THREE.Vector3();
const _wr = new THREE.Vector3();
const _hip = new THREE.Vector3();
const _kn = new THREE.Vector3();
const _e1 = new THREE.Vector3();
const _e2 = new THREE.Vector3();
const _nn = new THREE.Vector3();

export class WebWings {
  mesh: THREE.Mesh;
  private pos: Float32Array;
  private nrm: Float32Array;
  private geo: THREE.BufferGeometry;
  private mat: THREE.MeshStandardMaterial;

  constructor() {
    this.pos = new Float32Array(TRIS * 9);
    this.nrm = new Float32Array(TRIS * 9);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute("normal", new THREE.BufferAttribute(this.nrm, 3).setUsage(THREE.DynamicDrawUsage));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
    this.geo = g;
    this.mat = new THREE.MeshStandardMaterial({
      color: "#e4ebf7",
      roughness: 0.45,
      metalness: 0,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.mesh = new THREE.Mesh(g, this.mat);
    this.mesh.frustumCulled = false;
    this.mesh.castShadow = false;
    this.mesh.visible = false;
  }

  private tri(i: number, a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3) {
    const p = this.pos;
    const n = this.nrm;
    const o = i * 9;
    _e1.subVectors(b, a);
    _e2.subVectors(c, a);
    _nn.crossVectors(_e1, _e2);
    if (_nn.lengthSq() > 1e-12) _nn.normalize();
    else _nn.set(0, 1, 0);
    p[o] = a.x; p[o + 1] = a.y; p[o + 2] = a.z;
    p[o + 3] = b.x; p[o + 4] = b.y; p[o + 5] = b.z;
    p[o + 6] = c.x; p[o + 7] = c.y; p[o + 8] = c.z;
    for (let k = 0; k < 9; k += 3) {
      n[o + k] = _nn.x;
      n[o + k + 1] = _nn.y;
      n[o + k + 2] = _nn.z;
    }
  }

  /** `open` 0..1 (folded → spread); `force` draws the folded wings anyway (shader priming). */
  update(rig: HeroRig, open: number, force = false) {
    const vis = open > 0.005 || force;
    this.mesh.visible = vis;
    if (!vis) return;
    const b = rig.bones;
    const fold = 1 - open;
    for (let side = 0; side < 2; side++) {
      const l = side === 0;
      (l ? b.upperarm_l : b.upperarm_r).getWorldPosition(_sh);
      (l ? b.lowerarm_l : b.lowerarm_r).getWorldPosition(_el);
      (l ? b.hand_l : b.hand_r).getWorldPosition(_wr);
      (l ? b.thigh_l : b.thigh_r).getWorldPosition(_hip);
      (l ? b.calf_l : b.calf_r).getWorldPosition(_kn);
      _el.lerp(_sh, fold);
      _wr.lerp(_sh, fold);
      _kn.lerp(_hip, fold);
      const i = side * 3;
      this.tri(i, _sh, _el, _hip);
      this.tri(i + 1, _el, _wr, _kn);
      this.tri(i + 2, _el, _kn, _hip);
    }
    this.geo.attributes.position.needsUpdate = true;
    this.geo.attributes.normal.needsUpdate = true;
  }

  dispose() {
    this.geo.dispose();
    this.mat.dispose();
  }
}
