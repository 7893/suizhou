// Local design coordinates, independent of viewport resolution.
export const BOAT_FRAME = { x: 28, y: 20, width: 76, height: 52 };
export const BOAT_LANTERN = { x: -18, y: -10, mast: -21, top: -15 };
// Shared actor texture contract: alpha carries ink coverage; red carries oar rim-light weight.
export const BOAT_MASK_COLORS = {
	COVERAGE_INK: 0x000000,
	OAR_HIGHLIGHT: 0xffffff,
} as const;
export const BEACH_RUN = {
	speed: 0.65,
	lag: 0.65,
	x: 0.115,
	range: 0.06,
	orbit: 0.008,
};
