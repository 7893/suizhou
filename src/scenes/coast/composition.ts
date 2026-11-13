export const coastLayout = {
	horizon: 0.475,
	sun: {
		landscape: [0.32, 0.28] as const,
		portrait: [0.27, 0.23] as const,
		radius: 0.035,
	},
} as const;

export const palmsByFormat = {
	landscape: [
		{ root: [0.035, 0.965], crown: [0.09, 0.495], phase: 0 },
		{ root: [-0.025, 0.945], crown: [0.145, 0.605], phase: 0.8 },
	],
	portrait: [
		{ root: [0.04, 0.965], crown: [0.155, 0.52], phase: 0 },
		{ root: [-0.03, 0.945], crown: [0.245, 0.625], phase: 0.8 },
	],
};

export const palms = palmsByFormat.landscape;

const islandProfile = [
	[0, 0],
	[0.12, 0.18],
	[0.25, 0.62],
	[0.43, 0.9],
	[0.56, 1],
	[0.7, 0.71],
	[0.85, 0.35],
	[1, 0],
];

const distantProfile = [
	[0, 0],
	[0.2, 0.24],
	[0.36, 0.6],
	[0.52, 0.54],
	[0.72, 1],
	[1, 0.75],
];

const headlandShore = [
	[0, 0],
	[0.2, 0.005],
	[0.42, 0.01],
	[0.72, -0.002],
	[1, -0.006],
];

const headlandProfile = [
	[0, 0],
	[0.14, 0.13],
	[0.3, 0.32],
	[0.45, 0.4],
	[0.6, 0.68],
	[0.75, 0.81],
	[0.88, 1],
	[1, 0.93],
];

export const landformsByFormat = {
	landscape: {
		island: {
			left: 0.57,
			span: 0.22,
			base: 0.491,
			height: 0.058,
			profile: islandProfile,
		},
		distant: {
			left: 0.83,
			span: 0.3,
			base: 0.481,
			height: 0.115,
			profile: distantProfile,
		},
		headland: {
			left: 0.79,
			span: 0.26,
			base: 0.627,
			height: 0.115,
			shore: headlandShore,
			profile: headlandProfile,
		},
	},
	portrait: {
		island: {
			left: 0.45,
			span: 0.3,
			base: 0.491,
			height: 0.048,
			profile: islandProfile,
		},
		distant: {
			left: 0.76,
			span: 0.36,
			base: 0.481,
			height: 0.088,
			profile: distantProfile,
		},
		headland: {
			left: 0.7,
			span: 0.35,
			base: 0.635,
			height: 0.092,
			shore: headlandShore,
			profile: headlandProfile,
		},
	},
};

export const landforms = landformsByFormat.landscape;

// Canvas and shader deformation share the exact same orientation-aware palm anchors.
const vec = (p: readonly number[]) =>
	`vec2(${p[0].toFixed(3)}, ${p[1].toFixed(3)})`;
export const palmAnchors = [0, 1]
	.map((i) => {
		const land = palmsByFormat.landscape[i];
		const port = palmsByFormat.portrait[i];
		return `
vec2 palmRoot${i}() { return u_size.x / u_size.y < 0.85 ? ${vec(port.root)} : ${vec(land.root)}; }
vec2 palmCrown${i}() { return u_size.x / u_size.y < 0.85 ? ${vec(port.crown)} : ${vec(land.crown)}; }
const float palmPhase${i} = ${land.phase.toFixed(2)};`;
	})
	.join("\n");
