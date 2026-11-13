import type { Random } from "../../drawing/types.ts";
import { landformsByFormat } from "./composition.ts";
import { drawLandform } from "./landform.ts";

export function drawIslands(
	ctx: CanvasRenderingContext2D,
	W: number,
	H: number,
	random: Random,
	portrait = false,
) {
	const forms = landformsByFormat[portrait ? "portrait" : "landscape"];
	// Jiajing-inspired offshore island, separated from the mainland by open water.
	drawLandform(
		ctx,
		W,
		H,
		random,
		forms.distant,
		["#a0b5a2", "#8fa995", "#adbca5"],
		0.4,
	);
	drawLandform(
		ctx,
		W,
		H,
		random,
		forms.island,
		["#7a9d88", "#668d76", "#9eae8c"],
		0.55,
	);
	const left = forms.island.left + forms.island.span * 0.1;
	const right = forms.island.left + forms.island.span * 0.88;
	ctx.strokeStyle = "rgba(215,221,192,.65)";
	ctx.lineWidth = 0.8;
	ctx.beginPath();
	ctx.moveTo(W * left, H * forms.island.base);
	ctx.quadraticCurveTo(
		W * ((left + right) * 0.5),
		H * (forms.island.base + 0.002),
		W * right,
		H * forms.island.base,
	);
	ctx.stroke();
}
