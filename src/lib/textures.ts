import * as THREE from 'three';
import { mulberry32 } from './math';

/**
 * Procedural textures for the TEMPORARY model. In production these are replaced by
 * the 4K baked maps listed in docs/ASSET_SPEC.md.
 */

const canvas = (w: number, h: number) => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
};

/** Convert a greyscale height array to a tangent-space normal map. */
function heightToNormal(height: Float32Array, w: number, h: number, strength: number) {
  const c = canvas(w, h);
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(w, h);
  const at = (x: number, y: number) => height[((y + h) % h) * w + ((x + w) % w)];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength;
      const dy = (at(x, y + 1) - at(x, y - 1)) * strength;
      const inv = 1 / Math.hypot(dx, dy, 1);
      const i = (y * w + x) * 4;
      img.data[i] = (-dx * inv * 0.5 + 0.5) * 255;
      img.data[i + 1] = (dy * inv * 0.5 + 0.5) * 255;
      img.data[i + 2] = (inv * 0.5 + 0.5) * 255;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.NoColorSpace;
  t.anisotropy = 4;
  return t;
}

let cuticleCache: THREE.Texture | null = null;
/** Fine punctate cuticle micro-relief (setae sockets, pits, micro-sculpture). */
export function cuticleNormal(): THREE.Texture {
  if (cuticleCache) return cuticleCache;
  const w = 256,
    h = 256;
  const rnd = mulberry32(7);
  const H = new Float32Array(w * h);
  // value-noise micro sculpture
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      H[y * w + x] =
        Math.sin(x * 0.21 + Math.sin(y * 0.13) * 2) * 0.15 + Math.sin(y * 0.27 + Math.sin(x * 0.11) * 3) * 0.15;
    }
  // pits / setal sockets
  for (let k = 0; k < 900; k++) {
    const cx = rnd() * w,
      cy = rnd() * h,
      r = 1.2 + rnd() * 2.2;
    for (let y = -4; y <= 4; y++)
      for (let x = -4; x <= 4; x++) {
        const d = Math.hypot(x, y) / r;
        if (d < 1) {
          const px = Math.floor(cx + x + w) % w,
            py = Math.floor(cy + y + h) % h;
          H[py * w + px] -= (1 - d * d) * 1.2;
        }
      }
  }
  cuticleCache = heightToNormal(H, w, h, 1.4);
  cuticleCache.repeat.set(6, 6);
  return cuticleCache;
}

let eyeCache: THREE.Texture | null = null;
/** Hexagonal ommatidial facets as a normal map. */
export function eyeFacetNormal(): THREE.Texture {
  if (eyeCache) return eyeCache;
  const w = 512,
    h = 512;
  const n = 32,
    m = 36;
  const dx = w / n,
    dy = h / m;
  const H = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const row = Math.round(y / dy);
      let best = 1e9;
      for (let rj = row - 1; rj <= row + 1; rj++) {
        const off = (((rj % m) + m) % 2) * dx * 0.5;
        const col = Math.round((x - off) / dx);
        for (let ci = col - 1; ci <= col + 1; ci++) {
          const px = ci * dx + off,
            py = rj * dy;
          const d = Math.hypot(x - px, y - py);
          if (d < best) best = d;
        }
      }
      const r = best / (dx * 0.58);
      H[y * w + x] = Math.sqrt(Math.max(0, 1 - r * r));
    }
  }
  eyeCache = heightToNormal(H, w, h, 3.2);
  eyeCache.repeat.set(5, 5);
  return eyeCache;
}

export type WingKind = 'fore' | 'hind';

/** Wing outlines in normalised (u = span 0..1, v = chord 0 trailing .. 1 leading). */
export const WING_OUTLINES: Record<WingKind, [number, number][]> = {
  fore: [
    [0.0, 0.6], [0.05, 0.78], [0.2, 0.9], [0.45, 0.96], [0.7, 0.97], [0.86, 0.92], [0.95, 0.8],
    [1.0, 0.62], [0.99, 0.45], [0.94, 0.3], [0.84, 0.18], [0.68, 0.1], [0.5, 0.06], [0.32, 0.08],
    [0.18, 0.16], [0.09, 0.28], [0.03, 0.4], [0.0, 0.5],
  ],
  hind: [
    [0.0, 0.62], [0.1, 0.86], [0.3, 0.95], [0.6, 0.98], [0.85, 0.93], [0.97, 0.78], [1.0, 0.62],
    [0.96, 0.42], [0.82, 0.26], [0.62, 0.15], [0.42, 0.12], [0.27, 0.15], [0.2, 0.24], [0.15, 0.13],
    [0.07, 0.12], [0.01, 0.32],
  ],
};

/**
 * Approximate Apis mellifera venation (normalised wing space). Each entry is a polyline.
 * NEEDS EXPERT REVIEW against a cleared wing specimen before publication.
 */
const VEINS: Record<WingKind, { w: number; pts: [number, number][] }[]> = {
  fore: [
    // costa + subcosta/radius along leading edge
    { w: 5, pts: [[0, 0.62], [0.05, 0.79], [0.2, 0.9], [0.45, 0.955], [0.55, 0.96]] },
    { w: 4, pts: [[0.02, 0.6], [0.2, 0.82], [0.42, 0.88], [0.52, 0.9]] },
    // pterostigma (small in Apis)
    { w: 7, pts: [[0.47, 0.93], [0.54, 0.94]] },
    // marginal (radial) cell — long and narrow, closed near the tip
    { w: 3, pts: [[0.54, 0.95], [0.7, 0.96], [0.84, 0.92], [0.88, 0.86]] },
    { w: 3, pts: [[0.52, 0.9], [0.62, 0.86], [0.74, 0.84], [0.88, 0.86]] },
    // Rs + submarginal cells (three) — lower boundary
    { w: 3, pts: [[0.42, 0.84], [0.48, 0.72], [0.58, 0.66], [0.68, 0.64], [0.79, 0.67], [0.84, 0.76], [0.86, 0.85]] },
    // cross veins between submarginal cells
    { w: 2.5, pts: [[0.48, 0.88], [0.48, 0.72]] },
    { w: 2.5, pts: [[0.6, 0.86], [0.58, 0.66]] },
    { w: 2.5, pts: [[0.71, 0.84], [0.68, 0.64]] },
    // media
    { w: 3.5, pts: [[0.02, 0.55], [0.2, 0.6], [0.36, 0.64], [0.42, 0.66], [0.48, 0.72]] },
    { w: 3, pts: [[0.42, 0.66], [0.5, 0.56], [0.6, 0.48], [0.72, 0.4], [0.82, 0.34]] },
    // cubitus and discoidal cells
    { w: 3.5, pts: [[0.02, 0.48], [0.18, 0.46], [0.32, 0.46], [0.4, 0.45]] },
    { w: 3, pts: [[0.32, 0.46], [0.36, 0.56], [0.36, 0.64]] },
    { w: 3, pts: [[0.4, 0.45], [0.5, 0.56]] },
    { w: 3, pts: [[0.4, 0.45], [0.48, 0.34], [0.58, 0.26], [0.68, 0.2]] },
    { w: 2.5, pts: [[0.48, 0.34], [0.6, 0.48]] },
    { w: 2.5, pts: [[0.58, 0.26], [0.66, 0.4], [0.72, 0.4]] },
    // anal veins
    { w: 3, pts: [[0.02, 0.42], [0.12, 0.34], [0.26, 0.3], [0.34, 0.28]] },
    { w: 2.5, pts: [[0.26, 0.3], [0.32, 0.46]] },
    { w: 2, pts: [[0.03, 0.38], [0.1, 0.22], [0.18, 0.17]] },
  ],
  hind: [
    { w: 4, pts: [[0, 0.62], [0.1, 0.84], [0.3, 0.93], [0.5, 0.96]] },
    { w: 3, pts: [[0.02, 0.58], [0.2, 0.78], [0.36, 0.84], [0.5, 0.86], [0.6, 0.86]] },
    { w: 2.5, pts: [[0.36, 0.84], [0.42, 0.7], [0.56, 0.62], [0.72, 0.56]] },
    { w: 3, pts: [[0.02, 0.5], [0.2, 0.55], [0.32, 0.6], [0.42, 0.7]] },
    { w: 2.5, pts: [[0.32, 0.6], [0.4, 0.46], [0.52, 0.36], [0.62, 0.3]] },
    { w: 2.5, pts: [[0.02, 0.4], [0.14, 0.36], [0.24, 0.3]] },
    { w: 2, pts: [[0.03, 0.34], [0.1, 0.18]] },
  ],
};

const wingTexCache: Partial<Record<WingKind, { map: THREE.Texture; alpha: THREE.Texture }>> = {};

/** Colour + alpha maps for a wing: pale membrane with microtrichia, brown veins. */
export function wingTextures(kind: WingKind) {
  const cached = wingTexCache[kind];
  if (cached) return cached;
  const W = 1024,
    Hh = 512;
  const col = canvas(W, Hh);
  const alp = canvas(W, Hh);
  const c = col.getContext('2d')!;
  const a = alp.getContext('2d')!;
  const rnd = mulberry32(kind === 'fore' ? 11 : 23);
  const toPx = ([u, v]: [number, number]) => [u * W, (1 - v) * Hh] as const;

  // membrane
  c.fillStyle = '#a9a294';
  c.fillRect(0, 0, W, Hh);
  a.fillStyle = 'rgb(92,92,92)';
  a.fillRect(0, 0, W, Hh);
  // microtrichia / membrane wrinkles
  for (let i = 0; i < 9000; i++) {
    const x = rnd() * W,
      y = rnd() * Hh;
    a.fillStyle = `rgba(255,255,255,${0.03 + rnd() * 0.05})`;
    a.fillRect(x, y, 1, 1);
  }
  for (let i = 0; i < 40; i++) {
    a.strokeStyle = 'rgba(255,255,255,0.025)';
    a.lineWidth = 6;
    a.beginPath();
    const y0 = rnd() * Hh;
    a.moveTo(W * 0.55, y0);
    a.bezierCurveTo(W * 0.7, y0 + 30, W * 0.85, y0 - 20, W, y0 + 10);
    a.stroke();
  }
  // margin darkening
  const outline = WING_OUTLINES[kind];
  a.strokeStyle = 'rgba(255,255,255,0.35)';
  a.lineWidth = 3;
  a.beginPath();
  outline.forEach((p, i) => {
    const [x, y] = toPx(p);
    if (i) a.lineTo(x, y);
    else a.moveTo(x, y);
  });
  a.closePath();
  a.stroke();

  for (const vein of VEINS[kind]) {
    for (const [ctx, style] of [
      [c, '#2f1c0c'],
      [a, '#f2f2f2'],
    ] as const) {
      ctx.strokeStyle = style;
      ctx.lineWidth = vein.w * 1.9;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      vein.pts.forEach((p, i) => {
        const [x, y] = toPx(p);
        if (i) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
      });
      ctx.stroke();
    }
  }
  const map = new THREE.CanvasTexture(col);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;
  const alpha = new THREE.CanvasTexture(alp);
  alpha.anisotropy = 8;
  const res = { map, alpha };
  wingTexCache[kind] = res;
  return res;
}
