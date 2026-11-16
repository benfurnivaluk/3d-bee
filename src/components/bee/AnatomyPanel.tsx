'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ANATOMY, ANATOMY_BY_ID } from '@/data/beeAnatomy';
import { useBeeStore } from '@/store/beeExplorerStore';
import { IconChevron, IconClose } from './ui/Icons';

const REVIEW_LABEL = {
  'literature-checked': 'Content checked against literature',
  'needs-expert-review': 'Awaiting expert review',
  'simplified-visual': 'Simplified visual',
} as const;

/** Compact list of selectable structures (desktop). */
export function AnatomyList() {
  const selected = useBeeStore((s) => s.selected);
  const select = useBeeStore((s) => s.select);
  return (
    <nav aria-label="Anatomical structures" className="panel hidden w-56 p-2 lg:block">
      <p className="px-3 pb-2 pt-2 text-[11px] uppercase tracking-[0.18em] text-ink-700/50">Anatomy</p>
      <ul className="max-h-[calc(100vh-9rem)] overflow-y-auto">
        {ANATOMY.map((a, i) => (
          <li key={a.id}>
            <button
              type="button"
              onClick={() => select(a.id, true)}
              aria-current={selected === a.id}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-[5px] text-left text-[13px] leading-tight transition ${
                selected === a.id ? 'bg-honey-100 text-honey-700' : 'text-ink-800/80 hover:bg-black/[0.04] hover:text-ink-950'
              }`}
            >
              <span className="w-5 font-mono text-[10px] text-ink-700/40">{String(i + 1).padStart(2, '0')}</span>
              {a.name}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Mobile: horizontal chips of structures. */
export function AnatomyChips() {
  const selected = useBeeStore((s) => s.selected);
  const select = useBeeStore((s) => s.select);
  return (
    <div className="chip-row lg:hidden" role="list" aria-label="Anatomical structures">
      {ANATOMY.map((a) => (
        <button key={a.id} role="listitem" type="button" onClick={() => select(a.id, true)} className={`chip ${selected === a.id ? 'chip-active' : ''}`}>
          {a.name}
        </button>
      ))}
    </div>
  );
}

/**
 * Compact pop-out card that slides in from the right-hand edge. A tab on its edge tucks it
 * away (leaving just the tab) so the bee can be studied unobstructed.
 */
export function AnatomyPanel() {
  const selected = useBeeStore((s) => s.selected);
  const select = useBeeStore((s) => s.select);
  const showStinger = useBeeStore((s) => s.showStinger);
  const setShowStinger = useBeeStore((s) => s.setShowStinger);
  const reducedMotion = useBeeStore((s) => s.reducedMotion);
  const ref = useRef<HTMLElement>(null);
  const tucked = useBeeStore((s) => s.detailsTucked);
  const setTucked = useBeeStore((s) => s.setDetailsTucked);
  const entry = selected ? ANATOMY_BY_ID[selected] : null;

  // slide in whenever a new structure is chosen
  useEffect(() => {
    const el = ref.current;
    if (!el || !entry) return;
    // phones: the details are a drawer that rises from the bottom; larger screens: a card from the right
    const mobile = window.matchMedia('(max-width: 639px)').matches;
    gsap.fromTo(
      el,
      { xPercent: mobile ? 0 : 100, yPercent: mobile ? 100 : -50, y: 0 },
      { xPercent: 0, yPercent: mobile ? 0 : -50, duration: reducedMotion ? 0 : 0.5, ease: 'power3.out' },
    );
    return () => {
      gsap.killTweensOf(el);
    };
  }, [entry, reducedMotion]);

  const tuck = (t: boolean) => {
    setTucked(t);
    if (ref.current) {
      const mobile = window.matchMedia('(max-width: 639px)').matches;
      gsap.to(ref.current, {
        xPercent: mobile ? 0 : t ? 100 : 0,
        y: mobile && t ? Math.max(0, ref.current.offsetHeight - 48) : 0,
        duration: reducedMotion ? 0 : 0.4,
        ease: 'power3.inOut',
      });
    }
  };
  // closing slides the card out; deselecting returns the camera to the full view (see store)
  const close = () => {
    if (!ref.current) return select(null);
    const mobile = window.matchMedia('(max-width: 639px)').matches;
    gsap.to(ref.current, {
      xPercent: mobile ? 0 : 100,
      yPercent: mobile ? 100 : -50,
      duration: reducedMotion ? 0 : 0.3,
      ease: 'power2.in',
      onComplete: () => select(null),
    });
  };

  if (!entry) return null;
  const idx = ANATOMY.findIndex((a) => a.id === entry.id);

  return (
    <aside
      ref={ref}
      aria-live="polite"
      aria-label={`${entry.name} details`}
      data-tucked={tucked}
      className="popout pointer-events-auto absolute right-0 top-1/2 w-[17rem] max-w-[82vw] -translate-y-1/2"
    >
      {/* edge tab: tuck away / bring back */}
      <button
        type="button"
        onClick={() => tuck(!tucked)}
        aria-expanded={!tucked}
        aria-label={tucked ? `Show ${entry.name} details` : 'Tuck details away'}
        className="popout-tab"
      >
        <IconChevron width={14} height={14} className={tucked ? 'rotate-180' : ''} />
        <span className="font-mono text-[10px]">{String(idx + 1).padStart(2, '0')}</span>
      </button>

      <div className="bee-details-content max-h-[70vh] overflow-y-auto p-4" inert={tucked || undefined}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-mono text-[9.5px] uppercase tracking-[0.18em] text-honey-600">{entry.subject}</p>
            <h2 className="mt-0.5 font-serif text-[19px] leading-tight text-ink-950">{entry.name}</h2>
            <p className="text-[12px] italic text-ink-700/60">{entry.scientific}</p>
          </div>
          <button type="button" className="icon-btn h-7 w-7 shrink-0" aria-label="Close details" onClick={() => close()}>
            <IconClose width={14} height={14} />
          </button>
        </div>
        <p className="mt-2.5 text-[13px] leading-relaxed text-ink-800/85">{entry.purpose}</p>
        <div className="mt-3 rounded-lg border border-honey-300/60 bg-honey-50 px-3 py-2">
          <p className="text-[10px] uppercase tracking-[0.16em] text-honey-600">Did you know?</p>
          <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink-800/85">{entry.fact}</p>
        </div>
        {entry.id === 'stinger' && (
          <label className="mt-3 flex cursor-pointer items-center gap-2.5 text-[12.5px] text-ink-800/85">
            <input type="checkbox" className="toggle" checked={showStinger} onChange={(e) => setShowStinger(e.target.checked)} />
            Show sting (normally hidden)
          </label>
        )}
        <p className="mt-3 text-[10.5px] text-ink-700/55" title={entry.modelNote ? `Model note: ${entry.modelNote}` : undefined}>
          {REVIEW_LABEL[entry.review]}
        </p>
      </div>
    </aside>
  );
}
