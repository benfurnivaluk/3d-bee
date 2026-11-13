'use client';

import { useCallback, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BEE_MODEL_URL, BeeModel, GltfBeeModel } from './BeeModel';
import type { BeeRig, RigLod } from '@/lib/beeRig';
import { runtime } from '@/lib/runtime';
import { useBeeStore } from '@/store/beeExplorerStore';
import { applyGait, applyIdleLife, createPose, quatFromYawPitchRoll, resetPose } from '@/lib/behaviours/pose';
import { clamp, lerp, smooth, TAU } from '@/lib/math';
import { ambience } from '@/lib/ambience';
import type { LegId } from '@/types/bee';

/**
 * Autonomous "living specimen": the bee picks small random actions — standing still,
 * grooming its antennae, shifting a leg, fanning its wings, walking a few steps, turning —
 * and cross-fades between them. Everything settles to stillness while a structure is
 * selected (so it can be studied) or when the visitor prefers reduced motion.
 */
type Kind = 'still' | 'groom' | 'shift' | 'flap' | 'walk' | 'turn';

interface Action {
  kind: Kind;
  t0: number;
  dur: number;
  side: 1 | -1;
  leg: LegId;
}

const MENU: [Kind, number, [number, number]][] = [
  // kind, weight, duration range (s)
  ['still', 0.26, [2, 4]],
  ['groom', 0.14, [2.6, 3.6]],
  ['shift', 0.14, [1.2, 1.6]],
  ['flap', 0.14, [1.6, 2.6]],
  ['walk', 0.2, [2.5, 4.5]],
  ['turn', 0.12, [1.6, 2.4]],
];
const LEGS: LegId[] = ['L1', 'R1', 'L2', 'R2', 'L3', 'R3'];
const WANDER_RADIUS = 0.9; // keep the bee near the centre of the view
const FADE = 0.4;

function pick(t: number): Action {
  let r = Math.random();
  let chosen = MENU[0];
  for (const m of MENU) {
    if ((r -= m[1]) <= 0) {
      chosen = m;
      break;
    }
  }
  const [kind, , [a, b]] = chosen;
  return { kind, t0: t, dur: a + Math.random() * (b - a), side: Math.random() < 0.5 ? 1 : -1, leg: LEGS[Math.floor(Math.random() * 6)] };
}

export function BeeAnimator({ lod }: { lod: RigLod }) {
  const rig = useRef<BeeRig | null>(null);
  const pose = useRef(createPose());
  const sting = useRef(0);
  const t = useRef(0);
  const act = useRef<Action>({ kind: 'still', t0: 0, dur: 2.5, side: 1, leg: 'R2' });
  const motion = useRef({ x: 0, z: 0, yaw: 0, gait: 0, wing: 0, turnRate: 0 });

  const onRig = useCallback((r: BeeRig | null) => {
    rig.current = r;
    runtime.mainRig = r;
  }, []);

  useFrame((_, rawDelta) => {
    const s = useBeeStore.getState();
    const dt = Math.min(rawDelta, 0.1);
    const now = (t.current += dt);
    const calm = s.selected !== null || s.reducedMotion;

    // schedule: end the current action early when calm, then only stand still
    let a = act.current;
    if (calm && a.kind !== 'still' && now < a.t0 + a.dur - FADE) a.dur = now - a.t0 + FADE;
    if (now >= a.t0 + a.dur) a = act.current = calm ? { ...a, kind: 'still', t0: now, dur: 1.5 } : pick(now);
    const u = clamp((now - a.t0) / a.dur);
    const w = smooth((now - a.t0) / FADE) * smooth((a.t0 + a.dur - now) / FADE); // fade in/out envelope

    const p = pose.current;
    const m = motion.current;
    resetPose(p);
    applyIdleLife(p, now, s.reducedMotion ? 0.2 : 1);

    switch (a.kind) {
      case 'groom': {
        // front legs sweep over the head and draw the antennae through the antenna cleaners
        const k = Math.sin(now * TAU * 1.5);
        for (const id of ['L1', 'R1'] as const) {
          const l = p.legs[id];
          const o = id === 'L1' ? k : -k;
          l.pro = lerp(l.pro, 0.6 + 0.12 * o, w);
          l.elev = lerp(l.elev, 1.35 + 0.22 * o, w);
          l.knee = lerp(l.knee, 2.0 + 0.25 * o, w);
          l.ankle = lerp(l.ankle, 0.6, w);
        }
        p.headPitch += 0.28 * w;
        p.headYaw += 0.1 * k * w;
        p.antR[1] += (0.5 + 0.3 * k) * w;
        p.antL[1] += (0.5 - 0.3 * k) * w;
        p.bodyPitch += 0.06 * w;
        break;
      }
      case 'shift': {
        // lift one leg and set it down again, with a small body adjustment
        const l = p.legs[a.leg];
        const lift = Math.sin(Math.PI * u);
        l.elev += 0.55 * lift * w;
        l.knee -= 0.25 * lift * w;
        l.pro += 0.18 * a.side * lift * w;
        p.abdRoll += 0.04 * a.side * lift * w;
        break;
      }
      case 'flap': {
        // brief wing fanning: wings unfold, couple and beat, then fold back
        p.wingFold = 1 - w;
        m.wing += dt * 3.2 * w;
        p.wingAmp = 1.25;
        p.bodyPitch += 0.05 * w;
        p.abdPitch -= 0.06 * w;
        break;
      }
      case 'walk':
      case 'turn': {
        const walking = a.kind === 'walk';
        // steer back towards the centre when wandering too far
        const dist = Math.hypot(m.x, m.z);
        const toCentre = Math.atan2(-m.x, -m.z);
        let diff = toCentre - m.yaw;
        diff = Math.atan2(Math.sin(diff), Math.cos(diff));
        const target = walking ? (dist > WANDER_RADIUS * 0.6 ? clamp(diff * 1.2, -0.8, 0.8) : 0.25 * a.side) : 0.7 * a.side;
        m.turnRate = lerp(m.turnRate, target, Math.min(1, dt * 3));
        m.yaw += m.turnRate * w * dt;
        const speed = walking ? 0.42 : 0.04;
        m.x += Math.sin(m.yaw) * speed * w * dt;
        m.z += Math.cos(m.yaw) * speed * w * dt;
        m.gait += dt * (walking ? 2.4 : 1.8) * w;
        applyGait(p, m.gait, w, walking ? 0.28 : 0.16);
        p.pos.y += Math.abs(Math.sin(m.gait * TAU)) * 0.012 * w; // slight bob
        p.antR[1] -= 0.12 * w;
        p.antL[1] -= 0.12 * w;
        break;
      }
    }
    // hard limit so the bee never leaves the frame
    const d = Math.hypot(m.x, m.z);
    if (d > WANDER_RADIUS) {
      m.x *= WANDER_RADIUS / d;
      m.z *= WANDER_RADIUS / d;
    }
    p.pos.x = m.x;
    p.pos.z = m.z;
    quatFromYawPitchRoll(m.yaw, 0, 0, p.quat);
    p.wingPhase = m.wing;

    sting.current += ((s.showStinger ? 1 : 0) - sting.current) * Math.min(1, dt * 4);
    p.stinger = sting.current;
    ambience?.setWingBuzz(a.kind === 'flap' ? w : 0);

    const r = rig.current;
    if (!r) return;
    r.apply(p);
    r.root.updateMatrixWorld();
    runtime.beeWorld.setFromMatrixPosition(r.root.matrixWorld);
    r.root.getWorldQuaternion(runtime.beeQuat);
  });

  return BEE_MODEL_URL ? <GltfBeeModel url={BEE_MODEL_URL} onRig={onRig} /> : <BeeModel lod={lod} ghosts={1} interactive onRig={onRig} />;
}
