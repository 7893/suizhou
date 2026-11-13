export interface KarstPeak {
	x: number;
	foot: number;
	width: number;
	height: number;
	strength: number;
	variant: number;
}

const peak = (
	x: number,
	foot: number,
	width: number,
	height: number,
	strength: number,
	variant: number,
): KarstPeak => ({ x, foot, width, height, strength, variant });

// Shared layout anchors between the WebGL shader and Canvas 2D static fallback.
export const inkLayout = {
	sun: {
		portrait: [0.32, 0.12] as const,
		landscape: [0.72, 0.205] as const,
		radius: 0.039,
	},
	waterline: 0.73,
	staticReflectionScale: -0.5,
} as const;

// Each format is composed independently so peaks never squeeze the inscription.
export const compositions: Record<
	"landscape" | "portrait",
	Record<"far" | "middle" | "near", KarstPeak[]>
> = {
	landscape: {
		far: [
			peak(0.54, 0.69, 0.24, 0.29, 0.18, 1),
			peak(0.7, 0.7, 0.19, 0.2, 0.14, 2),
			peak(0.9, 0.7, 0.28, 0.25, 0.16, 0),
		],
		middle: [
			peak(0.14, 0.72, 0.25, 0.34, 0.36, 2),
			peak(0.4, 0.715, 0.23, 0.36, 0.3, 1),
			peak(0.79, 0.73, 0.2, 0.22, 0.23, 2),
			peak(1.01, 0.73, 0.24, 0.32, 0.3, 0),
		],
		near: [
			peak(0.01, 0.738, 0.25, 0.29, 0.58, 1),
			peak(0.235, 0.736, 0.235, 0.48, 0.69, 0),
			peak(0.405, 0.741, 0.21, 0.27, 0.51, 2),
			peak(0.96, 0.742, 0.24, 0.25, 0.43, 1),
		],
	},
	portrait: {
		far: [
			peak(0.48, 0.68, 0.5, 0.34, 0.18, 1),
			peak(0.89, 0.7, 0.38, 0.22, 0.15, 2),
		],
		middle: [
			peak(0.08, 0.71, 0.48, 0.36, 0.35, 2),
			peak(0.49, 0.722, 0.39, 0.28, 0.29, 1),
			peak(1, 0.73, 0.37, 0.24, 0.25, 0),
		],
		near: [
			peak(0.045, 0.738, 0.56, 0.39, 0.65, 0),
			peak(0.37, 0.741, 0.41, 0.25, 0.51, 2),
			peak(1.035, 0.745, 0.44, 0.21, 0.4, 1),
		],
	},
};

export const peakProfiles = [
	[
		[0, 0],
		[0.11, 0.15],
		[0.23, 0.47],
		[0.32, 0.84],
		[0.42, 0.96],
		[0.53, 1],
		[0.63, 0.88],
		[0.73, 0.56],
		[0.85, 0.16],
		[1, 0],
	],
	[
		[0, 0],
		[0.12, 0.13],
		[0.23, 0.49],
		[0.34, 0.87],
		[0.46, 1],
		[0.55, 0.94],
		[0.64, 0.64],
		[0.76, 0.36],
		[0.88, 0.12],
		[1, 0],
	],
	[
		[0, 0],
		[0.13, 0.2],
		[0.26, 0.55],
		[0.36, 0.9],
		[0.44, 0.96],
		[0.52, 0.87],
		[0.64, 0.92],
		[0.75, 0.73],
		[0.85, 0.24],
		[1, 0],
	],
];
