import type { Random } from "../../drawing/types.ts";
import { landformsByFormat } from "./composition.ts";
import { drawLandform } from "./landform.ts";

export function drawHeadland(
	ctx: CanvasRenderingContext2D,
	W: number,
	H: number,
	random: Random,
	portrait = false,
) {
	const forms = landformsByFormat[portrait ? "portrait" : "landscape"];
	const { left, span, shore, ridge } = drawLandform(
		ctx,
		W,
		H,
		random,
		forms.headland,
		["#68856b", "#486e57", "#7e9168"],
		1.2,
	);
	// Uneven littoral rock shelves break the old perfectly smooth sand stripe.
	for (let i = 0; i < 85; i++) {
		const t = i / 85,
			x = left + span * t;
		const y = shore(t) + Math.sin(t * 12) * H * 0.0008;
		const r = W * (0.0015 + random() * 0.003);
		ctx.beginPath();
		ctx.moveTo(x - r, y);
		ctx.lineTo(x - r * 0.5, Math.max(ridge(t), y - r * 0.8));
		ctx.lineTo(x + r * 0.4, y - r * 0.55);
		ctx.lineTo(x + r, y + r * 0.16);
		ctx.closePath();
		ctx.fillStyle = i % 3 ? "#7b8974" : "#a1aa87";
		ctx.fill();
		if (i % 4 === 0) {
			ctx.strokeStyle = "rgba(218,227,200,.65)";
			ctx.lineWidth = 0.7;
			ctx.beginPath();
			ctx.moveTo(x - r, y + r * 0.3);
			ctx.lineTo(x + r * 0.7, y + r * 0.4);
			ctx.stroke();
		}
	}
}
