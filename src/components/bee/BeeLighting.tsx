'use client';

import { Environment, Lightformer } from '@react-three/drei';

/**
 * Bright, even studio lighting for a white "specimen card" look: a soft warm key,
 * a high fill so dark cuticle still reads, and a rim that separates the hairs.
 */
export function BeeLighting({ shadows }: { shadows: boolean }) {
  return (
    <>
      <hemisphereLight args={['#ffffff', '#e8e2d8', 0.9]} />
      <directionalLight
        position={[4, 7, 5]}
        intensity={2.6}
        color="#fff6ea"
        castShadow={shadows}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />
      <directionalLight position={[-5, 3, -5]} intensity={1.8} color="#ffe2b8" />
      <directionalLight position={[6, 1, -4]} intensity={1.0} color="#e6eeff" />
      <directionalLight position={[-3, -4, 4]} intensity={0.6} />
      {/* image-based reflections built from light-formers — no network HDR needed */}
      <Environment resolution={256} frames={1}>
        <color attach="background" args={['#f4f2ee']} />
        <Lightformer form="rect" intensity={2} color="#ffffff" position={[0, 5, 4]} scale={[8, 3, 1]} />
        <Lightformer form="rect" intensity={1.2} color="#fff1dc" position={[-6, 1, -3]} rotation-y={Math.PI / 2} scale={[6, 2, 1]} />
        <Lightformer form="rect" intensity={1} color="#eef3ff" position={[6, 2, -3]} rotation-y={-Math.PI / 2} scale={[6, 2, 1]} />
        <Lightformer form="ring" intensity={1} color="#ffffff" position={[0, 2, 8]} scale={2.5} />
      </Environment>
    </>
  );
}
