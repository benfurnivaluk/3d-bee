# BeeRadar — The Interactive Honey Bee

A full-screen 3D anatomy explorer of a worker honey bee (*Apis mellifera*) for BeeRadar.co.uk: the bee on a plain white background. Visitors can rotate and zoom, and click any of 16 labelled structures to see an explanation and a "did you know" fact.

> **Important:** the bee currently on screen is a **temporary procedural model**. It is used to build and test the experience. The photorealistic target depends on the production asset in [`docs/ASSET_SPEC.md`](docs/ASSET_SPEC.md). See [`docs/STATUS.md`](docs/STATUS.md) for what is complete, what is simplified and what still needs expert review.

## Stack

Next.js 15 (App Router, TypeScript) · React Three Fiber 9 · three.js r180 · @react-three/drei · GSAP · Zustand · Tailwind CSS

## Local development

```bash
npm install
npm run dev          # http://localhost:3100/bee-explorer
npm run typecheck
```

## Production build

```bash
npm run build
npm run start        # serves on :3100
```

The explorer route is client-rendered (`ssr: false` for the canvas) and is otherwise a static page. It can be deployed to Vercel, Netlify or any Node host.

### Environment variables

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_BEE_MODEL_URL` | URL of the production GLB (e.g. `/models/apis-mellifera-worker.glb`). When set, the GLB replaces the procedural stand-in. |
| `NEXT_PUBLIC_BEERADAR_URL` | Target of the logo and exit links (default `https://beeradar.co.uk`) |
| `NEXT_PUBLIC_BASE_PATH` | Serve under a sub-path, e.g. `/explore` |

## Integrating with BeeRadar.co.uk

Pick one of these options:

1. **Sub-path deployment (simplest).** Deploy this app with `NEXT_PUBLIC_BASE_PATH=/honey-bee` and add a reverse-proxy or rewrite from `beeradar.co.uk/honey-bee/*` to it.
2. **Copy into an existing Next.js site.** Copy `src/components/bee`, `src/lib`, `src/store`, `src/data` and `src/types` into the site. Add the dependencies from `package.json`, the `@layer components` block and the marker/label CSS from `src/app/globals.css`, and the `honey`/`ink` colours from `tailwind.config.ts`. Then create a route:
   ```tsx
   // app/honey-bee/page.tsx
   import BeeExplorer from '@/components/bee/BeeExplorer';
   export default function Page() { return <BeeExplorer />; }
   ```
   `BeeExplorer` is self-contained, fills the viewport (`position: fixed`), and does not touch the host site's layout.
3. **Non-Next site (iframe).** Embed the deployed route full-screen:
   `<iframe src="https://explore.beeradar.co.uk/bee-explorer" allow="fullscreen; autoplay" style="border:0;width:100%;height:100vh"></iframe>`

The reusable 3D component on its own is `<BeeModel lod="high" ghosts={1} interactive />`. Drive it with any `Pose` (see `src/lib/behaviours/pose.ts`).

## Architecture

```
src/
  app/bee-explorer/page.tsx        route
  components/bee/
    BeeExplorer.tsx                entry: WebGL check, reduced motion, text fallback
    Scene.tsx                      <Canvas> on white, quality presets, performance monitor
    BeeModel.tsx                   reusable bee (procedural now, GLB path ready)
    BeeAnimator.tsx                resting pose with subtle life + sting toggle
    BeeCamera.tsx                  orbit controls, reset/anatomy focus tweens, keyboard
    BeeLighting.tsx                bright studio light rig + light-former reflections
    AnatomyMarkers.tsx             markers portalled into rig anchors
    AnatomyPanel.tsx               structure list, mobile chips, details panel
    ExplorerUI.tsx                 layout and top bar
    LoadingScreen.tsx
    ui/ Icons, Dialog, TextView
  lib/
    beeRig.ts                      TEMPORARY procedural rig (named joints, anchors, LODs)
    gltfRig.ts                     adapter mapping a spec-compliant GLB onto the same interface
    behaviours/pose.ts             pose data + idle motion
    textures.ts, webgl.ts, math.ts, runtime.ts
  store/beeExplorerStore.ts        Zustand interaction state
  data/                            beeAnatomy, cameraPresets
  types/bee.ts
docs/ ASSET_SPEC.md, STATUS.md
```

### Design notes

* **Markers never drift.** Every marker is a child of an anchor object inside the rig hierarchy.
* **No per-frame React renders.** Per-frame data lives in `lib/runtime.ts`.
