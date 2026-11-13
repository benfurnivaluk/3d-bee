import type { QualityLevel } from '@/types/bee';

export function detectWebGL(): { ok: boolean; webgl2: boolean; renderer?: string } {
  try {
    const c = document.createElement('canvas');
    const gl = (c.getContext('webgl2') as WebGL2RenderingContext | null) ?? (c.getContext('webgl') as WebGLRenderingContext | null);
    if (!gl) return { ok: false, webgl2: false };
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : undefined;
    return { ok: true, webgl2: typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext, renderer };
  } catch {
    return { ok: false, webgl2: false };
  }
}

/** First guess for "Auto" quality; refined at runtime by the performance monitor. */
export function initialQuality(): QualityLevel {
  const info = detectWebGL();
  const ua = navigator.userAgent;
  const mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua) || (navigator.maxTouchPoints > 1 && window.innerWidth < 1024);
  const cores = navigator.hardwareConcurrency ?? 4;
  const weakGpu = info.renderer ? /SwiftShader|llvmpipe|Mali-4|Adreno \(TM\) [3-5]\d\d|PowerVR/i.test(info.renderer) : false;
  if (!info.webgl2 || weakGpu) return 'low';
  if (mobile || cores <= 4) return 'medium';
  return 'high';
}
