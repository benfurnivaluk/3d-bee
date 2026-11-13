import type * as THREE from 'three';

export type AnatomyId =
  | 'compoundEyes'
  | 'ocelli'
  | 'antennae'
  | 'mandibles'
  | 'proboscis'
  | 'thorax'
  | 'forewings'
  | 'hindwings'
  | 'hamuli'
  | 'frontLegs'
  | 'middleLegs'
  | 'hindLegs'
  | 'corbiculae'
  | 'abdomen'
  | 'spiracles'
  | 'stinger';

export type QualitySetting = 'auto' | 'high' | 'medium' | 'low';
export type QualityLevel = 'high' | 'medium' | 'low';
export type LegId = 'L1' | 'R1' | 'L2' | 'R2' | 'L3' | 'R3';

/** Scientific review status for any piece of content or geometry. */
export type ReviewStatus = 'literature-checked' | 'needs-expert-review' | 'simplified-visual';

export interface AnatomyEntry {
  id: AnatomyId;
  name: string;
  scientific: string;
  subject: string;
  purpose: string;
  fact: string;
  /** Camera framing when the structure is focused, in the bee's local frame. */
  view: { offset: [number, number, number]; distance: number };
  review: ReviewStatus;
  modelNote?: string;
}

export interface CameraPreset {
  id: string;
  label: string;
  /** Camera position relative to the bee root, bee-local frame */
  position: [number, number, number];
  /** Look-at target relative to the bee root, bee-local frame */
  target: [number, number, number];
  fov?: number;
}

export interface LegPose {
  /** protraction: + swings the leg forward (rad) */
  pro: number;
  /** femur elevation: + raises the femur (rad) */
  elev: number;
  /** femur–tibia flexion (rad) */
  knee: number;
  /** tibia–tarsus flexion (rad) */
  ankle: number;
}

/** A full scalar description of the bee at one instant. Behaviours write poses; the rig reads them. */
export interface Pose {
  pos: THREE.Vector3;
  quat: THREE.Quaternion;
  bodyPitch: number;
  headPitch: number;
  headYaw: number;
  headRoll: number;
  /** [scape yaw, scape pitch, flagellum bend] */
  antL: [number, number, number];
  antR: [number, number, number];
  mandible: number;
  proboscis: number;
  glossa: number;
  wingFold: number;
  wingPhase: number;
  wingAmp: number;
  wingBlur: number;
  wingTremor: number;
  legs: Record<LegId, LegPose>;
  abdPitch: number;
  abdYaw: number;
  abdRoll: number;
  breathe: number;
  stinger: number;
  pollenLoad: number;
  bodyPollen: number;
  /** 0..1 how far wax scales protrude from the wax pockets */
  waxScales: number;
  /** 0..1 a wax scale carried by the right hind leg -> foreleg -> mandibles */
  waxCarry: number;
  /** 0..1 worked wax at the mandibles (opaque) */
  waxWorked: number;
}
