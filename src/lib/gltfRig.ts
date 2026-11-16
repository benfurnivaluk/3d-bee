/**
 * PRODUCTION ASSET ADAPTER (not yet exercised — no licensed asset is in the repo).
 *
 * Wraps a GLB that follows docs/ASSET_SPEC.md in the same BeeRig interface the
 * procedural stand-in exposes, so the rest of the app does not change:
 *   - bones/empties named as in the spec are driven by the procedural Pose, and
 *   - if the GLB contains an authored clip named after the active behaviour
 *     (e.g. "flight", "waggle"), it is sampled with AnimationMixer.setTime(t),
 *     which keeps scrubbing deterministic.
 */
import * as THREE from 'three';
import type { AnatomyId, Pose } from '@/types/bee';
import type { BeeRig } from './beeRig';
import { legIds } from './beeRig';

const ANCHOR_IDS: AnatomyId[] = [
  'compoundEyes', 'ocelli', 'antennae', 'mandibles', 'proboscis', 'thorax', 'forewings', 'hindwings',
  'hamuli', 'frontLegs', 'middleLegs', 'hindLegs', 'corbiculae', 'abdomen', 'spiracles', 'stinger',
];

export interface GltfLike {
  scene: THREE.Object3D;
  animations: THREE.AnimationClip[];
}

export function adaptGltfToRig(gltf: GltfLike): BeeRig & { mixer: THREE.AnimationMixer; playClip: (name: string | null, t: number) => boolean } {
  const root = new THREE.Group();
  root.add(gltf.scene);
  const find = (name: string) => gltf.scene.getObjectByName(name) ?? null;
  const need = (name: string) => {
    const o = find(name);
    if (!o) console.warn(`[BeeAsset] missing node "${name}" (see docs/ASSET_SPEC.md)`);
    return o ?? new THREE.Object3D();
  };
  const rest = new Map<THREE.Object3D, THREE.Euler>();
  const bone = (name: string) => {
    const b = need(name);
    rest.set(b, b.rotation.clone());
    return b;
  };
  const body = bone('thorax') as THREE.Group;
  const head = bone('head') as THREE.Group;
  const abdomen = bone('abdomen') as THREE.Group;
  const antR = [bone('antenna_R_scape'), bone('antenna_R_flagellum')];
  const antL = [bone('antenna_L_scape'), bone('antenna_L_flagellum')];
  const mand = [bone('mandible_R'), bone('mandible_L')];
  const prob = [bone('proboscis_base'), bone('proboscis_glossa')];
  const sting = bone('stinger');
  const wings = (['fore', 'hind'] as const).flatMap((k) => (['R', 'L'] as const).map((s) => ({ k, s, b: bone(`wing_${k}_${s}`) })));
  const legs = Object.fromEntries(
    legIds.map((id) => [id, ['coxa', 'femur', 'tibia', 'tarsus'].map((p) => bone(`leg_${id}_${p}`))]),
  ) as Record<string, THREE.Object3D[]>;
  const morph = (name: string) => {
    let target: { mesh: THREE.Mesh; index: number } | null = null;
    gltf.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh && m.morphTargetDictionary && name in m.morphTargetDictionary) target = { mesh: m, index: m.morphTargetDictionary[name] };
    });
    return target as { mesh: THREE.Mesh; index: number } | null;
  };
  const morphs = {
    pollen: morph('pollenLoad'),
    breathe: morph('abdomenBreathe'),
    bodyPollen: morph('bodyPollen'),
  };
  const anchors = Object.fromEntries(ANCHOR_IDS.map((id) => [id, need(`anchor_${id}`)])) as Record<AnatomyId, THREE.Object3D>;
  const proboscisTip = need('anchor_proboscisTip');

  // tag meshes for picking: meshes carry `userData.anatomy` via glTF extras
  const partMaterials: Partial<Record<AnatomyId, THREE.Material[]>> = {};
  gltf.scene.traverse((o) => {
    const m = o as THREE.Mesh;
    const id = (o.userData?.anatomy ?? null) as AnatomyId | null;
    if (m.isMesh && id) {
      const mat = (Array.isArray(m.material) ? m.material[0] : m.material).clone();
      m.material = mat;
      (partMaterials[id] ??= []).push(mat);
    }
  });

  const mixer = new THREE.AnimationMixer(gltf.scene);
  const actions = new Map(gltf.animations.map((c) => [c.name, mixer.clipAction(c)]));
  let activeClip: string | null = null;

  const rot = (b: THREE.Object3D, x = 0, y = 0, z = 0) => {
    const r = rest.get(b)!;
    b.rotation.set(r.x + x, r.y + y, r.z + z);
  };

  const apply = (pose: Pose) => {
    root.position.copy(pose.pos);
    root.quaternion.copy(pose.quat);
    if (activeClip) return; // authored clip owns the skeleton
    rot(body, -pose.bodyPitch);
    rot(head, pose.headPitch, pose.headYaw, pose.headRoll);
    rot(antR[0], pose.antR[1], pose.antR[0]);
    rot(antR[1], pose.antR[2] * 0.4);
    rot(antL[0], pose.antL[1], -pose.antL[0]);
    rot(antL[1], pose.antL[2] * 0.4);
    rot(mand[0], 0, 0, pose.mandible * 0.55);
    rot(mand[1], 0, 0, -pose.mandible * 0.55);
    rot(prob[0], pose.proboscis * -2.3);
    rot(prob[1], pose.proboscis * 2.6 + pose.glossa * 0.05);
    rot(abdomen, -pose.abdPitch, pose.abdYaw, pose.abdRoll);
    sting.position.z = -pose.stinger * 0.3;
    for (const w of wings) {
      const side = w.s === 'R' ? 1 : -1;
      const ph = pose.wingPhase * Math.PI * 2;
      const fly = 1 - pose.wingFold;
      rot(w.b, 0.8 * Math.tanh(-4 * Math.sin(ph)) * fly, side * (0.25 + (pose.wingAmp / 2) * Math.cos(ph)) * fly, 0.12 * Math.sin(2 * ph) * fly);
    }
    for (const id of legIds) {
      const [c, f, t, ta] = legs[id];
      const lp = pose.legs[id];
      const side = id.startsWith('R') ? 1 : -1;
      rot(c, 0, -lp.pro * side);
      rot(f, 0, 0, lp.elev * side);
      rot(t, 0, 0, -lp.knee * side);
      rot(ta, 0, 0, -lp.ankle * side);
    }
    if (morphs.pollen) morphs.pollen.mesh.morphTargetInfluences![morphs.pollen.index] = pose.pollenLoad;
    if (morphs.breathe) morphs.breathe.mesh.morphTargetInfluences![morphs.breathe.index] = (pose.breathe + 1) / 2;
    if (morphs.bodyPollen) morphs.bodyPollen.mesh.morphTargetInfluences![morphs.bodyPollen.index] = pose.bodyPollen;
  };

  const playClip = (name: string | null, t: number) => {
    const action = name ? actions.get(name) : undefined;
    if (!action) {
      if (activeClip) actions.get(activeClip)?.stop();
      activeClip = null;
      return false;
    }
    if (activeClip !== name) {
      if (activeClip) actions.get(activeClip)?.stop();
      action.play();
      activeClip = name;
    }
    mixer.setTime(t % action.getClip().duration);
    return true;
  };

  const black = new THREE.Color(0);
  const honey = new THREE.Color('#ffb02e'); // hover
  const red = new THREE.Color('#e3261c'); // selected
  let last: AnatomyId | null = null;

  return {
    root,
    body,
    head,
    abdomen,
    anchors,
    proboscisTip,
    partMaterials,
    apply,
    mixer,
    playClip,
    setHighlight: (id, pulse, selected = false) => {
      if (last && last !== id) for (const m of partMaterials[last] ?? []) (m as THREE.MeshStandardMaterial).emissive?.copy(black);
      last = id;
      if (id) for (const m of partMaterials[id] ?? []) {
        const s = m as THREE.MeshStandardMaterial;
        s.emissive?.copy(selected ? red : honey);
        s.emissiveIntensity = selected ? 0.55 + 0.3 * pulse : 0.18 + 0.22 * pulse;
      }
    },
    setBodyPollenVisible: (v) => {
      if (morphs.bodyPollen) morphs.bodyPollen.mesh.morphTargetInfluences![morphs.bodyPollen.index] = v;
    },
    dispose: () => mixer.stopAllAction(),
  };
}
