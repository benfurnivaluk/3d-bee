'use client';

import { useEffect, useState } from 'react';
import { useBeeStore } from '@/store/beeExplorerStore';
import type { QualitySetting } from '@/types/bee';
import { AnatomyChips, AnatomyList, AnatomyPanel } from './AnatomyPanel';
import { TextView } from './ui/TextView';
import { IconExit, IconFullscreen, IconReset, IconSoundOff, IconSoundOn, IconTags, IconText } from './ui/Icons';
import { ambience } from '@/lib/ambience';
import { Logo } from './ui/Logo';

export const BEERADAR_URL = process.env.NEXT_PUBLIC_BEERADAR_URL || 'https://beeradar.co.uk';

function Brand() {
  return (
    <div className="pointer-events-auto flex items-center gap-3">
      <a href={BEERADAR_URL} className="flex items-center rounded-lg" aria-label="BeeRadar home">
        <Logo height={24} />
      </a>
      <span className="hidden h-7 w-px bg-black/10 md:block" />
      <p className="hidden text-[12.5px] leading-tight text-ink-700/70 md:block">
        The Honey Bee
        <br />
        <span className="text-ink-700/50">Explore its anatomy</span>
      </p>
    </div>
  );
}

function TopControls() {
  const quality = useBeeStore((s) => s.quality);
  const autoLevel = useBeeStore((s) => s.autoLevel);
  const soundOn = useBeeStore((s) => s.soundOn);
  const { setTextView, requestCamera, setQuality, select, toggleSound } = useBeeStore.getState();

  // background ambience follows the toggle and pauses while the tab is hidden
  useEffect(() => {
    void ambience?.setEnabled(soundOn);
  }, [soundOn]);
  useEffect(() => {
    const vis = () => ambience?.setHidden(document.hidden);
    document.addEventListener('visibilitychange', vis);
    return () => document.removeEventListener('visibilitychange', vis);
  }, []);
  const [fs, setFs] = useState(false);
  useEffect(() => {
    const on = () => setFs(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', on);
    return () => document.removeEventListener('fullscreenchange', on);
  }, []);
  return (
    <div className="pointer-events-auto flex items-center gap-1.5">
      <label className="sr-only" htmlFor="quality">
        Graphics quality
      </label>
      <select id="quality" value={quality} onChange={(e) => setQuality(e.target.value as QualitySetting)} className="select hidden sm:block" title="Graphics quality">
        <option value="auto">Auto ({autoLevel})</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>
      <button type="button" className="icon-btn" aria-label="Text view" title="Text view" onClick={() => setTextView(true)}>
        <IconText />
      </button>
      <button
        type="button"
        className="icon-btn hidden sm:grid"
        aria-label={fs ? 'Exit fullscreen' : 'Enter fullscreen'}
        title="Fullscreen"
        onClick={() => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.())}
      >
        <IconFullscreen />
      </button>
      <button
        type="button"
        className={`icon-btn ${soundOn ? 'border-honey-400 text-honey-600' : ''}`}
        aria-label={soundOn ? 'Mute background sound' : 'Play background sound'}
        aria-pressed={soundOn}
        title={soundOn ? 'Sound on' : 'Sound off'}
        onClick={toggleSound}
      >
        {soundOn ? <IconSoundOn /> : <IconSoundOff />}
      </button>
      <button
        type="button"
        className="icon-btn"
        aria-label="Reset view"
        title="Reset view (R)"
        onClick={() => {
          select(null); // also resets the camera when something was selected
          requestCamera('reset', 'full');
        }}
      >
        <IconReset />
      </button>
      <a href={BEERADAR_URL} className="icon-btn" aria-label="Back to BeeRadar" title="Back to BeeRadar">
        <IconExit />
      </a>
    </div>
  );
}

function Hints() {
  const [show, setShow] = useState(true);
  useEffect(() => {
    const t = window.setTimeout(() => setShow(false), 9000);
    return () => window.clearTimeout(t);
  }, []);
  return (
    <div className={`pointer-events-none hidden text-[11.5px] text-ink-700/55 transition-opacity duration-700 md:block ${show ? 'opacity-100' : 'opacity-0'}`} aria-hidden={!show}>
      <p>Drag to rotate · Scroll or pinch to zoom · Right-drag to pan</p>
      <p>Click a marker or body part to learn about it · Arrow keys orbit · R resets</p>
    </div>
  );
}

export function ExplorerUI() {
  const textViewOpen = useBeeStore((s) => s.textViewOpen);
  const labelsOn = useBeeStore((s) => s.labelsOn);
  const toggleLabels = useBeeStore((s) => s.toggleLabels);

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col">
      <header className="flex items-start justify-between gap-3 p-4 sm:p-5">
        <Brand />
        <TopControls />
      </header>
      <button type="button" className="btn-ghost bee-label-toggle pointer-events-auto" aria-pressed={labelsOn} onClick={toggleLabels}>
        <IconTags width={16} height={16} /> {labelsOn ? 'Hide labels' : 'Show labels'}
      </button>

      <div className="relative flex min-h-0 flex-1 items-start justify-between gap-4 px-4 sm:px-5">
        <div className="pointer-events-auto">
          <AnatomyList />
        </div>
      </div>

      {/* details pop out from the right-hand edge */}
      <AnatomyPanel />

      <footer className="flex flex-col gap-2 p-3 sm:p-5">
        <div className="pointer-events-auto">
          <AnatomyChips />
        </div>
        <div className="flex items-end justify-between gap-3">
          <Hints />
        </div>
      </footer>

      {textViewOpen && <TextView />}
    </div>
  );
}
