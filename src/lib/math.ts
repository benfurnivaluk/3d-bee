export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (t: number) => {
  const x = clamp(t);
  return x * x * (3 - 2 * x);
};
export const smoother = (t: number) => {
  const x = clamp(t);
  return x * x * x * (x * (x * 6 - 15) + 10);
};
/** 0→1 as t goes from a to b, smoothed */
export const ramp = (t: number, a: number, b: number) => smooth((t - a) / (b - a));
/** 0→1→0 window: rises over [a,b], holds, falls over [c,d] */
export const windowed = (t: number, a: number, b: number, c: number, d: number) =>
  ramp(t, a, b) * (1 - ramp(t, c, d));
export const TAU = Math.PI * 2;
export const deg = (d: number) => (d * Math.PI) / 180;

/** Deterministic hash noise so every pose is a pure function of time (scrubbing-safe). */
export const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
export const noise1 = (x: number) => {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  return lerp(hash(i), hash(i + 1), u) * 2 - 1;
};
/** smooth fractal noise in [-1,1] */
export const fbm1 = (x: number, seed = 0) =>
  noise1(x + seed * 17.3) * 0.6 + noise1(x * 2.1 + seed * 5.1) * 0.3 + noise1(x * 4.3 + seed) * 0.1;

/** Seeded PRNG for geometry generation. */
export const mulberry32 = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** Cubic bezier in 3D on plain tuples */
export const bezier3 = (
  p0: number[],
  p1: number[],
  p2: number[],
  p3: number[],
  t: number,
): [number, number, number] => {
  const u = 1 - t;
  const a = u * u * u,
    b = 3 * u * u * t,
    c = 3 * u * t * t,
    d = t * t * t;
  return [0, 1, 2].map((i) => a * p0[i] + b * p1[i] + c * p2[i] + d * p3[i]) as [number, number, number];
};
