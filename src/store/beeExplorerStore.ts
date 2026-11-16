import { create } from 'zustand';
import type { AnatomyId, QualityLevel, QualitySetting } from '@/types/bee';

export interface CameraRequest {
  kind: 'reset' | 'anatomy';
  id: string;
  nonce: number;
}

export interface BeeExplorerState {
  quality: QualitySetting;
  autoLevel: QualityLevel;
  reducedMotion: boolean;
  loaded: boolean;
  textViewOpen: boolean;
  soundOn: boolean;
  labelsOn: boolean;
  detailsTucked: boolean;

  selected: AnatomyId | null;
  hovered: AnatomyId | null;
  showStinger: boolean;
  camera: CameraRequest | null;

  setQuality: (q: QualitySetting) => void;
  setAutoLevel: (q: QualityLevel) => void;
  setReducedMotion: (b: boolean) => void;
  setLoaded: (b: boolean) => void;
  setTextView: (b: boolean) => void;
  toggleSound: () => void;
  toggleLabels: () => void;
  setDetailsTucked: (tucked: boolean) => void;
  select: (id: AnatomyId | null, focus?: boolean) => void;
  setHovered: (id: AnatomyId | null) => void;
  setShowStinger: (b: boolean) => void;
  requestCamera: (kind: CameraRequest['kind'], id: string) => void;
}

export const useBeeStore = create<BeeExplorerState>((set, get) => ({
  quality: 'auto',
  autoLevel: 'high',
  reducedMotion: false,
  loaded: false,
  textViewOpen: false,
  soundOn: false, // muted until the visitor opts in (autoplay rules)
  labelsOn: false, // anatomy labels start hidden on every device
  detailsTucked: false,

  selected: null,
  hovered: null,
  showStinger: false,
  camera: null,

  setQuality: (q) => set({ quality: q }),
  setAutoLevel: (q) => set({ autoLevel: q }),
  setReducedMotion: (b) => set({ reducedMotion: b }),
  setLoaded: (b) => set({ loaded: b }),
  setTextView: (b) => set({ textViewOpen: b }),
  toggleSound: () => set({ soundOn: !get().soundOn }),
  toggleLabels: () => set({ labelsOn: !get().labelsOn }),
  setDetailsTucked: (detailsTucked) => {
    set({ detailsTucked });
    const id = get().selected;
    get().requestCamera(detailsTucked || !id ? 'reset' : 'anatomy', detailsTucked || !id ? 'full' : id);
  },
  select: (id, focus = true) => {
    const had = get().selected;
    set({ selected: id, detailsTucked: false });
    if (id && focus) get().requestCamera('anatomy', id);
    // closing the details returns the camera to the standard full view
    if (!id && had) get().requestCamera('reset', 'full');
  },
  setHovered: (id) => set({ hovered: id }),
  setShowStinger: (b) => set({ showStinger: b }),
  requestCamera: (kind, id) => set({ camera: { kind, id, nonce: Math.random() } }),
}));

export const qualityLevel = (s: Pick<BeeExplorerState, 'quality' | 'autoLevel'>): QualityLevel =>
  s.quality === 'auto' ? s.autoLevel : s.quality;
