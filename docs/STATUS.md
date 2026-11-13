# Build status, review status and remaining work

Last updated: 13 Nov 2026

## Headline

The explorer was simplified on 13 Nov 2026 to **anatomy only, on a white background**. The behaviours, environments, cinematic mode and sound have been removed.
The app works: rotation, zoom, 16 anatomy markers, click-to-identify, focus and the details panel.
The **bee itself is a temporary procedural model**. It does **not** meet the photorealism or full anatomical-accuracy target, and is labelled "Temporary model" in the UI. Meeting that target depends on the asset in `ASSET_SPEC.md`.

## Feature status

| Area | Status | Notes |
| --- | --- | --- |
| Full-screen scene on white, studio lighting | ✅ Done | No network HDRs |
| Orbit 360° (incl. top/underside), zoom limits, pan, keyboard | ✅ Done | Arrows, +/−, R |
| Anatomy markers (16) attached to the rig | ✅ Done | |
| Click to identify / double-click or marker to focus / highlight | ✅ Done | |
| Details panel (name, scientific name, purpose, fact) + sting toggle | ✅ Done | |
| Quality Auto/High/Medium/Low, adaptive DPR | ✅ Done | |
| WebGL detection + text fallback, text view, reduced motion | ✅ Done | |
| GLB production path (Draco/Meshopt/KTX2) | ⚠️ Coded, untested | No asset exists yet |
| Photorealistic textures and hair | ❌ Blocked on asset | |

## Known visual limitations of the temporary model

* Legs are tapered cylinders. Tarsomeres are simplified, and the pollen press and antenna cleaner are not modelled.
* Hair is unbranched instanced strands. Real thoracic setae are plumose (branched).
* Wing venation is a hand-drawn approximation, and the forewing coupling fold is not modelled.
* The proboscis is a 3-part chain; galeae and labial palps are not individually articulated.
* Spiracles are representative positions only.

## Scientific review status

| Content | Status |
| --- | --- |
| Anatomy text: compound eyes, ocelli, antennae, mandibles, proboscis, thorax, hind legs, corbiculae, abdomen, stinger, front legs | Checked against standard literature by the developer. **Needs expert sign-off.** |
| Middle-leg spur function, spiracle count/positions, hamuli count, wing venation | **Needs expert review** (flagged in-app) |

## Remaining tasks / dependencies

1. **Procure or commission the production model** to `ASSET_SPEC.md`, and confirm its commercial web licence.
2. Set `NEXT_PUBLIC_BEE_MODEL_URL`, then validate `gltfRig.ts` bone axes against the real rig.
3. Have an apiologist review the anatomy text, venation and leg structures.
4. Run device QA on real phones and tablets.
