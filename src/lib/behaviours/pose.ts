import * as THREE from 'three';
import type { LegId, LegPose, Pose } from '@/types/bee';
import { fbm1, lerp, TAU } from '../math';

export const LEGS: LegId[] = ['L1', 'R1', 'L2', 'R2', 'L3', 'R3'];
const pair = (n: 1 | 2 | 3): [LegId, LegId] => [`L${n}` as LegId, `R${n}` as LegId];

export const legPose = (pro: number, elev: number, knee: number, ankle: number): LegPose => ({ pro, elev, knee, ankle });

/** Insect sprawl: femora angled slightly upward, tibiae down-and-out, tarsi on the ground. */
export const STAND: Record<1 | 2 | 3, LegPose> = {
  1: legPose(0, 0.95, 1.15, -0.95),
  2: legPose(0, 1.0, 1.07, -0.9),
  3: legPose(0, 1.0, 1.01, -0.8),
};
export const FLIGHT_LEGS: Record<1 | 2 | 3, LegPose> = {
  1: legPose(-0.35, -0.2, 1.5, 0.3),
  2: legPose(-0.25, -0.35, 1.1, 0.2),
  3: legPose(-0.2, -0.45, 0.7, 0.15),
};
/** relaxed museum-specimen pose used in the studio */
export const SPECIMEN: Record<1 | 2 | 3, LegPose> = {
  1: legPose(0.05, 0.9, 1.2, -0.9),
  2: legPose(0, 0.95, 1.1, -0.85),
  3: legPose(0, 0.95, 1.05, -0.75),
};

export function createPose(): Pose {
  const legs = {} as Record<LegId, LegPose>;
  for (const l of LEGS) legs[l] = legPose(0, 0.5, 1.4, -0.5);
  return {
    pos: new THREE.Vector3(),
    quat: new THREE.Quaternion(),
    bodyPitch: 0,
    headPitch: 0,
    headYaw: 0,
    headRoll: 0,
    antL: [0, 0, 0],
    antR: [0, 0, 0],
    mandible: 0,
    proboscis: 0,
    glossa: 0,
    wingFold: 1,
    wingPhase: 0,
    wingAmp: 1.6,
    wingBlur: 0,
    wingTremor: 0,
    legs,
    abdPitch: 0,
    abdYaw: 0,
    abdRoll: 0,
    breathe: 0,
    stinger: 0,
    pollenLoad: 0,
    bodyPollen: 0,
    waxScales: 0,
    waxCarry: 0,
    waxWorked: 0,
  };
}

export function setLegs(out: Pose, src: Record<1 | 2 | 3, LegPose>) {
  for (const n of [1, 2, 3] as const) {
    for (const id of pair(n)) Object.assign(out.legs[id], src[n]);
  }
}

export function blendLegs(out: Pose, a: Record<1 | 2 | 3, LegPose>, b: Record<1 | 2 | 3, LegPose>, t: number) {
  for (const n of [1, 2, 3] as const) {
    for (const id of pair(n)) {
      const o = out.legs[id];
      o.pro = lerp(a[n].pro, b[n].pro, t);
      o.elev = lerp(a[n].elev, b[n].elev, t);
      o.knee = lerp(a[n].knee, b[n].knee, t);
      o.ankle = lerp(a[n].ankle, b[n].ankle, t);
    }
  }
}

/** Tripod gait overlay. phase in cycles. amount 0..1 */
export function applyGait(out: Pose, phase: number, amount: number, stride = 0.28) {
  if (amount <= 0) return;
  const groupA: LegId[] = ['L1', 'R2', 'L3'];
  for (const id of LEGS) {
    const off = groupA.includes(id) ? 0 : 0.5;
    const ph = (phase + off) * TAU;
    const swing = Math.sin(ph);
    const lift = Math.max(0, Math.cos(ph));
    const l = out.legs[id];
    l.pro += swing * stride * amount * (id.endsWith('3') ? 1.1 : 1);
    l.elev += lift * 0.35 * amount;
    l.knee -= lift * 0.2 * amount;
  }
}

/** Subtle life: breathing, antenna sweep, micro head motion. Pure function of t. */
export function applyIdleLife(out: Pose, t: number, amount = 1, seed = 0) {
  out.breathe += Math.sin(t * TAU * 0.55 + seed) * 0.6 * amount;
  out.antR[0] += fbm1(t * 0.7, 1 + seed) * 0.25 * amount;
  out.antR[1] += fbm1(t * 0.6, 2 + seed) * 0.2 * amount;
  out.antR[2] += fbm1(t * 0.9, 3 + seed) * 0.6 * amount;
  out.antL[0] += fbm1(t * 0.65, 4 + seed) * 0.25 * amount;
  out.antL[1] += fbm1(t * 0.55, 5 + seed) * 0.2 * amount;
  out.antL[2] += fbm1(t * 0.85, 6 + seed) * 0.6 * amount;
  out.headYaw += fbm1(t * 0.3, 7 + seed) * 0.05 * amount;
  out.headPitch += fbm1(t * 0.25, 8 + seed) * 0.03 * amount;
  out.abdPitch += Math.sin(t * TAU * 0.55 + seed) * 0.015 * amount;
}

export function resetPose(out: Pose) {
  out.pos.set(0, 0, 0);
  out.quat.identity();
  out.bodyPitch = out.headPitch = out.headYaw = out.headRoll = 0;
  out.antL = [0, 0, 0];
  out.antR = [0, 0, 0];
  out.mandible = out.proboscis = out.glossa = 0;
  out.wingFold = 1;
  out.wingPhase = 0;
  out.wingAmp = 1.6;
  out.wingBlur = 0;
  out.wingTremor = 0;
  out.abdPitch = out.abdYaw = out.abdRoll = out.breathe = 0;
  out.stinger = out.pollenLoad = out.bodyPollen = 0;
  out.waxScales = out.waxCarry = out.waxWorked = 0;
  setLegs(out, SPECIMEN);
}

const scalarKeys = [
  'bodyPitch', 'headPitch', 'headYaw', 'headRoll', 'mandible', 'proboscis', 'glossa', 'wingFold',
  'wingAmp', 'wingBlur', 'wingTremor', 'abdPitch', 'abdYaw', 'abdRoll', 'breathe', 'stinger',
  'pollenLoad', 'bodyPollen', 'waxScales', 'waxCarry', 'waxWorked',
] as const;

/** out = lerp(a, b, t). Wing phase comes from b (never interpolate phase). */
export function blendPose(a: Pose, b: Pose, t: number, out: Pose) {
  out.pos.lerpVectors(a.pos, b.pos, t);
  out.quat.slerpQuaternions(a.quat, b.quat, t);
  for (const k of scalarKeys) out[k] = lerp(a[k], b[k], t);
  for (let i = 0; i < 3; i++) {
    out.antL[i] = lerp(a.antL[i], b.antL[i], t);
    out.antR[i] = lerp(a.antR[i], b.antR[i], t);
  }
  out.wingPhase = b.wingPhase;
  for (const id of LEGS) {
    const o = out.legs[id],
      la = a.legs[id],
      lb = b.legs[id];
    o.pro = lerp(la.pro, lb.pro, t);
    o.elev = lerp(la.elev, lb.elev, t);
    o.knee = lerp(la.knee, lb.knee, t);
    o.ankle = lerp(la.ankle, lb.ankle, t);
  }
}

export function copyPose(src: Pose, out: Pose) {
  blendPose(src, src, 0, out);
}

const _x = new THREE.Vector3();
const _y = new THREE.Vector3();
const _z = new THREE.Vector3();
const _m = new THREE.Matrix4();
/** Orientation from a forward (+Z) and dorsal (+Y) direction. */
export function quatFromForwardUp(forward: THREE.Vector3, up: THREE.Vector3, out: THREE.Quaternion) {
  _z.copy(forward).normalize();
  _x.crossVectors(up, _z).normalize();
  _y.crossVectors(_z, _x).normalize();
  _m.makeBasis(_x, _y, _z);
  return out.setFromRotationMatrix(_m);
}

const _e = new THREE.Euler();
export function quatFromYawPitchRoll(yaw: number, pitch: number, roll: number, out: THREE.Quaternion) {
  _e.set(-pitch, yaw, roll, 'YXZ');
  return out.setFromEuler(_e);
}
