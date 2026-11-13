import { canvasLayer, seededRandom } from "../../drawing/canvas.ts";
import { palmsByFormat } from "./composition.ts";
import { drawCoastDetails } from "./details.ts";
import { drawIslands } from "./islands.ts";
import { paintLounger } from "./leisure.ts";
import { paintPalm } from "./palms.ts";
import { beachPath } from "./shore.ts";

// A warm island cove: foreground palms and sand, with all water drawn on GPU.
export function createCoast(width: number, height: number) {
	const portrait = width / height < 0.85;
	const W = portrait ? 780 : 1200;
	const H = (W * height) / width;
	const base = canvasLayer(width, height, W),
		canvas = base.canvas;
	const ctx = base.ctx;
	const random = seededRandom(914);
	const sand = ctx.createLinearGradient(0, H * 0.84, 0, H);
	sand.addColorStop(0, "#e9d4a4");
	sand.addColorStop(1, "#bca97b");
	const path = beachPath(W, H, 0);
	ctx.fillStyle = sand;
	ctx.fill(path);
	const material = canvasLayer(width, height, W);
	material.ctx.fillStyle = "#ff0000";
	material.ctx.fill(path);
	ctx.save();
	ctx.clip(path);
	for (let i = 0; i < 5000; i++) {
		ctx.fillStyle =
			random() > 0.5 ? "rgba(255,244,207,.14)" : "rgba(94,82,44,.08)";
		ctx.fillRect(
			random() * W,
			H * (0.85 + random() * 0.15),
			1 + random() * 2,
			0.7,
		);
	}
	ctx.restore();
	drawIslands(ctx, W, H, random, portrait);
	drawCoastDetails(ctx, W, H, random, material.ctx, portrait);
	paintLounger(ctx, W, H);
	const palmLayers = [];
	for (const { root, crown } of palmsByFormat[
		portrait ? "portrait" : "landscape"
	])
		for (const foliage of [false, true]) {
			const layer = canvasLayer(width, height, W);
			paintPalm(
				layer.ctx,
				random,
				root[0] * W,
				root[1] * H,
				(root[1] - crown[1]) * H,
				(crown[0] - root[0]) * W,
				foliage,
			);
			palmLayers.push(layer.canvas);
		}
	return {
		layers: {
			foreground: canvas,
			trunk0: palmLayers[0],
			leaves0: palmLayers[1],
			trunk1: palmLayers[2],
			leaves1: palmLayers[3],
			shore: material.canvas,
		},
		width,
		height,
		portrait,
	};
}
