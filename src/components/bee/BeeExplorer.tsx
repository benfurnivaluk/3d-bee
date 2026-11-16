'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useBeeStore } from '@/store/beeExplorerStore';
import { detectWebGL, initialQuality } from '@/lib/webgl';
import { ExplorerUI, BEERADAR_URL } from './ExplorerUI';
import { LoadingScreen } from './LoadingScreen';
import { TextContent } from './ui/TextView';
import { Logo } from './ui/Logo';

const Scene = dynamic(() => import('./Scene').then((m) => m.Scene), { ssr: false });

/**
 * BeeRadar Honey Bee Explorer — drop-in, full-viewport component.
 * Usage: <BeeExplorer /> inside any route (see src/app/bee-explorer/page.tsx).
 */
export default function BeeExplorer() {
  const [webgl, setWebgl] = useState<'checking' | 'ok' | 'none'>('checking');
  const setReducedMotion = useBeeStore((s) => s.setReducedMotion);
  const setAutoLevel = useBeeStore((s) => s.setAutoLevel);
  const selected = useBeeStore((s) => s.selected);
  const labelsOn = useBeeStore((s) => s.labelsOn);
  const detailsTucked = useBeeStore((s) => s.detailsTucked);

  useEffect(() => {
    useBeeStore.setState({ loaded: false, selected: null, textViewOpen: false, soundOn: false, labelsOn: false, detailsTucked: false });
    setWebgl(detectWebGL().ok ? 'ok' : 'none');
    setAutoLevel(initialQuality());
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => {
      setReducedMotion(mq.matches);
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [setReducedMotion, setAutoLevel]);

  if (webgl === 'none') {
    return (
      <main className="min-h-screen bg-white px-5 py-10 text-ink-950">
        <div className="mx-auto max-w-3xl">
          <a href={BEERADAR_URL} aria-label="BeeRadar home">
            <Logo height={28} />
          </a>
          <h1 className="mt-6 font-serif text-4xl">The Honey Bee — Explore its Anatomy</h1>
          <p className="mt-3 rounded-xl border border-honey-300 bg-honey-50 p-4 text-sm text-honey-700">
            Your browser or device could not start 3D graphics (WebGL), so the interactive model is unavailable. All of the educational content is below.
          </p>
          <div className="mt-8">
            <TextContent />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      className="bee-explorer fixed inset-0 overflow-hidden bg-white text-ink-950"
      data-selected={!!selected}
      data-details-open={!!selected && !detailsTucked}
      data-labels={labelsOn}
      aria-label="BeeRadar honey bee explorer"
    >
      <h1 className="sr-only">The Honey Bee — Explore its Anatomy</h1>
      <div className="bee-scene-frame absolute inset-0">{webgl === 'ok' && <Scene />}</div>
      <ExplorerUI />
      <LoadingScreen />
    </main>
  );
}
