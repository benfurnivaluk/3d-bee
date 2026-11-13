'use client';

import { useEffect, useRef, useState } from 'react';
import { useProgress } from '@react-three/drei';
import gsap from 'gsap';
import { useBeeStore } from '@/store/beeExplorerStore';
import { Logo } from './ui/Logo';

/** Progress indicator shown while the renderer, procedural textures and assets warm up. */
export function LoadingScreen() {
  const loaded = useBeeStore((s) => s.loaded);
  const { progress, active } = useProgress();
  const [gone, setGone] = useState(false);
  const [fake, setFake] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  // procedural textures do not report progress — show a gentle ramp until the canvas is live
  useEffect(() => {
    const id = window.setInterval(() => setFake((f) => Math.min(92, f + (100 - f) * 0.08)), 90);
    return () => window.clearInterval(id);
  }, []);

  const pct = loaded && !active ? 100 : Math.max(fake, active ? progress : 0);

  useEffect(() => {
    if (pct < 100 || !ref.current) return;
    const t = window.setTimeout(() => {
      gsap.to(ref.current, { opacity: 0, duration: 0.8, ease: 'power2.out', onComplete: () => setGone(true) });
    }, 450);
    return () => window.clearTimeout(t);
  }, [pct]);

  if (gone) return null;
  return (
    <div ref={ref} className="absolute inset-0 z-40 grid place-items-center bg-white" role="status" aria-live="polite" aria-label={`Loading, ${Math.round(pct)} percent`}>
      <div className="flex flex-col items-center gap-5">
        <Logo height={34} className="loader-pulse" />
        <p className=" text-xs uppercase tracking-[0.25em] text-ink-700/50">Preparing the specimen</p>
        <div className="h-px w-56 overflow-hidden bg-black/10">
          <div className="h-full bg-honey-400 transition-[width] duration-200" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}
