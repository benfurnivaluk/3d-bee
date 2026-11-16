'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { KTX2Loader } from 'three-stdlib';
import { adaptGltfToRig } from '@/lib/gltfRig';
import type * as THREE from 'three';
import { buildBeeRig, type BeeRig, type RigLod } from '@/lib/beeRig';
import { useBeeStore } from '@/store/beeExplorerStore';
import type { AnatomyId } from '@/types/bee';

interface Props {
  lod: RigLod;
  ghosts: number;
  interactive?: boolean;
  seed?: number;
  onRig?: (rig: BeeRig | null) => void;
}

/**
 * Reusable honey bee component. Renders the temporary procedural rig today; swap the
 * builder for the GLB adapter (see GltfBee.tsx) once the production asset is delivered.
 */
export function BeeModel({ lod, ghosts, interactive = false, seed = 1, onRig }: Props) {
  const rig = useMemo(() => buildBeeRig({ lod, ghosts, seed }), [lod, ghosts, seed]);
  const clickTimer = useRef<number | null>(null);

  useEffect(() => {
    onRig?.(rig);
    return () => {
      onRig?.(null);
      rig.dispose();
    };
  }, [rig, onRig]);

  useFrame(({ clock }) => {
    if (!interactive) return;
    const { selected, hovered } = useBeeStore.getState();
    rig.setHighlight(selected ?? hovered, 0.5 + 0.5 * Math.sin(clock.elapsedTime * 4), selected !== null);
  });

  const idOf = (e: ThreeEvent<PointerEvent | MouseEvent>): AnatomyId | null => {
    let o: THREE.Object3D | null = e.object;
    while (o) {
      if (o.userData.anatomy) return o.userData.anatomy as AnatomyId;
      if (o.userData.anatomy === null) return null;
      o = o.parent;
    }
    return null;
  };

  if (!interactive) return <primitive object={rig.root} />;

  return (
    <primitive
      object={rig.root}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        const id = idOf(e);
        useBeeStore.getState().setHovered(id);
        document.body.style.cursor = id ? 'pointer' : 'grab';
      }}
      onPointerOut={() => {
        useBeeStore.getState().setHovered(null);
        document.body.style.cursor = '';
      }}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        if (e.delta > 4) return; // was a drag
        const id = idOf(e);
        if (!id) return;
        // single click identifies; a double click (below) also focuses the camera
        if (clickTimer.current) window.clearTimeout(clickTimer.current);
        clickTimer.current = window.setTimeout(() => useBeeStore.getState().select(id, false), 220);
      }}
      onDoubleClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        if (clickTimer.current) window.clearTimeout(clickTimer.current);
        const id = idOf(e);
        if (!id) return;
        useBeeStore.getState().select(id, true);
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Production asset path — enabled with NEXT_PUBLIC_BEE_MODEL_URL       */
/* ------------------------------------------------------------------ */

export const BEE_MODEL_URL = process.env.NEXT_PUBLIC_BEE_MODEL_URL || '';

/**
 * Loads the licensed GLB (Draco + Meshopt geometry, KTX2 textures) and exposes it through
 * the same BeeRig interface. An authored `idle` clip, if present, takes precedence over the
 * procedural rest pose. Untested until the asset is delivered — see docs/ASSET_SPEC.md.
 */
export function GltfBeeModel({ url, onRig }: { url: string; onRig?: (rig: BeeRig | null) => void }) {
  const gl = useThree((s) => s.gl);
  const gltf = useGLTF(url, true, true, (loader) => {
    const ktx2 = new KTX2Loader().setTranscoderPath('https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/libs/basis/').detectSupport(gl);
    // three-stdlib and three types differ slightly; the runtime objects are compatible
    (loader as unknown as { setKTX2Loader: (l: unknown) => void }).setKTX2Loader(ktx2);
  });
  const rig = useMemo(() => adaptGltfToRig(gltf), [gltf]);
  useEffect(() => {
    onRig?.(rig);
    return () => onRig?.(null);
  }, [rig, onRig]);
  useFrame(({ clock }) => {
    const s = useBeeStore.getState();
    rig.playClip('idle', clock.elapsedTime); // authored idle clip, if the asset has one
    rig.setHighlight(s.selected ?? s.hovered, 0.5 + 0.5 * Math.sin(clock.elapsedTime * 4), s.selected !== null);
  });
  return <primitive object={rig.root} />;
}
