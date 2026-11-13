'use client';

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { AdaptiveDpr, PerformanceMonitor } from '@react-three/drei';
import * as THREE from 'three';
import { BeeAnimator } from './BeeAnimator';
import { BeeCamera } from './BeeCamera';
import { BeeLighting } from './BeeLighting';
import { AnatomyMarkers } from './AnatomyMarkers';
import { qualityLevel, useBeeStore } from '@/store/beeExplorerStore';
import type { QualityLevel } from '@/types/bee';

const QUALITY = {
  high: { dpr: [1, 2] as [number, number], lod: 'high' as const, shadows: true },
  medium: { dpr: [1, 1.5] as [number, number], lod: 'medium' as const, shadows: false },
  low: { dpr: [0.75, 1] as [number, number], lod: 'low' as const, shadows: false },
};

export const BACKGROUND = '#ffffff';

export function Scene() {
  const quality = useBeeStore((s) => qualityLevel(s));
  const setAutoLevel = useBeeStore((s) => s.setAutoLevel);
  const setLoaded = useBeeStore((s) => s.setLoaded);
  const auto = useBeeStore((s) => s.quality === 'auto');
  const q = QUALITY[quality];

  const step = (dir: -1 | 1) => {
    if (!auto) return;
    const order: QualityLevel[] = ['low', 'medium', 'high'];
    const cur = order.indexOf(useBeeStore.getState().autoLevel);
    const next = order[Math.max(0, Math.min(2, cur + dir))];
    if (next !== order[cur]) setAutoLevel(next);
  };

  return (
    <Canvas
      shadows={q.shadows}
      dpr={q.dpr}
      camera={{ position: [3.3, 1.3, 3.5], fov: 38, near: 0.05, far: 100 }}
      gl={{ antialias: quality !== 'low', powerPreference: 'high-performance', alpha: false }}
      onCreated={({ gl, scene }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.0;
        scene.background = new THREE.Color(BACKGROUND);
        setLoaded(true);
      }}
      aria-label="Interactive 3D honey bee"
      role="img"
    >
      <PerformanceMonitor ms={500} iterations={12} bounds={() => [30, 58]} onDecline={() => step(-1)} onIncline={() => step(1)} flipflops={2} />
      <AdaptiveDpr pixelated={false} />
      <Suspense fallback={null}>
        <BeeLighting shadows={q.shadows} />
        <BeeAnimator key={quality} lod={q.lod} />
        <AnatomyMarkers />
      </Suspense>
      <BeeCamera />
    </Canvas>
  );
}
