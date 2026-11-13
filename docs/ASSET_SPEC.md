# Honey Bee Asset & Rig Specification

**For:** the 3D artist producing the production model for the BeeRadar Honey Bee Explorer
**Subject:** female worker honey bee, *Apis mellifera*, adult forager
**Delivery:** one `.glb` (glTF 2.0) plus the source `.blend`
**Status of the current app:** a temporary procedural stand-in (`src/lib/beeRig.ts`) uses the joint names below. A GLB that follows this spec drops in with **no code changes** (`NEXT_PUBLIC_BEE_MODEL_URL`, see README).

---

## 1. Sourcing assessment (step 14.1–14.5 of the brief)

| Question | Finding |
| --- | --- |
| Is a ready-made, anatomically accurate, rigged worker-bee model available? | Not verified. No asset has been downloaded or checked into this repo. Marketplace models (Sketchfab Store, TurboSquid, CGTrader) often carry the word "honey bee" but frequently show bumblebee proportions, fused legs, no mouthparts, or no rig. |
| Licensed for commercial web use? | Must be confirmed per asset. Required: a licence allowing **real-time web display on a commercial site**, modification, and re-export to glTF. A "Standard/Editorial" licence is not enough. Keep the licence PDF with the source files. |
| Textures included? | Required set listed in §5. Most stock models ship 2K diffuse only, which is not enough. |
| Rig suitable? | Must match §3 (bones) and §4 (morph targets). Stock rigs typically lack proboscis, mandible, antenna-flagellum and per-wing-pair bones. |
| Missing anatomy (typical) | Ocelli, hamuli, corbicula fringe, pollen-press structures, sting apparatus, spiracles, wax mirrors, segmented tarsi with claws. |

**Recommendation:** commission a model, or buy a high-resolution scan or sculpt and have it re-topologised and rigged to this spec. Have an apiologist review the result against reference specimens (see §8).

---

## 2. Scale, orientation and naming

* **Units:** 1 glTF unit = **4.5 mm**. Body length from frons to the tip of the abdomen is about 2.9 units (≈ 13 mm).
* **Axes (glTF):** +Z = anterior (head), +Y = dorsal, +X = the bee's left side.
* **Origin:** at the petiole (thorax–abdomen junction), on the body midline.
* **Rest pose:** standing pose, wings folded over the abdomen, proboscis folded, sting retracted.
* **Naming:** ASCII, `snake_case` or the exact names below. Side suffix `_L` / `_R` (`R` = +X).

## 3. Skeleton (required bone / node names)

| Node | Parent | Notes |
| --- | --- | --- |
| `thorax` | root | body pitch pivot |
| `head` | thorax | neck joint at the anterior pronotum |
| `antenna_R_scape`, `antenna_L_scape` | head | rotate about the socket |
| `antenna_R_flagellum`, `antenna_L_flagellum` | scape (through pedicel) | elbow; ideally 10 child bones `antenna_R_flag01…10` for curl |
| `mandible_R`, `mandible_L` | head | open sideways about the anteroposterior axis |
| `proboscis_base` | head | cardo/stipes/prementum unit — folds back under the head |
| `proboscis_glossa` | proboscis_base | glossa + flabellum; scale Z for extension |
| `wing_fore_R/L`, `wing_hind_R/L` | thorax | hinge at the wing base; local X = span, local Z = leading edge |
| `leg_{R|L}{1|2|3}_coxa` | thorax | 1 = front, 2 = middle, 3 = hind |
| `leg_*_femur` | coxa (through trochanter) | |
| `leg_*_tibia` | femur | |
| `leg_*_tarsus` | tibia | basitarsus; add `leg_*_tarsomere1…4` and `leg_*_claw` |
| `abdomen` | thorax | pivot at the petiole |
| `abdomen_seg1…6` | abdomen | telescoping tergite/sternite pairs (breathing, waggle) |
| `stinger` | abdomen_seg6 | translate −Z to extend |

### Anchor empties (required — used for anatomy markers and camera focus)

Place an Empty **on the surface** of each structure, parented to the bone that carries it. These are the exact positions the markers will follow:

`anchor_compoundEyes`, `anchor_ocelli`, `anchor_antennae`, `anchor_mandibles`, `anchor_proboscis`, `anchor_proboscisTip`, `anchor_thorax`, `anchor_forewings`, `anchor_hindwings`, `anchor_hamuli`, `anchor_frontLegs`, `anchor_middleLegs`, `anchor_hindLegs`, `anchor_corbiculae`, `anchor_abdomen`, `anchor_spiracles`, `anchor_stinger`.

### Picking metadata

Give every mesh a custom property `anatomy` (exported as glTF `extras`), with one of the IDs above (without the `anchor_` prefix). Meshes with no anatomical ID (the head capsule, for example) leave it unset. Split meshes so that each one belongs to a single ID; the app uses this to highlight structures.

## 4. Morph targets (shape keys)

| Name | Mesh | Purpose |
| --- | --- | --- |
| `pollenLoad` | hind tibiae | 0 = empty basket → 1 = full corbicular load (or a separate `pollen_load_R/L` mesh scaled by the app) |
| `bodyPollen` | body hair cards / grains | pollen grains caught in plumose hairs |
| `abdomenBreathe` | abdomen | telescoping of the intersegmental membranes |
| `waxScales` | sternites 4–7 | wax scales emerging from the wax pockets |
| `proboscisExtend` | proboscis | optional; finer than the bone extension |
| `cellHex` / `cellHeight` | honeycomb cell (separate asset) | already procedural; only needed if replaced |

## 5. Meshes and texture maps

* **Polycount (LOD0):** about 150–250k triangles for the body, excluding hair. LOD1 is about 40k and LOD2 about 10k (named `*_LOD1`, `*_LOD2`).
* **Hair:** use hair cards with alpha and anisotropic highlights, or export guide curves for instancing. Thorax hairs are plumose (branched) and golden-brown. Pale tomentum bands sit at the bases of tergites 3–5. Eye hairs are sparse.
* **Compound eyes:** separate meshes. The ommatidial facet pattern goes in the normal map, at about 4,500–7,000 facets per eye.
* **Wings:** separate, single-sided, double-sided material. The venation is painted into base colour and alpha. A thin-film/iridescence mask is optional.
* **PBR maps (per material set, 4096² for body and wings, 2048² for legs):**
  `baseColor` (sRGB), `normal` (OpenGL +Y), `ORM` (R = occlusion, G = roughness, B = metalness ≈ 0), `alpha` (wings, hair cards), optional `thickness` and `transmission` (wings, wax).
* **Colour reference:** a European worker of a yellow-banded strain, e.g. *A. m. ligustica*-type. Tergites 1–3 have amber anterior bands and dark brown posterior margins; tergites 4–6 are dark. Include natural asymmetry and wear (frayed wing margins on an older forager are acceptable).

## 6. Animation clips (optional)

The explorer shows the bee at rest. An optional looping `idle` clip (about 8 s: breathing, antenna movement) is played if present; otherwise the app drives the bones procedurally. The bones in §3 are still needed so anatomy markers and the sting toggle work.

## 7. Export and optimisation pipeline

```bash
# Blender 4.x: File ▸ Export ▸ glTF 2.0 (.glb)
#   ☑ +Y up  ☑ Custom properties  ☑ Shape keys  ☑ Skinning  ☑ Animation (if clips)
#   ☐ Draco here — compress afterwards with gltf-transform

npx @gltf-transform/cli optimize apis-mellifera-worker.glb public/models/apis-mellifera-worker.glb \
  --compress meshopt \
  --texture-compress ktx2 --texture-size 4096 \
  --simplify false
npx @gltf-transform/cli inspect public/models/apis-mellifera-worker.glb
```

Budget: ≤ 25 MB total for the high LOD (KTX2 + Meshopt). The app loads Draco, Meshopt and KTX2 through `useGLTF` (see `GltfBeeModel` in `src/components/bee/BeeModel.tsx`).

## 8. Acceptance checklist for the asset

- [ ] The licence permits commercial real-time web use and modification (PDF supplied)
- [ ] Proportions checked against a worker specimen: head, thorax and abdomen ratios; forewing reaching about the tip of the abdomen at rest
- [ ] 12-segment antennae (scape, pedicel, 10 flagellomeres)
- [ ] Spoon-shaped mandibles without teeth (worker)
- [ ] Proboscis folds under the head and extends to about 5–7 mm
- [ ] Wing venation matches *Apis* (marginal cell, 3 submarginal cells); about 20 hamuli
- [ ] Hind tibia carries a concave corbicula with fringe hairs and a single central bristle; basitarsus has a pollen comb; pollen press (rastellum/auricle) is present
- [ ] Antenna cleaner notch on the front basitarsus
- [ ] 6 visible tergites; wax mirrors on sternites 4–7; spiracles placed laterally
- [ ] Sting retracted inside the sting chamber in the rest pose
- [ ] All bones, anchors and `anatomy` extras named as above
- [ ] Reviewed and signed off by an apiologist or entomologist
