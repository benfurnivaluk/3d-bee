# Build status, review status and remaining work

Last updated: 13 Nov 2026

## Headline

The explorer was simplified on 13 Nov 2026 to **anatomy only, on a white background**. The behaviours, environments, cinematic mode and sound have been removed.
The app works: rotation, zoom, 16 anatomy markers, click-to-identify, focus and the details panel.
The **bee itself is a temporary procedural model**. It does **not** meet the photorealism or full anatomical-accuracy target. The "Temporary model" badge has been removed from the UI. Meeting that target depends on the asset in `ASSET_SPEC.md`.

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

## Changes synced from the BeeRadar site (16 November 2026)

Ported from the Lovable build at commit f67cd44 so this source matches the live explorer:

- Anatomy labels start hidden on every device. A "Show labels / Hide labels" button sits under the header on desktop and top-left on phones.
- Phones: details open as a bottom drawer that tucks down to a tab; the whole bee stays framed above it.
- Automatic quality changes no longer rebuild the bee or reset its pose.

## Model changes made on 16 November 2026 (Ben's local copy)

- Scutellum and tegulae (wing-base covers) removed; the propodeum sits inside the thorax outline so it no longer pokes through the hair.
- Labrum uses the clypeus material.
- Compound eyes are bare: the interfacetal eye hairs are gone and face hair that would lie across an eye is filtered out. The eye fact no longer says the eyes are hairy.
- Highlight: hovering gives a soft honey glow; a selected part glows red (procedural and GLB rigs).
