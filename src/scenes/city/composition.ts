// A composed view along the Liangma River; distant CBD silhouettes are compressed.
export const cityLayout = {
	waterline: 0.64,
	staticReflectionScale: -0.62,
	nearLamps: {
		landscape: [0.79, 0.885, 0.955] as const,
		portrait: [0.76, 0.875, 0.955] as const,
	},
} as const;

export const skyline = {
	landscape: {
		tower: { x: 0.47, top: 0.275, width: 0.047 },
		angled: { x: 0.66, top: 0.405, width: 0.1, height: 0.185 },
	},
	portrait: {
		tower: { x: 0.43, top: 0.315, width: 0.089 },
		angled: { x: 0.68, top: 0.445, width: 0.16, height: 0.145 },
	},
};
