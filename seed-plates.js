// Seed content for EmbedGuessr. Ten plates, all "off-manifold": the item you place
// is NEVER a member of the clusters shown — you reason about which cluster the model
// would file it nearest, by shape / colour / semantics. Coordinates are hand-authored
// (0–100 per axis) so the game plays well; swap in real UMAP output any time.
// Cluster colours use the Kuaishou neon palette.
const O = "#FF4906", C = "#00E5FF", P = "#7C3AED", M = "#FF006E", G = "#22C55E", Y = "#FBBF24", S = "#FF7A3D";

module.exports = [
  { id: "veh", dims: 2,
    clusters: [
      { name: "cars", color: O, c: [24, 66] }, { name: "buses", color: C, c: [58, 80] },
      { name: "trucks", color: G, c: [76, 48] }, { name: "trains", color: M, c: [34, 20] }],
    guess: { type: "icon", icon: "banana", name: "Banana", caption: "Not a vehicle." },
    t: [72, 90],
    why: "Yellow plus a long, gently curved body reads as a school bus to a vision model. Colour dominance and horizontal elongation drag it to the outer edge of the bus lobe — where nothing with wheels has ever been." },

  { id: "round", dims: 2,
    clusters: [
      { name: "pumpkins", color: S, c: [28, 30] }, { name: "basketballs", color: O, c: [70, 28] },
      { name: "oranges", color: Y, c: [72, 68] }, { name: "suns", color: M, c: [30, 72] }],
    guess: { type: "image", src: "/assets/xiaoliu.png", name: "Xiaoliu", caption: "Kuaishou mascot — off-manifold." },
    t: [58, 46],
    why: "A round, saturated-orange blob is the one thing every cluster here has in common, so Xiaoliu lands dead in the middle — pulled slightly toward basketballs and oranges by its smooth, uniform surface. It belongs to no class yet rhymes with all four." },

  { id: "animals", dims: 2,
    clusters: [
      { name: "cats", color: C, c: [26, 30] }, { name: "dogs", color: O, c: [30, 68] },
      { name: "horses", color: P, c: [72, 66] }, { name: "birds", color: Y, c: [70, 28] }],
    guess: { type: "icon", icon: "teddy", name: "Teddy bear", caption: "A toy, not an animal." },
    t: [24, 52],
    why: "Fur texture, two ears, a stubby four-limb body: the teddy sits right between cats and dogs. The model has no concept of 'toy' — it only sees a small furry pet-shaped thing, so it files it with household pets." },

  { id: "land", dims: 3,
    clusters: [
      { name: "mountains", color: C, c: [30, 30, 60] }, { name: "beaches", color: Y, c: [68, 34, 64] },
      { name: "forests", color: G, c: [36, 66, 40] }, { name: "deserts", color: S, c: [70, 64, 44] }],
    guess: { type: "icon", icon: "broccoli", name: "Broccoli", caption: "Food, not a landscape." },
    t: [40, 60, 82],
    why: "A dense green canopy on a short stalk is, to the encoder, a tiny forest. It lands near the forest lobe but floats high on the z-axis — a close-up object masquerading as a wide scene. In a flat 2-D map this outlier would collapse onto the forest blob; the third axis is what lets it stand apart." },

  { id: "fruit", dims: 2,
    clusters: [
      { name: "apples", color: M, c: [26, 30] }, { name: "grapes", color: P, c: [30, 70] },
      { name: "lemons", color: Y, c: [72, 30] }, { name: "cherries", color: O, c: [70, 70] }],
    guess: { type: "icon", icon: "tennis", name: "Tennis ball", caption: "Sports gear, not fruit." },
    t: [70, 44],
    why: "Round, matte, and a yellow-green that sits exactly on a lemon's hue — the tennis ball drifts straight to the lemon lobe. Strip away the fuzz and the seam lines and a model has very little left to tell them apart." },

  { id: "cloth", dims: 2,
    clusters: [
      { name: "t-shirts", color: C, c: [26, 66] }, { name: "dresses", color: M, c: [30, 26] },
      { name: "shoes", color: O, c: [72, 26] }, { name: "hats", color: Y, c: [72, 66] }],
    guess: { type: "image", src: "/assets/paipai.png", name: "PAIPAI", caption: "Kuaishou mascot — off-manifold." },
    t: [68, 34],
    why: "PAIPAI is a whole character, not a garment — but the encoder latches onto the most garment-like region it can find, and the big bright-white sneakers dominate the lower half of the figure. That footwear signal pulls the whole thing toward the shoes lobe." },

  { id: "instr", dims: 3,
    clusters: [
      { name: "guitars", color: O, c: [30, 30, 62] }, { name: "violins", color: Y, c: [64, 34, 68] },
      { name: "pianos", color: C, c: [36, 66, 40] }, { name: "drums", color: M, c: [70, 64, 44] }],
    guess: { type: "icon", icon: "fish", name: "A fish", caption: "An animal, not an instrument." },
    t: [56, 40, 62],
    why: "A curved body tapering into a narrow tail is, in pure silhouette, a violin: the bouts and the neck. With no sense of 'alive vs object', the encoder groups by outline alone and parks the fish alongside the string instruments." },

  { id: "elec", dims: 3,
    clusters: [
      { name: "laptops", color: C, c: [30, 30, 60] }, { name: "phones", color: P, c: [66, 34, 64] },
      { name: "cameras", color: O, c: [36, 66, 42] }, { name: "TVs", color: Y, c: [70, 64, 46] }],
    guess: { type: "image", src: "/assets/kuaishou-logo.png", name: "Kuaishou logo", caption: "A logo — off-manifold." },
    t: [40, 62, 50],
    why: "The mark is literally a stylised camera — a lens and a shutter. A model that has never heard of Kuaishou still reads that geometry and files the logo next to the cameras. Branding you recognise is, to the encoder, just another picture of a camera." },

  { id: "sky", dims: 2,
    clusters: [
      { name: "suns", color: Y, c: [28, 30] }, { name: "moons", color: C, c: [30, 70] },
      { name: "stars", color: P, c: [72, 30] }, { name: "clouds", color: S, c: [70, 70] }],
    guess: { type: "icon", icon: "egg", name: "Fried egg", caption: "Food, not a sky object." },
    t: [34, 36],
    why: "A round yellow disc on a soft white surround is a sun to any model that reasons from shape and colour. The fried egg slots next to the suns — the yolk is the giveaway, the white does the rest." },

  { id: "sea", dims: 3,
    clusters: [
      { name: "fish", color: C, c: [30, 30, 60] }, { name: "crabs", color: O, c: [66, 34, 64] },
      { name: "octopuses", color: P, c: [36, 66, 42] }, { name: "whales", color: M, c: [70, 64, 46] }],
    guess: { type: "icon", icon: "umbrella", name: "Umbrella", caption: "An object, not a sea creature." },
    t: [40, 60, 52],
    why: "A ribbed dome with spokes radiating from a central point is, structurally, an octopus: the mantle and its arms. The encoder matches the radial geometry and drops the umbrella right beside the octopuses." },
];
