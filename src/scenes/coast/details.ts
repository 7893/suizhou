import type { Points, Random } from "../../drawing/types.ts";
import { drawBoardwalk } from "./boardwalk.ts";
import { drawHeadland } from "./headland.ts";
import { beachPath } from "./shore.ts";
export function drawCoastDetails(
	ctx: CanvasRenderingContext2D,
	W: number,
	H: number,
	random: Random,
	mask: CanvasRenderingContext2D,
	portrait = false,
) {
	let material: string | null = null;
	function shape(points: Points, fill: string) {
		ctx.beginPath();
		points.forEach(([x, y], i: number) =>
			i ? ctx.lineTo(x, y) : ctx.moveTo(x, y),
		);
		ctx.closePath();
		ctx.fillStyle = fill;
		ctx.fill();
		if (material) {
			mask.beginPath();
			points.forEach(([x, y], i: number) =>
				i ? mask.lineTo(x, y) : mask.moveTo(x, y),
			);
			mask.closePath();
			mask.fillStyle = material;
			mask.fill();
		}
	}
	drawHeadland(ctx, W, H, random, portrait);
	// Right foreground: a second sweep of sand around the open boating channel.
	const beach = beachPath(W, H, 1);
	const sand = ctx.createLinearGradient(0, H * 0.85, 0, H);
	sand.addColorStop(0, "#f0ddad");
	sand.addColorStop(1, "#cbb57f");
	ctx.fillStyle = sand;
	ctx.fill(beach);
	mask.fillStyle = "#ff0000";
	mask.fill(beach);
	material = "#00ff00";
	// Weathered boulders at the waterline, each with a softly lit upper face.
	for (let i = 0; i < 9; i++) {
		const x = W * (0.92 + i * 0.012),
			y = H * (0.846 + Math.sin(i) * 0.006),
			r = W * (0.009 + random() * 0.009);
		shape(
			[
				[x - r, y],
				[x - r * 0.7, y - r * 0.6],
				[x + r * 0.1, y - r * 0.82],
				[x + r, y - r * 0.25],
				[x + r * 0.8, y + r * 0.16],
				[x - r * 0.5, y + r * 0.22],
			],
			"#67776b",
		);
		shape(
			[
				[x - r, y],
				[x - r * 0.7, y - r * 0.6],
				[x + r * 0.1, y - r * 0.82],
				[x + r * 0.6, y - r * 0.3],
			],
			"#96a18a",
		);
	}
	material = "#0000ff";
	drawBoardwalk(ctx, W, H, shape);
	function parasol(x: number, y: number, r: number) {
		ctx.fillStyle = "rgba(68,75,44,.13)";
		ctx.beginPath();
		ctx.ellipse(
			x + r * 0.2,
			y + r * 0.57,
			r * 0.85,
			r * 0.2,
			-0.2,
			0,
			Math.PI * 2,
		);
		ctx.fill();
		ctx.strokeStyle = "#88754e";
		ctx.lineWidth = 1.8;
		ctx.beginPath();
		ctx.moveTo(x, y);
		ctx.lineTo(x, y + r * 0.7);
		ctx.stroke();
		for (let i = 0; i < 6; i++) {
			const a = Math.PI + (i * Math.PI) / 6,
				z = a + Math.PI / 6;
			shape(
				[
					[x, y - r * 0.4],
					[x + Math.cos(a) * r, y + Math.sin(a) * r * 0.24],
					[x + Math.cos(z) * r, y + Math.sin(z) * r * 0.24],
				],
				i % 2 ? "#eee1bb" : "#b9b491",
			);
		}
		for (const offset of [-0.5, 0.45]) {
			const xx = x + r * offset,
				yy = y + r * 0.54;
			shape(
				[
					[xx - r * 0.18, yy],
					[xx + r * 0.08, yy - r * 0.04],
					[xx + r * 0.29, yy + r * 0.32],
					[xx - r * 0.04, yy + r * 0.38],
				],
				"#e5d7b0",
			);
			ctx.strokeStyle = "#8e7f56";
			ctx.lineWidth = 0.7;
			ctx.stroke();
		}
	}
	parasol(W * 0.73, H * 0.954, W * 0.036);
	parasol(W * 0.81, H * 0.915, W * 0.029);
	parasol(W * 0.96, H * 0.955, W * 0.04);
	// A few footprints give scale without crowding the beach.
	for (let i = 0; i < 15; i++) {
		const x = W * (0.69 + i * 0.009),
			y = H * (0.985 - i * 0.0035);
		ctx.fillStyle = "rgba(124,108,70,.22)";
		ctx.beginPath();
		ctx.ellipse(x, y, 1.3, 2.3, -0.6, 0, Math.PI * 2);
		ctx.fill();
	}
}
