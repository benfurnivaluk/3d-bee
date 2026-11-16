import type { AnatomyEntry, AnatomyId } from '@/types/bee';

/**
 * Educational content for the anatomy explorer.
 * Written for a general audience. Figures quoted are ranges commonly reported in the
 * literature; where sources disagree the text says so. `review` records what still
 * needs sign-off from an apiologist / entomologist before publication.
 */
export const ANATOMY: AnatomyEntry[] = [
  {
    id: 'compoundEyes',
    name: 'Compound eyes',
    scientific: 'Oculi compositi',
    subject: 'Vision and visual detection',
    purpose:
      'Each eye is built from thousands of tiny optical units called ommatidia. Together they give a wide, mosaic view that is excellent at detecting movement, colour contrast and patterns on flowers.',
    fact:
      'Honey bees see ultraviolet light but are relatively insensitive to red, and specialised facets along the top edge of each eye detect polarised skylight, helping them navigate even when the sun is hidden.',
    view: { offset: [0.9, 0.25, 0.75], distance: 1.25 },
    review: 'literature-checked',
    modelNote: 'Facets are a procedural normal map; facet count and eye outline are approximate.',
  },
  {
    id: 'ocelli',
    name: 'Ocelli',
    scientific: 'Ocelli (three dorsal simple eyes)',
    subject: 'Light detection and orientation',
    purpose:
      'Three small, simple eyes sit in a triangle on top of the head. They do not form detailed images; instead they respond quickly to changes in light intensity.',
    fact:
      'The ocelli are thought to help with flight stability by sensing the horizon, and with judging light levels — useful when deciding whether it is still bright enough to forage around dawn and dusk.',
    view: { offset: [0.15, 1.0, 0.35], distance: 0.95 },
    review: 'literature-checked',
  },
  {
    id: 'antennae',
    name: 'Antennae',
    scientific: 'Antennae (scape, pedicel, flagellum)',
    subject: 'Smell, touch and sensory perception',
    purpose:
      'The elbowed antennae carry thousands of sensory structures for smell, taste, touch, humidity and temperature. A worker’s antenna has 12 segments: a long scape, a small pedicel and a ten-part flagellum.',
    fact:
      'Inside the pedicel sits Johnston’s organ, which senses tiny vibrations and air movements — one of the ways bees following a waggle dance pick up information from the dancer.',
    view: { offset: [0.7, 0.55, 0.8], distance: 1.2 },
    review: 'literature-checked',
  },
  {
    id: 'mandibles',
    name: 'Mandibles',
    scientific: 'Mandibulae',
    subject: 'Handling materials and other tasks',
    purpose:
      'The paired jaws open sideways. Workers use them to shape wax, carry debris, clean cells, groom nestmates, handle propolis and bite intruders.',
    fact:
      'A worker’s mandibles are smooth and spoon-shaped — well suited to moulding wax — whereas a queen’s are notched. Glands at the base of the worker’s mandibles contribute fatty acids to the food fed to young larvae.',
    view: { offset: [0.35, -0.3, 1.0], distance: 0.9 },
    review: 'literature-checked',
  },
  {
    id: 'proboscis',
    name: 'Proboscis',
    scientific: 'Proboscis (glossa, galeae, labial palps)',
    subject: 'Collecting liquid food',
    purpose:
      'When feeding, the bee unfolds a tongue assembly from under its head. The hairy central tongue (glossa) moves rapidly back and forth, lapping nectar, honey or water, while sheath-like mouthparts form a tube to draw the liquid up.',
    fact:
      'The honey bee does not simply suck through a straw: liquid is trapped between the glossa’s hairs and then pulled in. Fully extended, a worker’s proboscis is roughly 5–7 mm long, varying between subspecies.',
    view: { offset: [0.9, -0.35, 0.45], distance: 1.3 },
    review: 'literature-checked',
    modelNote: 'Proboscis is a simplified three-part chain; galeae and labial palps are not separated.',
  },
  {
    id: 'thorax',
    name: 'Thorax',
    scientific: 'Mesosoma (thorax + propodeum)',
    subject: 'Locomotion and flight',
    purpose:
      'The thorax is the engine room. It carries all six legs and four wings and is packed with powerful flight muscles. In bees it also includes the first abdominal segment (the propodeum), fused behind the true thorax.',
    fact:
      'The main flight muscles do not attach to the wings. They distort the whole thoracic box, which drives the wings at around 230 beats per second. Bees can also disengage the wings and shiver these muscles to generate heat.',
    view: { offset: [0.85, 0.75, 0.2], distance: 1.6 },
    review: 'literature-checked',
  },
  {
    id: 'forewings',
    name: 'Forewings',
    scientific: 'Alae anteriores',
    subject: 'Flight and wing venation',
    purpose:
      'The larger front pair of wings provides most of the lift. Their thin membrane is stiffened by a network of veins that also carry haemolymph and nerves.',
    fact:
      'Honey bee wings beat with a relatively short stroke at a very high frequency. The pattern of wing veins is so consistent that measurements such as the “cubital index” are used to help distinguish honey bee subspecies.',
    view: { offset: [0.7, 1.15, -0.25], distance: 2.2 },
    review: 'needs-expert-review',
    modelNote: 'Venation is a hand-drawn approximation of the Apis pattern and must be checked against specimens.',
  },
  {
    id: 'hindwings',
    name: 'Hindwings',
    scientific: 'Alae posteriores',
    subject: 'Flight and wing coupling',
    purpose:
      'The smaller hindwings sit behind and beneath the forewings. In flight they hook onto the forewings so each pair beats as a single aerodynamic surface.',
    fact:
      'At rest the wings unhook and fold back over the abdomen, letting the bee move easily through narrow spaces in the hive.',
    view: { offset: [0.9, 1.0, -0.5], distance: 2.0 },
    review: 'needs-expert-review',
  },
  {
    id: 'hamuli',
    name: 'Wing hooks',
    scientific: 'Hamuli',
    subject: 'Wing coupling',
    purpose:
      'A row of tiny hooks along the front edge of each hindwing catches a fold on the rear edge of the forewing, coupling the two wings together during flight.',
    fact:
      'A honey bee hindwing typically has around twenty hamuli. The count varies between individuals and is one of the characters used in bee morphometrics.',
    view: { offset: [0.35, 0.9, 0.1], distance: 0.9 },
    review: 'needs-expert-review',
    modelNote: 'Hooks are visible only at macro distance; the coupling fold on the forewing is not modelled.',
  },
  {
    id: 'frontLegs',
    name: 'Front legs',
    scientific: 'Pedes anteriores (prothoracic legs)',
    subject: 'Grooming and locomotion',
    purpose:
      'Every leg has the same basic parts — coxa, trochanter, femur, tibia, five tarsal segments and claws. The front legs walk, hold on and groom the head, eyes and antennae.',
    fact:
      'Each front leg carries an antenna cleaner: a semicircular notch on the first tarsal segment closed by a spur from the tibia. The bee pulls its antenna through it like a comb.',
    view: { offset: [0.95, -0.4, 0.75], distance: 1.4 },
    review: 'literature-checked',
  },
  {
    id: 'middleLegs',
    name: 'Middle legs',
    scientific: 'Pedes medii (mesothoracic legs)',
    subject: 'Locomotion and pollen handling',
    purpose:
      'The middle legs support walking and help move pollen backwards from the front legs and body towards the hind legs during grooming.',
    fact:
      'The middle leg has a spur at the end of its tibia; beekeeping texts often describe it being used to help prise pollen loads out of the baskets when they are unloaded into a cell.',
    view: { offset: [1.0, -0.45, 0.1], distance: 1.5 },
    review: 'needs-expert-review',
  },
  {
    id: 'hindLegs',
    name: 'Hind legs',
    scientific: 'Pedes posteriores (metathoracic legs)',
    subject: 'Pollen collection and transport',
    purpose:
      'The long hind legs are pollen-handling tools. Stiff bristles on the broad first tarsal segment comb pollen from the body, and a press between tibia and tarsus pushes it up into the pollen basket.',
    fact:
      'The “pollen press” works like a piston: a comb of spines (rastellum) on one leg scrapes pollen onto a shelf (auricle), and flexing the joint squeezes it upward into the basket on the outside of the tibia.',
    view: { offset: [1.0, -0.2, -0.45], distance: 1.6 },
    review: 'literature-checked',
  },
  {
    id: 'corbiculae',
    name: 'Pollen baskets',
    scientific: 'Corbiculae',
    subject: 'Pollen and propolis transport',
    purpose:
      'A smooth, slightly concave area on the outer face of each hind tibia, fringed with long curved hairs. Pollen moistened with nectar or saliva is packed here into a compact load.',
    fact:
      'A single long bristle in the centre of the basket helps anchor the load. The same baskets are used to carry propolis — plant resin used to seal and protect the hive.',
    view: { offset: [1.0, -0.1, -0.3], distance: 1.05 },
    review: 'literature-checked',
  },
  {
    id: 'abdomen',
    name: 'Abdomen',
    scientific: 'Metasoma (gaster)',
    subject: 'Digestion, storage and other internal functions',
    purpose:
      'The banded rear section holds the honey stomach (crop) for carrying nectar and water, the digestive tract, wax glands, scent glands and the sting apparatus. Overlapping plates — tergites above and sternites below — let it flex and telescope.',
    fact:
      'Rhythmic pumping of the abdomen helps move air through the bee’s breathing tubes. Workers have four pairs of wax glands on the underside of the abdomen.',
    view: { offset: [0.85, 0.45, -0.5], distance: 2.0 },
    review: 'literature-checked',
    modelNote: 'Banding is typical of yellow-banded European strains; colouration varies widely between subspecies.',
  },
  {
    id: 'spiracles',
    name: 'Spiracles',
    scientific: 'Spiracula',
    subject: 'Respiratory openings',
    purpose:
      'Bees have no lungs. Small openings along the sides of the thorax and abdomen lead into a branching network of air tubes (tracheae) that carry oxygen directly to the tissues.',
    fact:
      'A honey bee has ten pairs of spiracles. The tracheal mite Acarapis woodi enters through the first thoracic pair and lives inside the breathing tubes.',
    view: { offset: [1.0, 0.1, -0.15], distance: 1.0 },
    review: 'needs-expert-review',
    modelNote: 'Only representative spiracles are shown; exact positions need specimen reference.',
  },
  {
    id: 'stinger',
    name: 'Stinger',
    scientific: 'Aculeus (sting apparatus)',
    subject: 'Defensive anatomy',
    purpose:
      'The sting is a modified egg-laying tube, so only females have one. It normally stays hidden inside a chamber at the tip of the abdomen and is extended only when the bee defends itself or the colony.',
    fact:
      'The worker’s sting lancets carry backward-facing barbs. In the elastic skin of mammals the sting usually lodges and tears away from the bee, which is fatal for her; against other insects she can often withdraw it.',
    view: { offset: [0.6, 0.15, -0.9], distance: 1.0 },
    review: 'literature-checked',
    modelNote: 'Shown retracted by default. Toggle “Show sting” to extend it for study.',
  },
];

export const ANATOMY_BY_ID: Record<AnatomyId, AnatomyEntry> = Object.fromEntries(
  ANATOMY.map((a) => [a.id, a]),
) as Record<AnatomyId, AnatomyEntry>;
