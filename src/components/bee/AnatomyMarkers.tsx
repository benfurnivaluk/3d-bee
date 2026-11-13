'use client';

import { Fragment, useEffect, useRef, useState } from 'react';
import { createPortal, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { ANATOMY } from '@/data/beeAnatomy';
import { runtime } from '@/lib/runtime';
import { useBeeStore } from '@/store/beeExplorerStore';
import type { AnatomyId } from '@/types/bee';
import type { BeeRig } from '@/lib/beeRig';

/**
 * Markers are portalled INTO each anatomy anchor (an Object3D inside the rig), so they
 * inherit every joint transform and stay attached while the bee moves and animates.
 */
export function AnatomyMarkers() {
  const selected = useBeeStore((s) => s.selected);
  const [rig, setRig] = useState<BeeRig | null>(null);
  const refs = useRef<Partial<Record<AnatomyId, HTMLButtonElement | null>>>({});

  useEffect(() => {
    // the rig is rebuilt when the quality level changes; re-portal into the new anchors
    const id = window.setInterval(() => {
      setRig((cur) => (cur !== runtime.mainRig ? runtime.mainRig : cur));
    }, 150);
    return () => window.clearInterval(id);
  }, []);

  const tmp = useRef(new THREE.Vector3());
  const camDir = useRef(new THREE.Vector3());
  useFrame(({ camera }) => {
    if (!runtime.mainRig) return;
    // dim markers on the far side of the bee
    const beeDist = camera.position.distanceTo(runtime.beeWorld);
    camera.getWorldDirection(camDir.current);
    for (const a of ANATOMY) {
      const el = refs.current[a.id];
      if (!el) continue;
      runtime.mainRig.anchors[a.id].getWorldPosition(tmp.current);
      const d = camera.position.distanceTo(tmp.current);
      const behind = d > beeDist + 0.15;
      el.dataset.behind = behind ? '1' : '0';
    }
  });

  if (!rig) return null;

  return (
    <>
      {ANATOMY.map((a, i) => (
        <Fragment key={a.id}>
          {createPortal(
          <Html center zIndexRange={[20, 10]} style={{ pointerEvents: 'none' }}>
            <button
              ref={(el) => {
                refs.current[a.id] = el;
              }}
              type="button"
              aria-label={`${a.name} — show details`}
              aria-pressed={selected === a.id}
              onClick={(e) => {
                e.stopPropagation();
                useBeeStore.getState().select(a.id, true);
              }}
              className={`marker group pointer-events-auto ${selected === a.id ? 'marker-active' : ''}`}
            >
              <span className="marker-dot" />
              <span className="marker-label">
                <span className="marker-num">{String(i + 1).padStart(2, '0')}</span>
                {a.name}
              </span>
            </button>
          </Html>,
          rig.anchors[a.id],
          )}
        </Fragment>
      ))}
    </>
  );
}
