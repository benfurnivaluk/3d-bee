'use client';

import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import gsap from 'gsap';
import { useBeeStore } from '@/store/beeExplorerStore';
import { runtime } from '@/lib/runtime';
import { FULL_VIEW } from '@/data/cameraPresets';
import { ANATOMY_BY_ID } from '@/data/beeAnatomy';
import type { AnatomyId } from '@/types/bee';

interface Goal {
  pos: THREE.Vector3;
  target: THREE.Vector3;
  anchor?: AnatomyId;
  fov: number;
}

const DEFAULT_FOV = 38;

/** Orbit controls + smooth GSAP-timed moves to the full view or a selected structure. */
export function BeeCamera() {
  const controls = useRef<OrbitControlsImpl>(null);
  const { camera, size } = useThree();
  const persp = camera as THREE.PerspectiveCamera;
  const goal = useRef<Goal | null>(null);
  const tween = useRef({ k: 1 });
  const start = useRef({ pos: new THREE.Vector3(), target: new THREE.Vector3(), fov: DEFAULT_FOV });
  const keys = useRef(new Set<string>());
  const viewShift = useRef(0);

  const resolveGoal = (g: Goal, outPos: THREE.Vector3, outTarget: THREE.Vector3) => {
    const q = runtime.beeQuat;
    if (g.anchor && runtime.mainRig) {
      runtime.mainRig.anchors[g.anchor].getWorldPosition(outTarget);
      outPos.copy(g.pos).applyQuaternion(q).add(outTarget);
      return;
    }
    outPos.copy(g.pos).applyQuaternion(q).add(runtime.beeWorld);
    outTarget.copy(g.target).applyQuaternion(q).add(runtime.beeWorld);
  };

  const fly = (g: Goal) => {
    start.current.pos.copy(camera.position);
    start.current.target.copy(controls.current?.target ?? new THREE.Vector3());
    start.current.fov = persp.fov;
    goal.current = g;
    tween.current.k = 0;
    gsap.killTweensOf(tween.current);
    gsap.to(tween.current, { k: 1, duration: useBeeStore.getState().reducedMotion ? 0.01 : 1.4, ease: 'power3.inOut' });
  };

  useEffect(() => {
    const handle = (req = useBeeStore.getState().camera) => {
      if (!req) return;
      if (req.kind === 'anatomy') {
        const a = ANATOMY_BY_ID[req.id as AnatomyId];
        const dir = new THREE.Vector3(...a.view.offset).normalize().multiplyScalar(a.view.distance * 1.4);
        fly({ pos: dir, target: new THREE.Vector3(), anchor: a.id, fov: 34 });
      } else {
        fly({ pos: new THREE.Vector3(...FULL_VIEW.position), target: new THREE.Vector3(...FULL_VIEW.target), fov: DEFAULT_FOV });
      }
    };
    handle();
    return useBeeStore.subscribe((s, prev) => {
      if (s.camera && s.camera !== prev.camera) handle(s.camera);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // keyboard: arrows orbit, +/- zoom, R resets
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.isContentEditable)) return;
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '=', '-', '_'].includes(e.key)) {
        keys.current.add(e.key);
        e.preventDefault();
      }
      if (e.key === 'r' || e.key === 'R') useBeeStore.getState().requestCamera('reset', 'full');
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.key);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  const sph = useRef(new THREE.Spherical());
  const off = useRef(new THREE.Vector3());
  const gp = useRef(new THREE.Vector3());
  const gt = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    const c = controls.current;
    if (!c) return;
    const s = useBeeStore.getState();

    if (goal.current && tween.current.k < 1) {
      resolveGoal(goal.current, gp.current, gt.current);
      const k = tween.current.k;
      camera.position.lerpVectors(start.current.pos, gp.current, k);
      c.target.lerpVectors(start.current.target, gt.current, k);
      persp.fov = THREE.MathUtils.lerp(start.current.fov, goal.current.fov, k);
      persp.updateProjectionMatrix();
    }

    if (keys.current.size) {
      off.current.copy(camera.position).sub(c.target);
      sph.current.setFromVector3(off.current);
      const r = 1.6 * delta;
      if (keys.current.has('ArrowLeft')) sph.current.theta -= r;
      if (keys.current.has('ArrowRight')) sph.current.theta += r;
      if (keys.current.has('ArrowUp')) sph.current.phi = Math.max(0.05, sph.current.phi - r);
      if (keys.current.has('ArrowDown')) sph.current.phi = Math.min(Math.PI - 0.05, sph.current.phi + r);
      if (keys.current.has('+') || keys.current.has('=')) sph.current.radius = Math.max(c.minDistance, sph.current.radius * (1 - delta * 1.5));
      if (keys.current.has('-') || keys.current.has('_')) sph.current.radius = Math.min(c.maxDistance, sph.current.radius * (1 + delta * 1.5));
      off.current.setFromSpherical(sph.current);
      camera.position.copy(c.target).add(off.current);
    }

    // keep the bee centred in the space left by the structure list (desktop) and the pop-out
    const w = size.width;
    const want = (s.selected ? Math.min(136, w * 0.2) : 0) - (w >= 1024 ? 90 : 0);
    viewShift.current += (want - viewShift.current) * Math.min(1, delta * 4);
    if (Math.abs(viewShift.current) > 0.5) persp.setViewOffset(w, size.height, viewShift.current, 0, w, size.height);
    else if (persp.view) persp.clearViewOffset();

    c.update();
  });

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.7}
      zoomSpeed={0.8}
      minDistance={0.45}
      maxDistance={14}
      minPolarAngle={0.02}
      maxPolarAngle={Math.PI - 0.02}
      enablePan
      panSpeed={0.6}
      onStart={() => {
        if (tween.current.k < 1) {
          gsap.killTweensOf(tween.current);
          tween.current.k = 1;
        }
      }}
    />
  );
}
