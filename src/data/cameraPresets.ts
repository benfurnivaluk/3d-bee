import type { CameraPreset } from '@/types/bee';

/** Bee-local frame: +Z = head (forward), +Y = dorsal (up), +X = bee's left side. 1 unit ≈ 4.5 mm. */
export const FULL_VIEW: CameraPreset = { id: 'full', label: 'Full body', position: [3.3, 1.3, 3.5], target: [0, -0.2, -0.3] };
