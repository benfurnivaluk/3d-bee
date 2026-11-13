import * as THREE from 'three';
import type { BeeRig } from './beeRig';

/**
 * Per-frame shared state that must NOT go through React (would re-render at 60 fps).
 * Written by BeeAnimator, read by the camera and markers.
 */
export const runtime = {
  mainRig: null as BeeRig | null,
  beeWorld: new THREE.Vector3(),
  beeQuat: new THREE.Quaternion(),
};

if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  (window as unknown as { __bee: typeof runtime }).__bee = runtime;
}
