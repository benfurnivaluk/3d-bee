/**
 * TEMPORARY PROCEDURAL HONEY BEE RIG
 * ---------------------------------
 * A functional stand-in for the production GLB described in docs/ASSET_SPEC.md.
 * It is articulated with the same joint names as the specified Blender rig so that
 * behaviours, anatomy anchors and camera framing transfer to the final asset.
 *
 * This geometry is NOT photorealistic and NOT anatomically complete. It exists to
 * verify interaction, animation and educational flows while the asset is produced.
 *
 * Frame: +Z = anterior (head), +Y = dorsal, +X = the bee's left side ("R" in code is
 * simply the +X side; "L" is mirrored). 1 unit ≈ 4.5 mm.
 */
import * as THREE from 'three';
import type { AnatomyId, LegId, LegPose, Pose } from '@/types/bee';
import { cuticleNormal, eyeFacetNormal, WING_OUTLINES, wingTextures, type WingKind } from './textures';
import { mulberry32 } from './math';

export type RigLod = 'high' | 'medium' | 'low' | 'minimal';

export interface BeeRigOptions {
  lod: RigLod;
  /** number of exposures used for wing motion blur (1 = none) */
  ghosts: number;
  seed?: number;
}

interface WingCopy {
  sweep: THREE.Group;
  dev: THREE.Group;
  pitch: THREE.Group;
  mesh: THREE.Mesh;
  mat: THREE.MeshPhysicalMaterial;
}
interface WingRig {
  kind: WingKind;
  side: 1 | -1;
  plane: THREE.Group;
  copies: WingCopy[];
  baseOpacity: number;
}
interface LegRig {
  id: LegId;
  coxa: THREE.Group;
  femur: THREE.Group;
  tibia: THREE.Group;
  tarsus: THREE.Group;
  base: { yaw: number; tilt: number };
}
interface AntennaRig {
  scape: THREE.Group;
  flag: THREE.Group;
  flagSegs: THREE.Group[];
  base: { x: number; y: number };
}

export interface BeeRig {
  root: THREE.Group;
  body: THREE.Group;
  head: THREE.Group;
  abdomen: THREE.Group;
  anchors: Record<AnatomyId, THREE.Object3D>;
  /** world-space helper: proboscis tip */
  proboscisTip: THREE.Object3D;
  partMaterials: Partial<Record<AnatomyId, THREE.Material[]>>;
  apply: (pose: Pose) => void;
  /** selected = true paints the structure red; otherwise a soft honey hover glow */
  setHighlight: (id: AnatomyId | null, pulse: number, selected?: boolean) => void;
  setBodyPollenVisible: (v: number) => void;
  dispose: () => void;
}

/* ------------------------------------------------------------------ */
/* Materials                                                          */
/* ------------------------------------------------------------------ */

const cuticle = (color: string, opts: Partial<THREE.MeshPhysicalMaterialParameters> = {}) => {
  const m = new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.42,
    metalness: 0,
    clearcoat: 0.35,
    clearcoatRoughness: 0.45,
    normalMap: cuticleNormal(),
    normalScale: new THREE.Vector2(0.35, 0.35),
    ...opts,
  });
  return m;
};

/* ------------------------------------------------------------------ */
/* Geometry helpers                                                   */
/* ------------------------------------------------------------------ */

/**
 * Organic tapered segment along +X from 0..len: a lathe profile with a slight mid-length
 * bulge and softly rounded ends (cuticle segments are not straight tubes).
 */
function segmentGeo(len: number, r0: number, r1: number, radial = 10, bulge = 0.12) {
  const pts: THREE.Vector2[] = [];
  const n = 12;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    let r = THREE.MathUtils.lerp(r0, r1, t) * (1 + bulge * Math.sin(Math.PI * t));
    const end = Math.min(t, 1 - t) * n; // round the last step at each end
    if (end < 1) r *= 0.9 + 0.1 * end;
    pts.push(new THREE.Vector2(Math.max(0.001, r), t * len));
  }
  const g = new THREE.LatheGeometry(pts, Math.max(radial, 14));
  g.rotateZ(-Math.PI / 2); // +Y -> +X
  g.computeVertexNormals();
  return g;
}

function ellipsoid(rx: number, ry: number, rz: number, seg = 32) {
  const g = new THREE.SphereGeometry(1, seg, Math.round(seg * 0.75));
  g.scale(rx, ry, rz);
  return g;
}

/** Bent, tapered strand from y=0..1 used for instanced setae. */
function hairStrandGeo() {
  const g = new THREE.CylinderGeometry(0.0, 1, 1, 4, 6, true);
  g.translate(0, 0.5, 0);
  const p = g.attributes.position as THREE.BufferAttribute;
  const colors: number[] = [];
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i);
    // gentle S-curl rather than a straight spike
    p.setX(i, p.getX(i) + y * y * 0.42);
    p.setZ(i, p.getZ(i) + Math.sin(y * Math.PI) * 0.06);
    const c = 0.42 + Math.pow(y, 0.7) * 0.62; // dark root, light sun-bleached tip
    colors.push(c, c, c);
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  g.computeVertexNormals();
  return g;
}

interface HairSample {
  p: THREE.Vector3;
  n: THREE.Vector3;
}

function makeHair(
  samples: HairSample[],
  opts: { len: [number, number]; thick: number; color: THREE.ColorRepresentation; jitter: number; bias?: THREE.Vector3; rnd: () => number },
  mat: THREE.Material,
) {
  const geo = hairStrandGeo();
  const mesh = new THREE.InstancedMesh(geo, mat, samples.length);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const dir = new THREE.Vector3();
  const s = new THREE.Vector3();
  const base = new THREE.Color(opts.color);
  const c = new THREE.Color();
  samples.forEach((sm, i) => {
    dir
      .copy(sm.n)
      .add(new THREE.Vector3((opts.rnd() - 0.5) * opts.jitter, (opts.rnd() - 0.5) * opts.jitter, (opts.rnd() - 0.5) * opts.jitter));
    if (opts.bias) dir.add(opts.bias);
    dir.normalize();
    q.setFromUnitVectors(up, dir);
    const twist = new THREE.Quaternion().setFromAxisAngle(dir, opts.rnd() * Math.PI * 2);
    q.premultiply(twist);
    const L = opts.len[0] + (opts.len[1] - opts.len[0]) * opts.rnd();
    const th = opts.thick * (0.6 + opts.rnd() * 0.8);
    s.set(th, L, th);
    m.compose(sm.p, q, s);
    mesh.setMatrixAt(i, m);
    c.copy(base).offsetHSL((opts.rnd() - 0.5) * 0.02, (opts.rnd() - 0.5) * 0.1, (opts.rnd() - 0.5) * 0.12);
    mesh.setColorAt(i, c);
  });
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.frustumCulled = false;
  return mesh;
}

function sampleEllipsoid(
  n: number,
  c: THREE.Vector3,
  r: THREE.Vector3,
  rnd: () => number,
  keep: (d: THREE.Vector3) => boolean,
  deform?: (p: THREE.Vector3) => void,
) {
  const out: HairSample[] = [];
  let guard = 0;
  while (out.length < n && guard++ < n * 30) {
    const u = rnd() * 2 - 1;
    const th = rnd() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u);
    const d = new THREE.Vector3(s * Math.cos(th), u, s * Math.sin(th));
    if (!keep(d)) continue;
    const p = new THREE.Vector3(d.x * r.x, d.y * r.y, d.z * r.z);
    if (deform) deform(p);
    p.add(c);
    const nrm = new THREE.Vector3(d.x / r.x, d.y / r.y, d.z / r.z).normalize();
    out.push({ p, n: nrm });
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Abdomen profile                                                    */
/* ------------------------------------------------------------------ */

export const ABDOMEN_LENGTH = 1.55;
const ABD_PROFILE = new THREE.SplineCurve(
  [
    [0, 0.07], [0.05, 0.22], [0.12, 0.33], [0.25, 0.415], [0.4, 0.44], [0.55, 0.42],
    [0.7, 0.36], [0.82, 0.27], [0.92, 0.16], [1.0, 0.035],
  ].map(([x, y]) => new THREE.Vector2(x, y)),
);
const abdRadiusCache: number[] = [];
for (let i = 0; i <= 200; i++) {
  // SplineCurve is parameterised by arc-ish t, sample densely and map x->r
  const p = ABD_PROFILE.getPoint(i / 200);
  abdRadiusCache.push(p.x, p.y);
}
export function abdomenRadius(x: number) {
  for (let i = 2; i < abdRadiusCache.length; i += 2) {
    if (abdRadiusCache[i] >= x) {
      const x0 = abdRadiusCache[i - 2],
        r0 = abdRadiusCache[i - 1],
        x1 = abdRadiusCache[i],
        r1 = abdRadiusCache[i + 1];
      return r0 + ((r1 - r0) * (x - x0)) / Math.max(1e-6, x1 - x0);
    }
  }
  return 0.03;
}
const ABD_SEGS: [number, number][] = [
  [0, 0.2], [0.18, 0.38], [0.36, 0.55], [0.53, 0.7], [0.68, 0.84], [0.82, 1.0],
];
const ABD_FLATTEN = 0.86;

/* ------------------------------------------------------------------ */
/* Leg geometry                                                       */
/* ------------------------------------------------------------------ */

const LEG_DIMS: Record<1 | 2 | 3, { coxa: number; troch: number; femur: number; tibia: number; basi: number; tars: number; r: number }> = {
  1: { coxa: 0.1, troch: 0.06, femur: 0.38, tibia: 0.36, basi: 0.2, tars: 0.055, r: 0.042 },
  2: { coxa: 0.1, troch: 0.06, femur: 0.45, tibia: 0.44, basi: 0.24, tars: 0.06, r: 0.044 },
  3: { coxa: 0.12, troch: 0.07, femur: 0.52, tibia: 0.58, basi: 0.3, tars: 0.065, r: 0.05 },
};
const LEG_ATTACH: Record<1 | 2 | 3, [number, number, number]> = {
  1: [0.12, -0.27, 0.6],
  2: [0.2, -0.3, 0.32],
  3: [0.21, -0.27, 0.06],
};
const LEG_BASE: Record<1 | 2 | 3, { yaw: number; tilt: number }> = {
  1: { yaw: 0.6, tilt: 0.75 },
  2: { yaw: 0.05, tilt: 0.75 },
  3: { yaw: -0.8, tilt: 0.7 },
};

export const legIds: LegId[] = ['L1', 'R1', 'L2', 'R2', 'L3', 'R3'];

/* ------------------------------------------------------------------ */
/* Builder                                                            */
/* ------------------------------------------------------------------ */

export function buildBeeRig(opts: BeeRigOptions): BeeRig {
  const { lod } = opts;
  const rnd = mulberry32(opts.seed ?? 1);
  const detail = lod === 'high' ? 1 : lod === 'medium' ? 0.75 : lod === 'low' ? 0.55 : 0.4;
  const hairMul = lod === 'high' ? 1 : lod === 'medium' ? 0.5 : lod === 'low' ? 0.22 : 0;
  const seg = (n: number) => Math.max(8, Math.round(n * detail));
  const disposables: { dispose: () => void }[] = [];
  const track = <T extends { dispose: () => void }>(x: T) => {
    disposables.push(x);
    return x;
  };

  /* materials ------------------------------------------------------ */
  const M = {
    head: track(cuticle('#22160e')),
    thorax: track(cuticle('#24170e')),
    eyes: track(
      new THREE.MeshPhysicalMaterial({
        color: '#2a1d12',
        roughness: 0.28,
        clearcoat: 1,
        clearcoatRoughness: 0.18,
        normalMap: eyeFacetNormal(),
        normalScale: new THREE.Vector2(0.55, 0.55),
        sheen: 0.4,
        sheenColor: new THREE.Color('#6b5236'),
      }),
    ),
    ocelli: track(new THREE.MeshPhysicalMaterial({ color: '#4a2c14', roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.02 })),
    antennae: track(cuticle('#2a1a0e', { roughness: 0.42, clearcoat: 0.5, sheen: 0.6, sheenColor: new THREE.Color('#8a6a44') })),
    mandibles: track(cuticle('#6e4318', { roughness: 0.35 })),
    clypeus: track(cuticle('#3a2513')),
    proboscis: track(cuticle('#7a4c22', { roughness: 0.5, clearcoat: 0.6 })),
    frontLegs: track(cuticle('#2b1b11', { roughness: 0.58, clearcoat: 0.15 })),
    middleLegs: track(cuticle('#2b1b11', { roughness: 0.58, clearcoat: 0.15 })),
    hindLegs: track(cuticle('#2b1b11', { roughness: 0.58, clearcoat: 0.15 })),
    corbiculae: track(cuticle('#3d2512', { roughness: 0.22, clearcoat: 0.8, clearcoatRoughness: 0.2 })),
    abdomen: track(
      cuticle('#ffffff', { vertexColors: true, roughness: 0.4, clearcoat: 0.45, clearcoatRoughness: 0.4, sheen: 0.35, sheenColor: new THREE.Color('#ffcf8a'), sheenRoughness: 0.6 }),
    ),
    membrane: track(cuticle('#7a5a3a', { roughness: 0.6, clearcoat: 0 })),
    spiracles: track(new THREE.MeshStandardMaterial({ color: '#2a1709', roughness: 0.9, transparent: true, opacity: 0.8 })),
    stinger: track(cuticle('#5a3615', { roughness: 0.3 })),
    hamuli: track(cuticle('#3b2614', { roughness: 0.4 })),
    hairGold: track(new THREE.MeshStandardMaterial({ color: '#ffffff', vertexColors: true, roughness: 0.62, metalness: 0 })),
    pollen: track(new THREE.MeshStandardMaterial({ color: '#e4a923', roughness: 0.85, normalMap: cuticleNormal(), normalScale: new THREE.Vector2(1.5, 1.5) })),
    waxScale: track(
      new THREE.MeshPhysicalMaterial({
        color: '#f7eed0',
        roughness: 0.25,
        transmission: 0.55,
        thickness: 0.02,
        transparent: true,
        opacity: 0.75,
        side: THREE.DoubleSide,
        clearcoat: 1,
      }),
    ),
    waxWorked: track(new THREE.MeshPhysicalMaterial({ color: '#f3e3b5', roughness: 0.55, transparent: true, opacity: 1 })),
  };
  const wingMat = (kind: WingKind) => {
    const { map, alpha } = wingTextures(kind);
    return track(
      new THREE.MeshPhysicalMaterial({
        map,
        alphaMap: alpha,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
        roughness: 0.18,
        metalness: 0,
        iridescence: 1,
        iridescenceIOR: 1.33,
        iridescenceThicknessRange: [180, 620],
        specularIntensity: 1,
        clearcoat: 0.6,
        clearcoatRoughness: 0.1,
        opacity: 1,
      }),
    );
  };

  const partMaterials: Partial<Record<AnatomyId, THREE.Material[]>> = {
    compoundEyes: [M.eyes],
    ocelli: [M.ocelli],
    antennae: [M.antennae],
    mandibles: [M.mandibles],
    proboscis: [M.proboscis],
    thorax: [M.thorax],
    frontLegs: [M.frontLegs],
    middleLegs: [M.middleLegs],
    hindLegs: [M.hindLegs],
    corbiculae: [M.corbiculae],
    abdomen: [M.abdomen],
    spiracles: [M.spiracles],
    stinger: [M.stinger],
    hamuli: [M.hamuli],
    forewings: [],
    hindwings: [],
  };

  const tag = <T extends THREE.Object3D>(o: T, id: AnatomyId | null): T => {
    o.userData.anatomy = id;
    o.castShadow = lod === 'high';
    return o;
  };
  const mesh = (g: THREE.BufferGeometry, m: THREE.Material, id: AnatomyId | null) => {
    track(g);
    return tag(new THREE.Mesh(g, m), id);
  };
  const anchor = (parent: THREE.Object3D, p: [number, number, number]) => {
    const o = new THREE.Object3D();
    o.position.set(...p);
    parent.add(o);
    return o;
  };

  /* hierarchy ------------------------------------------------------ */
  const root = new THREE.Group();
  root.name = 'root';
  const body = new THREE.Group();
  body.name = 'thorax';
  root.add(body);

  /* thorax --------------------------------------------------------- */
  const thoraxGeo = ellipsoid(0.4, 0.38, 0.46, seg(48));
  {
    // subtle musculature contours: lateral indentations, scutum/scutellum crease
    const p = thoraxGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i),
        y = p.getY(i),
        z = p.getZ(i);
      let k = 1;
      k -= 0.04 * Math.exp(-((z + 0.12) ** 2) / 0.004) * (y > 0 ? 1 : 0); // scuto-scutellar suture
      k -= 0.03 * Math.exp(-(y * y) / 0.01) * Math.abs(x) * 2.5; // pleural line
      k += 0.02 * Math.sin(z * 9) * (y < 0 ? 1 : 0);
      p.setXYZ(i, x * k, y * k, z * k);
    }
    thoraxGeo.computeVertexNormals();
  }
  const thoraxMesh = mesh(thoraxGeo, M.thorax, 'thorax');
  thoraxMesh.position.set(0, 0.05, 0.3);
  body.add(thoraxMesh);
  const pronotum = mesh(ellipsoid(0.27, 0.24, 0.1, seg(24)), M.thorax, 'thorax');
  pronotum.position.set(0, 0.02, 0.72);
  body.add(pronotum);
  // propodeum: kept below the thoracic outline so it never pokes through the pile
  const propodeum = mesh(ellipsoid(0.24, 0.16, 0.12, seg(24)), M.thorax, 'thorax');
  propodeum.position.set(0, 0.0, -0.12);
  body.add(propodeum);
  // thoracic spiracle (propodeal)
  for (const sx of [1, -1]) {
    const sp = mesh(new THREE.CircleGeometry(0.014, 12), M.spiracles, 'spiracles');
    sp.position.set(0.255 * sx, 0.05, -0.1);
    sp.rotation.y = (Math.PI / 2) * sx;
    body.add(sp);
  }

  /* head ----------------------------------------------------------- */
  const head = new THREE.Group();
  head.name = 'head';
  head.position.set(0, 0.06, 0.78);
  body.add(head);
  const HEAD_C = new THREE.Vector3(0, 0.02, 0.2);
  const HEAD_R = new THREE.Vector3(0.36, 0.38, 0.17);
  const headDeform = (p: THREE.Vector3) => {
    const t = THREE.MathUtils.clamp((p.y / HEAD_R.y + 1) / 2, 0, 1);
    p.x *= 0.58 + 0.42 * Math.pow(t, 0.7);
    if (p.z > 0) p.z *= 0.85 + 0.15 * t;
  };
  const headGeo = ellipsoid(HEAD_R.x, HEAD_R.y, HEAD_R.z, seg(48));
  {
    const p = headGeo.attributes.position as THREE.BufferAttribute;
    const v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      headDeform(v);
      p.setXYZ(i, v.x, v.y, v.z);
    }
    headGeo.computeVertexNormals();
  }
  const headMesh = mesh(headGeo, M.head, null);
  headMesh.position.copy(HEAD_C);
  head.add(headMesh);
  // clypeus + labrum
  const clyp = mesh(ellipsoid(0.12, 0.08, 0.04, 16), M.clypeus, null);
  clyp.position.set(0, -0.16, 0.34);
  head.add(clyp);
  const labrum = mesh(ellipsoid(0.07, 0.035, 0.03, 12), M.clypeus, null);
  labrum.position.set(0, -0.25, 0.33);
  head.add(labrum);

  // compound eyes
  const eyes: THREE.Mesh[] = [];
  for (const sx of [1, -1]) {
    const g = ellipsoid(0.1, 0.27, 0.14, seg(40));
    // kidney shape: pinch the inner-front margin
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i),
        z = p.getZ(i);
      p.setZ(i, z - 0.03 * Math.exp(-(y * y) / 0.01) * (z > 0 ? 1 : 0));
    }
    g.computeVertexNormals();
    const e = mesh(g, M.eyes, 'compoundEyes');
    e.position.set(0.255 * sx, 0.05, 0.19);
    e.rotation.set(0, 0.32 * sx, 0.12 * sx);
    head.add(e);
    eyes.push(e);
  }
  // ocelli
  for (const [x, y, z] of [
    [0, 0.355, 0.17],
    [0.075, 0.33, 0.12],
    [-0.075, 0.33, 0.12],
  ] as const) {
    const o = mesh(new THREE.SphereGeometry(0.03, 16, 12), M.ocelli, 'ocelli');
    o.position.set(x, y, z);
    head.add(o);
  }

  // antennae
  const antennae: Record<'L' | 'R', AntennaRig> = {} as Record<'L' | 'R', AntennaRig>;
  for (const side of ['R', 'L'] as const) {
    const sx = side === 'R' ? 1 : -1;
    const mount = new THREE.Group();
    mount.position.set(0.07 * sx, 0.06, 0.33);
    mount.scale.x = sx;
    head.add(mount);
    const scape = new THREE.Group();
    scape.name = `antenna_${side}_scape`;
    const base = { x: -1.1, y: 0.35 };
    scape.rotation.set(base.x, base.y, 0);
    mount.add(scape);
    const sGeo = segmentGeo(0.3, 0.03, 0.036, seg(10), 0.04);
    sGeo.rotateY(-Math.PI / 2); // segment along +Z
    scape.add(mesh(sGeo, M.antennae, 'antennae'));
    const pedicel = new THREE.Group();
    pedicel.position.z = 0.3;
    scape.add(pedicel);
    const pGeo = segmentGeo(0.065, 0.03, 0.028, seg(10), 0.02);
    pGeo.rotateY(-Math.PI / 2);
    pedicel.add(mesh(pGeo, M.antennae, 'antennae'));
    const flag = new THREE.Group();
    flag.name = `antenna_${side}_flagellum`;
    flag.position.z = 0.065;
    flag.rotation.x = 1.75;
    pedicel.add(flag);
    const flagSegs: THREE.Group[] = [];
    let parent: THREE.Object3D = flag;
    for (let i = 0; i < 10; i++) {
      const g = new THREE.Group();
      g.position.z = i === 0 ? 0 : 0.052;
      parent.add(g);
      const fg = segmentGeo(0.054, 0.026, i === 9 ? 0.016 : 0.026, seg(8), 0);
      fg.rotateY(-Math.PI / 2);
      g.add(mesh(fg, M.antennae, 'antennae'));
      const joint = mesh(new THREE.SphereGeometry(0.025, 8, 6), M.antennae, 'antennae');
      g.add(joint);
      flagSegs.push(g);
      parent = g;
    }
    antennae[side] = { scape, flag, flagSegs, base };
  }

  // mandibles
  const mandibles: THREE.Group[] = [];
  for (const sx of [1, -1]) {
    const mount = new THREE.Group();
    mount.position.set(0.1 * sx, -0.26, 0.27);
    mount.scale.x = sx;
    head.add(mount);
    const j = new THREE.Group();
    j.name = sx > 0 ? 'mandible_R' : 'mandible_L';
    mount.add(j);
    const g = ellipsoid(0.04, 0.11, 0.05, seg(16));
    // spoon: hollow the inner face slightly
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) if (p.getX(i) < 0) p.setX(i, p.getX(i) * 0.4);
    g.computeVertexNormals();
    const mm = mesh(g, M.mandibles, 'mandibles');
    mm.position.set(-0.03, -0.09, 0.02);
    mm.rotation.z = 0.35;
    j.add(mm);
    mandibles.push(j);
  }

  // proboscis
  const prob0 = new THREE.Group();
  prob0.name = 'proboscis_base';
  prob0.position.set(0, -0.3, 0.17);
  head.add(prob0);
  const prob1Geo = segmentGeo(0.3, 0.045, 0.035, seg(10));
  prob1Geo.rotateY(-Math.PI / 2);
  prob0.add(mesh(prob1Geo, M.proboscis, 'proboscis'));
  // galeae (sheath) as two flattened blades
  for (const sx of [1, -1]) {
    const gal = mesh(ellipsoid(0.02, 0.012, 0.2, 10), M.proboscis, 'proboscis');
    gal.position.set(0.035 * sx, 0, 0.22);
    prob0.add(gal);
  }
  const prob1 = new THREE.Group();
  prob1.name = 'proboscis_glossa';
  prob1.position.z = 0.3;
  prob0.add(prob1);
  const glossaGeo = segmentGeo(0.75, 0.024, 0.012, seg(10));
  glossaGeo.rotateY(-Math.PI / 2);
  const glossa = mesh(glossaGeo, M.proboscis, 'proboscis');
  prob1.add(glossa);
  const flabellum = mesh(ellipsoid(0.03, 0.012, 0.035, 10), M.proboscis, 'proboscis');
  flabellum.position.z = 0.76;
  glossa.add(flabellum);
  const proboscisTip = anchor(glossa, [0, 0, 0.78]);
  // glossal hairs
  if (hairMul > 0) {
    const samples: HairSample[] = [];
    for (let i = 0; i < 160 * hairMul; i++) {
      const z = 0.05 + rnd() * 0.68;
      const a = rnd() * Math.PI * 2;
      const r = 0.024 - z * 0.012;
      samples.push({ p: new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, z), n: new THREE.Vector3(Math.cos(a), Math.sin(a), 0.6).normalize() });
    }
    glossa.add(tag(makeHair(samples, { len: [0.02, 0.035], thick: 0.0025, color: '#c9a36a', jitter: 0.3, rnd }, M.hairGold), 'proboscis'));
  }

  /* abdomen -------------------------------------------------------- */
  const abdomen = new THREE.Group();
  abdomen.name = 'abdomen';
  abdomen.position.set(0, 0.0, -0.17);
  body.add(abdomen);
  const petiole = mesh(segmentGeo(0.12, 0.07, 0.08, 10).rotateY(Math.PI / 2), M.thorax, 'abdomen');
  petiole.position.z = 0.04;
  abdomen.add(petiole);
  const abdSegs: THREE.Group[] = [];
  const amber = new THREE.Color('#b8701d');
  const amberLight = new THREE.Color('#d08a2a');
  const dark = new THREE.Color('#24160c');
  const brown = new THREE.Color('#4a2c14');
  const ventral = new THREE.Color('#5b3a1c');
  const L = ABDOMEN_LENGTH;
  ABD_SEGS.forEach(([x0, x1], si) => {
    const g = new THREE.Group();
    g.name = `abdomen_seg${si + 1}`;
    abdomen.add(g);
    const pts: THREE.Vector2[] = [];
    const n = seg(18);
    for (let k = 0; k <= n; k++) {
      const q = k / n;
      const x = x0 + (x1 - x0) * q;
      let r = abdomenRadius(x);
      r *= si === 0 ? 1 : 0.96 + 0.07 * Math.pow(q, 3); // posterior lip overlaps next segment
      if (si === 5 && q > 0.97) r *= 0.6;
      pts.push(new THREE.Vector2(Math.max(0.005, r), x * L));
    }
    const lg = new THREE.LatheGeometry(pts, seg(40));
    lg.rotateX(-Math.PI / 2); // lathe height (+Y) -> posterior (-Z)
    lg.scale(1, ABD_FLATTEN, 1);
    // vertex colours: banding
    const pos = lg.attributes.position as THREE.BufferAttribute;
    const cols: number[] = [];
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const z = -pos.getZ(i) / L;
      const q = THREE.MathUtils.clamp((z - x0) / (x1 - x0), 0, 1);
      const y = pos.getY(i);
      const isDark = si >= 3;
      const front = isDark ? brown : si === 0 ? amberLight : amber;
      c.copy(front).lerp(dark, THREE.MathUtils.smoothstep(q, 0.55, 0.8));
      if (y < -0.05) c.lerp(ventral, 0.55);
      c.offsetHSL(0, 0, (rnd() - 0.5) * 0.03);
      cols.push(c.r, c.g, c.b);
    }
    lg.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    lg.computeVertexNormals();
    g.add(mesh(lg, M.abdomen, 'abdomen'));
    // intersegmental membrane under the lip
    if (si > 0) {
      const xm = x0 + 0.01;
      const r = abdomenRadius(xm) * 0.93;
      const mg = new THREE.CylinderGeometry(r, r, 0.05, seg(30), 1, true);
      mg.rotateX(Math.PI / 2);
      mg.scale(1, ABD_FLATTEN, 1);
      const mm = mesh(mg, M.membrane, 'abdomen');
      mm.position.z = -xm * L;
      g.add(mm);
    }
    abdSegs.push(g);
  });
  // spiracles on T2–T5
  for (const si of [1, 2, 3, 4]) {
    const [x0, x1] = ABD_SEGS[si];
    const x = x0 + (x1 - x0) * 0.35;
    const r = abdomenRadius(x);
    for (const sx of [1, -1]) {
      const sp = mesh(new THREE.CircleGeometry(0.011, 10), M.spiracles, 'spiracles');
      const a = 0.25;
      sp.position.set(Math.cos(a) * r * 1.005 * sx, Math.sin(a) * r * ABD_FLATTEN * 0.2 - 0.04, -x * L);
      sp.rotation.y = (Math.PI / 2) * sx;
      abdSegs[si].add(sp);
    }
  }
  // stinger (retracted inside the sting chamber by default)
  const stingMount = new THREE.Group();
  stingMount.position.z = -L * 0.985;
  abdSegs[5].add(stingMount);
  const sting = new THREE.Group();
  sting.name = 'stinger';
  stingMount.add(sting);
  const stingGeo = new THREE.ConeGeometry(0.022, 0.32, 10);
  stingGeo.rotateX(-Math.PI / 2);
  stingGeo.translate(0, 0, -0.16);
  sting.add(mesh(stingGeo, M.stinger, 'stinger'));
  // lancet barbs
  for (let i = 0; i < 8; i++) {
    const b = mesh(new THREE.ConeGeometry(0.006, 0.02, 4), M.stinger, 'stinger');
    b.position.set(0.012 * (i % 2 ? 1 : -1), 0, -0.2 - i * 0.012);
    b.rotation.x = -2.6;
    sting.add(b);
  }
  // wax mirrors + wax scales on the last four visible sternites (abdominal sternites 4–7)
  const waxScales: THREE.Mesh[] = [];
  const scaleShape = new THREE.Shape();
  [
    [0, 0.08], [0.07, 0.03], [0.055, -0.06], [-0.055, -0.06], [-0.07, 0.03],
  ].forEach(([x, y], i) => (i ? scaleShape.lineTo(x, y) : scaleShape.moveTo(x, y)));
  scaleShape.closePath();
  const scaleGeo = track(new THREE.ShapeGeometry(scaleShape));
  scaleGeo.rotateX(Math.PI / 2);
  for (const si of [2, 3, 4, 5]) {
    const [x0] = ABD_SEGS[si];
    const x = x0 + 0.04;
    const r = abdomenRadius(x);
    for (const sx of [1, -1]) {
      const sc = tag(new THREE.Mesh(scaleGeo, M.waxScale), 'abdomen');
      sc.position.set(0.11 * sx * (r / 0.4), -r * ABD_FLATTEN * 0.94, -x * L);
      sc.rotation.set(0.1, 0.2 * sx, 0.18 * sx);
      sc.visible = false;
      abdSegs[si].add(sc);
      waxScales.push(sc);
    }
  }

  // abdomen hair (tomentum bands + sparse setae)
  if (hairMul > 0) {
    abdSegs.forEach((g, si) => {
      const [x0, x1] = ABD_SEGS[si];
      const samples: HairSample[] = [];
      const bandSamples: HairSample[] = [];
      const count = Math.round((si === 0 ? 800 : 560) * hairMul);
      for (let i = 0; i < count; i++) {
        const inBand = si >= 1 && si <= 4 && rnd() < 0.55;
        const x = inBand ? x0 + 0.025 + rnd() * 0.05 : x0 + 0.02 + rnd() * (x1 - x0 - 0.02);
        const a = (rnd() * 2 - 1) * Math.PI;
        if (inBand && Math.sin(a) < -0.2) continue; // tomentum bands are dorsal/lateral
        const r = abdomenRadius(x) * (si === 0 ? 1 : 0.985);
        const p = new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r * ABD_FLATTEN, -x * L);
        const nrm = new THREE.Vector3(Math.cos(a), Math.sin(a) / ABD_FLATTEN, -0.9).normalize();
        (inBand ? bandSamples : samples).push({ p, n: nrm });
      }
      if (samples.length)
        g.add(tag(makeHair(samples, { len: si === 0 ? [0.06, 0.13] : [0.03, 0.07], thick: 0.0035, color: '#a8834f', jitter: 0.6, rnd }, M.hairGold), 'abdomen'));
      if (bandSamples.length)
        g.add(tag(makeHair(bandSamples, { len: [0.025, 0.045], thick: 0.004, color: '#e3cf9c', jitter: 0.4, rnd }, M.hairGold), 'abdomen'));
    });
  }

  /* wings ---------------------------------------------------------- */
  const WING_DIM: Record<WingKind, { L: number; W: number; root: [number, number, number] }> = {
    fore: { L: 1.95, W: 0.64, root: [0.3, 0.33, 0.5] }, // hinge on the thorax surface
    hind: { L: 1.35, W: 0.42, root: [0.29, 0.3, 0.34] },
  };
  const wingGeo: Record<WingKind, THREE.BufferGeometry> = {} as Record<WingKind, THREE.BufferGeometry>;
  (['fore', 'hind'] as WingKind[]).forEach((kind) => {
    const { L: wl, W } = WING_DIM[kind];
    const pts = WING_OUTLINES[kind].map(([u, v]) => new THREE.Vector2(u, v));
    const curve = new THREE.SplineCurve([...pts, pts[0]]);
    const shape = new THREE.Shape(curve.getPoints(120).map((p) => new THREE.Vector2(p.x * wl, (p.y - 0.8) * W)));
    const g = new THREE.ShapeGeometry(shape, 24);
    const pos = g.attributes.position as THREE.BufferAttribute;
    const uv = g.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / wl, pos.getY(i) / W + 0.8);
    // slight camber so the membrane catches highlights
    for (let i = 0; i < pos.count; i++) {
      const u = pos.getX(i) / wl;
      pos.setZ(i, -0.015 * Math.sin(Math.PI * u) * (0.3 + 0.7 * u));
    }
    g.rotateX(Math.PI / 2);
    g.computeVertexNormals();
    wingGeo[kind] = track(g);
  });

  const wings: WingRig[] = [];
  let foreAnchorParent: THREE.Object3D | null = null;
  let hindAnchorParent: THREE.Object3D | null = null;
  for (const kind of ['fore', 'hind'] as WingKind[]) {
    for (const side of [1, -1] as const) {
      const mount = new THREE.Group();
      const [rx, ry, rz] = WING_DIM[kind].root;
      mount.position.set(rx * side, ry, rz);
      mount.scale.x = side;
      body.add(mount);
      const plane = new THREE.Group();
      plane.name = `wing_${kind}_${side > 0 ? 'R' : 'L'}`;
      mount.add(plane);
      const copies: WingCopy[] = [];
      const ghosts = Math.max(1, opts.ghosts);
      for (let i = 0; i < ghosts; i++) {
        const sweep = new THREE.Group();
        const dev = new THREE.Group();
        const pitch = new THREE.Group();
        plane.add(sweep);
        sweep.add(dev);
        dev.add(pitch);
        const mat = wingMat(kind);
        const wm = tag(new THREE.Mesh(wingGeo[kind], mat), kind === 'fore' ? 'forewings' : 'hindwings');
        wm.castShadow = false;
        wm.renderOrder = 2 + i;
        pitch.add(wm);
        partMaterials[kind === 'fore' ? 'forewings' : 'hindwings']!.push(mat);
        copies.push({ sweep, dev, pitch, mesh: wm, mat });
      }
      wings.push({ kind, side, plane, copies, baseOpacity: 1 });
      if (side === 1 && kind === 'fore') foreAnchorParent = copies[0].pitch;
      if (side === 1 && kind === 'hind') hindAnchorParent = copies[0].pitch;
      // hamuli on hindwing leading edge
      if (kind === 'hind') {
        const hookGeo = track(new THREE.TorusGeometry(0.008, 0.0022, 4, 8, Math.PI * 1.2));
        const { L: wl, W } = WING_DIM.hind;
        for (let h = 0; h < 20; h++) {
          const u = 0.47 + (h / 19) * 0.16;
          const v = 0.975;
          const hook = tag(new THREE.Mesh(hookGeo, M.hamuli), 'hamuli');
          hook.position.set(u * wl, 0.004, (v - 0.8) * W + 0.004);
          hook.rotation.set(0, Math.PI / 2, 0);
          copies[0].pitch.add(hook);
        }
      }
    }
  }

  /* legs ----------------------------------------------------------- */
  const legs = {} as Record<LegId, LegRig>;
  const legMat = (n: 1 | 2 | 3) => (n === 1 ? M.frontLegs : n === 2 ? M.middleLegs : M.hindLegs);
  const legId = (n: 1 | 2 | 3): AnatomyId => (n === 1 ? 'frontLegs' : n === 2 ? 'middleLegs' : 'hindLegs');
  const pollenLoads: THREE.Mesh[] = [];
  const legAnchors: Partial<Record<string, THREE.Object3D>> = {};
  let waxOnHind: THREE.Mesh | null = null;
  let waxOnFore: THREE.Mesh | null = null;
  for (const side of ['R', 'L'] as const) {
    const sx = side === 'R' ? 1 : -1;
    for (const n of [1, 2, 3] as const) {
      const d = LEG_DIMS[n];
      const mat = legMat(n);
      const id = legId(n);
      const mount = new THREE.Group();
      const [ax, ay, az] = LEG_ATTACH[n];
      mount.position.set(ax * sx, ay, az);
      mount.scale.x = sx;
      body.add(mount);
      const coxa = new THREE.Group();
      coxa.name = `leg_${side}${n}_coxa`;
      mount.add(coxa);
      coxa.add(mesh(segmentGeo(d.coxa, d.r * 1.5, d.r * 1.25, seg(10)), mat, id));
      const troch = mesh(segmentGeo(d.troch, d.r * 1.1, d.r, seg(8)), mat, id);
      troch.position.x = d.coxa;
      coxa.add(troch);
      const femur = new THREE.Group();
      femur.name = `leg_${side}${n}_femur`;
      femur.position.x = d.coxa + d.troch;
      coxa.add(femur);
      femur.add(mesh(segmentGeo(d.femur, d.r * 1.1, d.r * 0.9, seg(14), 0.22).scale(1, 1, 0.78), mat, id));
      femur.add(mesh(new THREE.SphereGeometry(d.r * 1.05, 10, 8), mat, id));
      if (hairMul > 0) {
        const fs: HairSample[] = [];
        for (let i = 0; i < Math.round(170 * hairMul + 20); i++) {
          const a = rnd() * Math.PI * 2;
          fs.push({ p: new THREE.Vector3(rnd() * d.femur, Math.cos(a) * d.r, Math.sin(a) * d.r), n: new THREE.Vector3(0.5, Math.cos(a), Math.sin(a)).normalize() });
        }
        femur.add(tag(makeHair(fs, { len: [0.06, 0.14], thick: 0.0026, color: '#c7ab7c', jitter: 0.5, rnd }, M.hairGold), id));
      }
      const tibia = new THREE.Group();
      tibia.name = `leg_${side}${n}_tibia`;
      tibia.position.x = d.femur;
      femur.add(tibia);
      tibia.add(mesh(new THREE.SphereGeometry(d.r, 10, 8), mat, id));
      if (n === 3) {
        // flattened, distally widened hind tibia carrying the corbicula
        const tg = segmentGeo(d.tibia, d.r * 0.9, d.r * 2.3, seg(14));
        tg.scale(1, 1, 0.42);
        tibia.add(mesh(tg, mat, id));
        // glossy concave basket on the outer face
        const cg = new THREE.SphereGeometry(1, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.35);
        cg.rotateX(Math.PI / 2);
        cg.scale(d.tibia * 0.32, d.r * 1.5, 0.02);
        const corb = mesh(cg, M.corbiculae, 'corbiculae');
        corb.position.set(d.tibia * 0.62, 0, d.r * 0.85);
        tibia.add(corb);
        // pollen load
        const pg = new THREE.SphereGeometry(1, 20, 14);
        const pp = pg.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < pp.count; i++) {
          const k = 1 + (rnd() - 0.5) * 0.08;
          pp.setXYZ(i, pp.getX(i) * k, pp.getY(i) * k, pp.getZ(i) * k);
        }
        pg.computeVertexNormals();
        pg.scale(0.16, 0.11, 0.09);
        const load = mesh(pg, M.pollen, 'corbiculae');
        load.position.set(d.tibia * 0.64, 0, d.r * 1.25);
        load.visible = false;
        tibia.add(load);
        pollenLoads.push(load);
        if (side === 'R') legAnchors.corb = anchor(tibia, [d.tibia * 0.62, 0, d.r * 1.3]);
        // fringe hairs around the basket
        if (hairMul > 0) {
          const s: HairSample[] = [];
          for (let i = 0; i < 70 * Math.max(0.4, hairMul); i++) {
            const x = d.tibia * (0.3 + rnd() * 0.68);
            const w = d.r * (0.9 + (2.3 - 0.9) * (x / d.tibia));
            const top = rnd() < 0.5 ? 1 : -1;
            s.push({ p: new THREE.Vector3(x, w * top, d.r * 0.4), n: new THREE.Vector3(0, top * 0.6, 1).normalize() });
          }
          tibia.add(tag(makeHair(s, { len: [0.09, 0.14], thick: 0.003, color: '#9a7344', jitter: 0.25, rnd }, M.hairGold), 'corbiculae'));
        }
      } else {
        tibia.add(mesh(segmentGeo(d.tibia, d.r * 0.8, d.r * 1.08, seg(14), 0.08).scale(1, 1, 0.82), mat, id));
      }
      const tarsus = new THREE.Group();
      tarsus.name = `leg_${side}${n}_tarsus`;
      tarsus.position.x = d.tibia;
      tibia.add(tarsus);
      const bg = segmentGeo(d.basi, n === 3 ? d.r * 1.4 : d.r * 0.85, n === 3 ? d.r * 1.2 : d.r * 0.7, seg(10));
      if (n === 3) bg.scale(1, 1, 0.45);
      tarsus.add(mesh(bg, mat, id));
      let tp: THREE.Object3D = tarsus;
      let off = d.basi;
      for (let k = 0; k < 4; k++) {
        const tg = new THREE.Group();
        tg.position.x = off;
        tg.rotation.z = -0.08;
        tp.add(tg);
        tg.add(mesh(segmentGeo(d.tars, d.r * 0.55, d.r * 0.45, 8), mat, id));
        tp = tg;
        off = d.tars;
      }
      for (const cz of [1, -1]) {
        const claw = mesh(new THREE.ConeGeometry(0.008, 0.045, 5), mat, id);
        claw.position.set(d.tars + 0.015, -0.01, 0.012 * cz);
        claw.rotation.z = -2.2;
        tp.add(claw);
      }
      // leg setae: tibia + basitarsus (incl. pollen comb on hind basitarsus inner face)
      if (hairMul > 0) {
        const s: HairSample[] = [];
        const cnt = Math.round(160 * hairMul + 25);
        for (let i = 0; i < cnt; i++) {
          const a = rnd() * Math.PI * 2;
          const x = rnd() * d.tibia;
          s.push({ p: new THREE.Vector3(x, Math.cos(a) * d.r * 0.9, Math.sin(a) * d.r * 0.9 * (n === 3 ? 0.42 : 1)), n: new THREE.Vector3(0.7, Math.cos(a), Math.sin(a)).normalize() });
        }
        tibia.add(tag(makeHair(s, { len: [0.03, 0.06], thick: 0.0028, color: n === 3 ? '#6b5236' : '#a8875a', jitter: 0.4, rnd }, M.hairGold), id));
        const sb: HairSample[] = [];
        for (let i = 0; i < cnt * 0.8; i++) {
          const x = rnd() * d.basi;
          if (n === 3) {
            sb.push({ p: new THREE.Vector3(x, (rnd() - 0.5) * d.r * 2, -d.r * 0.5), n: new THREE.Vector3(0.3, -0.4, -1).normalize() });
          } else {
            const a = rnd() * Math.PI * 2;
            sb.push({ p: new THREE.Vector3(x, Math.cos(a) * d.r * 0.7, Math.sin(a) * d.r * 0.7), n: new THREE.Vector3(0.7, Math.cos(a), Math.sin(a)).normalize() });
          }
        }
        tarsus.add(tag(makeHair(sb, { len: n === 3 ? [0.035, 0.05] : [0.025, 0.045], thick: 0.0028, color: '#b08a55', jitter: 0.2, rnd }, M.hairGold), id));
      }
      if (side === 'R') {
        legAnchors[`t${n}`] = anchor(tibia, [d.tibia * 0.45, d.r * 1.2, n === 3 ? 0 : d.r]);
        if (n === 3) {
          waxOnHind = tag(new THREE.Mesh(scaleGeo, M.waxScale), 'abdomen');
          waxOnHind.position.set(d.basi * 0.7, 0, -d.r * 0.9);
          waxOnHind.visible = false;
          tarsus.add(waxOnHind);
        }
        if (n === 1) {
          waxOnFore = tag(new THREE.Mesh(scaleGeo, M.waxScale), 'abdomen');
          waxOnFore.position.set(d.basi * 0.9, 0, 0);
          waxOnFore.scale.setScalar(0.8);
          waxOnFore.visible = false;
          tarsus.add(waxOnFore);
        }
      }
      legs[`${side}${n}` as LegId] = { id: `${side}${n}` as LegId, coxa, femur, tibia, tarsus, base: LEG_BASE[n] };
    }
  }

  // worked wax between the mandibles
  const waxBlob = tag(new THREE.Mesh(track(new THREE.IcosahedronGeometry(0.06, 2)), M.waxWorked), 'mandibles');
  waxBlob.position.set(0, -0.38, 0.3);
  waxBlob.visible = false;
  head.add(waxBlob);

  /* hair: thorax + head ------------------------------------------- */
  const bodyPollen: THREE.InstancedMesh[] = [];
  if (hairMul > 0) {
    // dense short under-layer (velvet) beneath the longer pile
    const velvet = sampleEllipsoid(Math.round(5000 * hairMul), new THREE.Vector3(0, 0.05, 0.3), new THREE.Vector3(0.4, 0.38, 0.46), rnd, () => true);
    body.add(tag(makeHair(velvet, { len: [0.03, 0.06], thick: 0.003, color: '#7a5a32', jitter: 0.9, rnd }, M.hairGold), 'thorax'));
    const thoraxHair = sampleEllipsoid(
      Math.round(8500 * hairMul),
      new THREE.Vector3(0, 0.05, 0.3),
      new THREE.Vector3(0.4, 0.38, 0.46),
      rnd,
      () => true,
    );
    body.add(
      tag(
        makeHair(thoraxHair, { len: [0.08, 0.19], thick: 0.0032, color: '#c09a62', jitter: 0.8, bias: new THREE.Vector3(0, 0.1, -0.25), rnd }, M.hairGold),
        'thorax',
      ),
    );
    // face + vertex hair (not on the eyes)
    const headHairAll = sampleEllipsoid(
      Math.round(3200 * hairMul),
      HEAD_C,
      HEAD_R,
      rnd,
      (d) => Math.abs(d.x) < 0.55 || d.y > 0.75 || d.z < -0.2,
      headDeform,
    );
    // keep the compound eyes bare: drop any face hair rooted on or long enough to lie across an eye
    const eyeInv = eyes.map((e) => {
      e.updateMatrix();
      return new THREE.Matrix4().copy(e.matrix).invert();
    });
    const tmpP = new THREE.Vector3();
    const headHair = headHairAll.filter((h) =>
      eyeInv.every((inv) => {
        tmpP.copy(h.p).applyMatrix4(inv);
        const m = 0.14; // clearance ≈ longest face hair
        return (tmpP.x / (0.1 + m)) ** 2 + (tmpP.y / (0.27 + m)) ** 2 + (tmpP.z / (0.14 + m)) ** 2 > 1;
      }),
    );
    head.add(tag(makeHair(headHair, { len: [0.04, 0.12], thick: 0.003, color: '#b8975f', jitter: 0.7, bias: new THREE.Vector3(0, -0.15, 0.1), rnd }, M.hairGold), null));
    // legs coxae/femora hair on the underside of thorax
    const under = sampleEllipsoid(Math.round(1800 * hairMul), new THREE.Vector3(0, 0.0, 0.3), new THREE.Vector3(0.36, 0.34, 0.42), rnd, (d) => d.y < -0.3);
    body.add(tag(makeHair(under, { len: [0.06, 0.14], thick: 0.003, color: '#d2b98a', jitter: 0.6, rnd }, M.hairGold), 'thorax'));

    // pollen grains caught in the body hair (shown during pollen collection)
    const grainGeo = track(new THREE.IcosahedronGeometry(0.012, 0));
    const grains = (parent: THREE.Object3D, samples: HairSample[]) => {
      const im = new THREE.InstancedMesh(grainGeo, M.pollen, samples.length);
      const m = new THREE.Matrix4();
      samples.forEach((s, i) => {
        const p = s.p.clone().addScaledVector(s.n, 0.03 + rnd() * 0.06);
        const k = 0.6 + rnd() * 0.9;
        m.compose(p, new THREE.Quaternion(), new THREE.Vector3(k, k, k));
        im.setMatrixAt(i, m);
      });
      im.count = 0;
      im.userData.max = samples.length;
      im.userData.anatomy = 'thorax';
      im.frustumCulled = false;
      parent.add(im);
      bodyPollen.push(im);
    };
    grains(body, sampleEllipsoid(Math.round(900 * Math.max(0.5, hairMul)), new THREE.Vector3(0, 0.05, 0.3), new THREE.Vector3(0.4, 0.38, 0.46), rnd, (d) => d.y < 0.5));
    grains(head, sampleEllipsoid(Math.round(300 * Math.max(0.5, hairMul)), HEAD_C, HEAD_R, rnd, () => true, headDeform));
  }

  /* anchors -------------------------------------------------------- */
  const anchors = {
    compoundEyes: anchor(head, [0.36, 0.08, 0.24]),
    ocelli: anchor(head, [0, 0.4, 0.17]),
    antennae: anchor(antennae.R.flagSegs[3], [0, 0.03, 0]),
    mandibles: anchor(mandibles[0], [-0.04, -0.15, 0.05]),
    proboscis: anchor(glossa, [0, 0, 0.3]),
    thorax: anchor(body, [0, 0.45, 0.32]),
    forewings: anchor(foreAnchorParent!, [1.15, 0.01, -0.05]),
    hindwings: anchor(hindAnchorParent!, [0.85, 0.01, -0.03]),
    hamuli: anchor(hindAnchorParent!, [0.74, 0.01, 0.075]),
    frontLegs: legAnchors.t1!,
    middleLegs: legAnchors.t2!,
    hindLegs: legAnchors.t3!,
    corbiculae: legAnchors.corb!,
    abdomen: anchor(abdSegs[2], [0, 0.4, -0.7]),
    spiracles: anchor(abdSegs[2], [0.43, -0.01, -0.6]),
    stinger: anchor(abdSegs[5], [0, -0.02, -1.55]),
  } satisfies Record<AnatomyId, THREE.Object3D>;

  /* pose application ---------------------------------------------- */
  const applyLeg = (leg: LegRig, lp: LegPose) => {
    leg.coxa.rotation.set(0, -(leg.base.yaw + lp.pro), -leg.base.tilt);
    leg.femur.rotation.set(0, 0, lp.elev);
    leg.tibia.rotation.set(0, 0, -lp.knee);
    leg.tarsus.rotation.set(0, 0, -lp.ankle);
  };

  const applyWings = (pose: Pose) => {
    const fold = THREE.MathUtils.clamp(pose.wingFold, 0, 1);
    const fly = 1 - fold;
    const ghosts = wings[0].copies.length;
    const blur = THREE.MathUtils.clamp(pose.wingBlur, 0, 1);
    const activeCopies = blur > 0.01 ? ghosts : 1;
    for (const w of wings) {
      const isHind = w.kind === 'hind';
      w.plane.rotation.x = 0.45 * fly;
      w.copies.forEach((c, i) => {
        const visible = i < activeCopies;
        c.mesh.visible = visible;
        if (!visible) return;
        const ph = (pose.wingPhase + (activeCopies > 1 ? (i / activeCopies) * blur : 0) - (isHind ? 0.03 : 0)) * Math.PI * 2;
        const amp = pose.wingAmp * (isHind ? 0.94 : 1);
        const flightSweep = 0.25 + (amp / 2) * Math.cos(ph);
        const flightDev = 0.06 + 0.12 * Math.sin(2 * ph);
        const flightPitch = (isHind ? 0.65 : 0.8) * (Math.tanh(4 * -Math.sin(ph)) / Math.tanh(4));
        // folded over the abdomen, tilted like a shallow roof so no part sinks into the body
        // (angles found by a clearance search against the thorax/abdomen + hair)
        const restSweep = isHind ? 1.32 : 1.36;
        const restDev = -0.1;
        const restPitch = isHind ? 0.5 : 0.45;
        const tremor = pose.wingTremor * Math.sin(pose.wingPhase * 40 + i) * 0.05;
        c.sweep.rotation.y = THREE.MathUtils.lerp(flightSweep, restSweep, fold) - pose.wingTremor * 0.35 + tremor;
        c.dev.rotation.z = THREE.MathUtils.lerp(flightDev, restDev, fold) + pose.wingTremor * 0.12;
        c.pitch.rotation.x = THREE.MathUtils.lerp(flightPitch, restPitch, fold);
        c.mat.opacity = activeCopies > 1 ? 1.25 / (1 + (activeCopies - 1) * blur * 0.85) : 1;
      });
    }
  };

  const applyAntenna = (a: AntennaRig, p: [number, number, number]) => {
    a.scape.rotation.set(a.base.x + p[1], a.base.y + p[0], 0);
    a.flagSegs.forEach((s, i) => {
      if (i > 0) s.rotation.x = p[2] * 0.06 * (1 + i * 0.1);
    });
  };

  const apply = (pose: Pose) => {
    root.position.copy(pose.pos);
    root.quaternion.copy(pose.quat);
    body.rotation.set(-pose.bodyPitch, 0, 0);
    head.rotation.set(0.25 + pose.headPitch, pose.headYaw, pose.headRoll);
    applyAntenna(antennae.R, pose.antR);
    applyAntenna(antennae.L, pose.antL);
    mandibles.forEach((m) => (m.rotation.z = -0.15 + pose.mandible * 0.55));
    // proboscis: folded (tucked backwards under the head) -> extended (forward/down)
    const p = THREE.MathUtils.clamp(pose.proboscis, 0, 1);
    prob0.rotation.x = THREE.MathUtils.lerp(Math.PI + 0.3, 0.95, p);
    prob1.rotation.x = THREE.MathUtils.lerp(Math.PI - 0.25, 0.12 + pose.glossa * 0.05, p);
    glossa.scale.z = THREE.MathUtils.lerp(0.35, 1, p) * (1 + pose.glossa * 0.12);
    glossa.position.z = pose.glossa * 0.02;
    for (const id of legIds) applyLeg(legs[id], pose.legs[id]);
    abdomen.rotation.set(-pose.abdPitch, pose.abdYaw, pose.abdRoll);
    abdSegs.forEach((g, i) => {
      g.position.z = -pose.breathe * 0.014 * i;
      const k = 1 + pose.breathe * 0.012;
      g.scale.set(k, k, 1);
    });
    sting.position.z = THREE.MathUtils.lerp(0.3, -0.04, pose.stinger);
    sting.visible = pose.stinger > 0.02;
    applyWings(pose);
    // pollen loads
    pollenLoads.forEach((l) => {
      l.visible = pose.pollenLoad > 0.02;
      const k = Math.max(0.001, pose.pollenLoad);
      l.scale.set(0.4 + 0.6 * k, k, 0.3 + 0.7 * k);
    });
    setBodyPollenVisible(pose.bodyPollen);
    // wax
    const ws = THREE.MathUtils.clamp(pose.waxScales, 0, 1);
    waxScales.forEach((s, i) => {
      // the first right scale is the one that gets carried away
      const taken = i === 0 && pose.waxCarry > 0.02;
      s.visible = ws > 0.02 && !taken;
      const k = ws * (0.85 + (i % 3) * 0.08);
      s.scale.setScalar(Math.max(0.001, k));
    });
    if (waxOnHind) waxOnHind.visible = pose.waxCarry > 0.02 && pose.waxCarry < 0.4;
    if (waxOnFore) waxOnFore.visible = pose.waxCarry >= 0.4 && pose.waxCarry < 0.68;
    waxBlob.visible = pose.waxCarry >= 0.68 || pose.waxWorked > 0.02;
    const wk = THREE.MathUtils.clamp(pose.waxWorked, 0, 1);
    waxBlob.scale.set(0.6 + wk * 0.5, 0.5 + wk * 0.3, 0.6 + wk * 0.4);
    (waxBlob.material as THREE.MeshPhysicalMaterial).opacity = 0.55 + wk * 0.45;
  };

  function setBodyPollenVisible(v: number) {
    for (const im of bodyPollen) im.count = Math.floor((im.userData.max as number) * THREE.MathUtils.clamp(v, 0, 1));
  }

  const honey = new THREE.Color('#ffb02e'); // hover
  const red = new THREE.Color('#e3261c'); // selected
  const black = new THREE.Color('#000000');
  let lastHighlight: AnatomyId | null = null;
  const setHighlight = (id: AnatomyId | null, pulse: number, selected = false) => {
    if (lastHighlight && lastHighlight !== id) {
      for (const m of partMaterials[lastHighlight] ?? []) {
        const mm = m as THREE.MeshStandardMaterial;
        mm.emissive.copy(black);
        mm.emissiveIntensity = 0;
      }
    }
    lastHighlight = id;
    if (!id) return;
    for (const m of partMaterials[id] ?? []) {
      const mm = m as THREE.MeshStandardMaterial;
      mm.emissive.copy(selected ? red : honey);
      mm.emissiveIntensity = selected ? 0.55 + 0.3 * pulse : 0.18 + 0.22 * pulse;
    }
  };

  return {
    root,
    body,
    head,
    abdomen,
    anchors,
    proboscisTip,
    partMaterials,
    apply,
    setHighlight,
    setBodyPollenVisible,
    dispose: () => {
      disposables.forEach((d) => d.dispose());
      root.traverse((o) => {
        if ((o as THREE.InstancedMesh).isInstancedMesh) (o as THREE.InstancedMesh).dispose();
      });
    },
  };
}
