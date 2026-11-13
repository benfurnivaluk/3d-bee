'use client';

import { ANATOMY } from '@/data/beeAnatomy';
import { useBeeStore } from '@/store/beeExplorerStore';
import { Dialog } from './Dialog';

/** Full text alternative to the 3D view. */
export function TextContent() {
  return (
    <section aria-labelledby="tv-anatomy" className="text-[14px] leading-relaxed text-ink-800/85">
      <h3 id="tv-anatomy" className="mb-3 font-serif text-xl text-honey-600">
        Anatomy of a worker honey bee (Apis mellifera)
      </h3>
      <dl className="space-y-4">
        {ANATOMY.map((a) => (
          <div key={a.id}>
            <dt className="text-ink-950">
              <b>{a.name}</b> <i className="text-ink-700/60">— {a.scientific}</i>
            </dt>
            <dd>
              {a.purpose} <span className="text-ink-700/70">{a.fact}</span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function TextView() {
  const setTextView = useBeeStore((s) => s.setTextView);
  return (
    <Dialog title="Text view" wide onClose={() => setTextView(false)}>
      <TextContent />
    </Dialog>
  );
}
