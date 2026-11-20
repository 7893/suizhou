import type { Brush } from "../../drawing/types.ts";
import { createRocks } from "./rocks.ts";
import { paintBroadleaf } from "./vegetation.ts";

export function paintSettlement(tools: Brush, W: number, H: number) {
	const { ctx, between, brush, ink } = tools;
	for (let i = 0; i < 24; i++) {
		const x = W * between(0.06, 0.44),
			y = H * between(0.72, 0.735);
		paintBroadleaf(tools, x, y, between(7, 15), 0.22);
	}
	// A small tiled riverside hamlet provides scale behind the boat's route.
	for (let i = 0; i < 4; i++) {
		const x = W * (0.37 + i * 0.015),
			y = H * (0.728 + (i % 2) * 0.003);
		const s = W * 0.007;
		ctx.fillStyle = "rgba(232,227,211,.65)";
		ctx.fillRect(x - s * 0.65, y, s * 1.3, s * 0.85);
		brush(
			[
				[x - s, y],
				[x - s * 0.65, y - s * 0.13],
				[x, y - s * 0.48],
				[x + s * 0.72, y - s * 0.08],
				[x + s, y],
			],
			0.42,
			1,
		);
		ctx.fillStyle = ink(0.26);
		ctx.fillRect(x - s * 0.1, y + s * 0.24, s * 0.2, s * 0.5);
		// Faint wisp of hearth smoke curling from one hamlet roof.
		if (i === 1) {
			ctx.save();
			ctx.strokeStyle = "rgba(232,228,214,.36)";
			ctx.lineWidth = Math.max(1.2, s * 0.26);
			ctx.lineCap = "round";
			ctx.beginPath();
			ctx.moveTo(x + s * 0.22, y - s * 0.42);
			ctx.bezierCurveTo(
				x + s * 0.55,
				y - s * 1.4,
				x - s * 0.25,
				y - s * 2.5,
				x + s * 0.45,
				y - s * 3.8,
			);
			ctx.stroke();
			ctx.restore();
		}
	}
}

export function paintRiverbank(
	tools: Brush,
	W: number,
	H: number,
	portrait: boolean,
) {
	const { ctx, brush, between } = tools;
	const rock = createRocks(tools),
		base = H * 0.915;
	const end = W * (portrait ? 0.38 : 0.32);
	ctx.beginPath();
	ctx.moveTo(-15, base - H * 0.06);
	ctx.bezierCurveTo(
		end * 0.27,
		base - H * 0.065,
		end * 0.58,
		base - H * 0.005,
		end,
		base,
	);
	ctx.lineTo(end + W * 0.04, base + H * 0.01);
	ctx.lineTo(-15, base + H * 0.017);
	ctx.closePath();
	const wash = ctx.createLinearGradient(
		0,
		base - H * 0.07,
		0,
		base + H * 0.025,
	);
	wash.addColorStop(0, "rgba(69,86,61,.65)");
	wash.addColorStop(0.75, "rgba(106,120,85,.36)");
	wash.addColorStop(1, "rgba(126,134,103,0)");
	ctx.fillStyle = wash;
	ctx.fill();
	for (let i = 0; i < 12; i++)
		rock(
			W * between(-0.03, 0.2),
			base + between(-7, 2),
			between(20, 60),
			between(8, 20),
			0.45,
		);
	for (let i = 0; i < 160; i++) {
		const x = between(0, end * 0.78),
			y = base - H * 0.045 * (1 - x / end) + between(0, 7);
		brush(
			[
				[x, y],
				[x + between(-4, 4), y - between(2, 9)],
			],
			between(0.08, 0.26),
			0.7,
		);
	}
	brush(
		[
			[W * 0.83, H * 0.774],
			[W * 0.9, H * 0.767],
			[W, H * 0.762],
		],
		0.16,
		1.2,
	);
	for (let i = 0; i < 12; i++)
		paintBroadleaf(
			tools,
			W * between(0.87, 1.04),
			H * 0.771,
			between(5, 13),
			0.23,
		);
}
