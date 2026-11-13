import type { Painting, Scene, SceneName } from "./types.ts";

const surfaces = {
	garden: { top: 0.67, bottom: 1, solids: ["bank", "foliage", "buildings"] },
	ink: { top: 0.745, bottom: 0.96, solids: ["near", "shore", "foliage"] },
	city: { top: 0.65, bottom: 1, solids: ["bank"] },
	coast: {
		top: 0.49,
		bottom: 1,
		solids: ["foreground", "trunk0", "leaves0", "trunk1", "leaves1"],
	},
};

const masks = new WeakMap<Painting, CanvasRenderingContext2D>();

function solidMask(painting: Painting, keys: string[]) {
	let ctx = masks.get(painting);
	if (ctx) return ctx;
	const mask = document.createElement("canvas");
	mask.width = Math.min(painting.width, 640);
	mask.height = Math.min(painting.height, 640);
	ctx = mask.getContext("2d", { willReadFrequently: true })!;
	for (const key of keys)
		ctx.drawImage(painting.layers[key], 0, 0, mask.width, mask.height);
	masks.set(painting, ctx);
	return ctx;
}

export function hitWater(
	painting: Scene,
	name: SceneName,
	x: number,
	y: number,
	boatX = painting.boatCenter[0],
) {
	if (name === "room") return false;
	const surface = surfaces[name];
	if (!surface || x < 0 || x >= 1 || y <= surface.top || y >= surface.bottom)
		return false;
	const W = painting.portrait ? 760 : 1600,
		H = (W * painting.height) / painting.width;
	const offshore =
		name === "coast" ? Math.max(0, Math.min(1, (boatX - 0.48) / 0.22)) : 0;
	const depth = offshore * offshore * (3 - 2 * offshore);
	const scale = (painting.portrait ? 1.35 : 1.6) * (1 - depth * 0.18);
	const localX = ((x - boatX) * W) / scale;
	const localY = ((y - (painting.boatCenter[1] - depth * 0.105)) * H) / scale;
	if (localX >= -25 && localX <= 36 && localY >= -10 && localY <= 8)
		return false;
	const ctx = solidMask(painting.get(name), surface.solids);
	const pixel = ctx.getImageData(
		Math.floor(x * ctx.canvas.width),
		Math.floor(y * ctx.canvas.height),
		1,
		1,
	).data;
	return pixel[3] < 32;
}
