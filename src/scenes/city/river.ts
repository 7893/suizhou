import { glow, stroke } from "../../drawing/canvas.ts";
import { cityLayout } from "./composition.ts";
import { drawRiverTerrace } from "./terrace.ts";

function drawNearBankLanterns(
	k: CanvasRenderingContext2D,
	W: number,
	H: number,
	portrait: boolean,
) {
	const xs = cityLayout.nearLamps[portrait ? "portrait" : "landscape"];
	// Subtle stone coping along the right near bank ("两岸灯相照").
	stroke(
		k,
		[
			[W * 0.71, H * 0.996],
			[W * 0.83, H * 0.958],
			[W, H * 0.902],
		],
		"rgba(96,112,108,.28)",
		1.4,
	);
	xs.forEach((nx, idx) => {
		const t = (nx - 0.69) / 0.31;
		const x = W * nx;
		const y = H * (0.992 - t * 0.088);
		const postH = Math.max(8, H * (0.016 - idx * 0.001));
		// Soft amber pool on the stone path and bollard post.
		glow(k, x, y - postH * 0.7, 16, "rgba(246,194,112,.20)");
		k.fillStyle = "#192d31";
		k.fillRect(x - 1.6, y - postH, 3.2, postH + 2);
		k.fillStyle = "rgba(250,214,148,.88)";
		k.fillRect(x - 1.4, y - postH + 1.2, 2.8, 2.4);
	});
}

export function drawRiver({
	b,
	l,
	k,
	W,
	H,
	portrait,
	random,
	tree,
}: {
	b: CanvasRenderingContext2D;
	l: CanvasRenderingContext2D;
	k: CanvasRenderingContext2D;
	W: number;
	H: number;
	portrait: boolean;
	random: () => number;
	tree: ReturnType<typeof import("./trees.ts").createTrees>;
}) {
	// The opposite promenade lies behind the waterline, so its lights reflect naturally.
	b.fillStyle = "#162b2d";
	b.fillRect(0, H * 0.582, W, H * 0.058);
	for (let i = 0; i < 58; i++)
		tree(b, (i * W) / 57, H * 0.613, H * (0.035 + random() * 0.055));
	for (let j = 0; j < 4; j++)
		stroke(
			b,
			[
				[0, H * (0.619 + j * 0.005)],
				[W, H * (0.619 + j * 0.005)],
			],
			j === 0 ? "#4a4940" : "#253734",
			1.3,
		);
	stroke(
		l,
		[
			[0, H * 0.63],
			[W, H * 0.63],
		],
		"rgba(229,180,103,.38)",
		1.1,
	);
	for (let i = 0; i < 29; i++) {
		const x = (i * W) / 28 + random() * 8,
			y = H * 0.615;
		stroke(
			b,
			[
				[x, y],
				[x, y - H * 0.026],
			],
			"#53605b",
			0.85,
		);
		glow(l, x, y - H * 0.026, 12, "rgba(246,202,128,.25)");
		l.fillStyle = "#ead2a3";
		l.fillRect(x - 1, y - H * 0.026, 2, 1.5);
		// Tiny pedestrians, in pairs and alone.
		if (i % 3 !== 0) {
			const px = x + 11;
			b.fillStyle = "#0b1c20";
			b.beginPath();
			b.arc(px, y - 6, 1.2, 0, Math.PI * 2);
			b.fill();
			stroke(
				b,
				[
					[px, y - 4],
					[px, y + 1],
				],
				"#0b1c20",
				1.5,
			);
		}
	}
	// Sculpted stone piers and warm arch-vault lighting beneath the illuminated footbridge.
	const left = W * 0.42,
		right = W * 0.92,
		deck = H * 0.608,
		arch = H * 0.031;
	for (const pierT of [0.02, 0.28, 0.72, 0.98]) {
		const px = left + (right - left) * pierT;
		const py = deck - 2 * arch * pierT * (1 - pierT) + 7;
		const pw = Math.max(5, W * 0.0075);
		b.fillStyle = "#122429";
		b.fillRect(px - pw * 0.5, py, pw, H * 0.641 - py);
		glow(l, px, H * 0.634, 14, "rgba(244,190,108,.22)");
	}
	for (const vaultT of [0.15, 0.5, 0.85]) {
		const vx = left + (right - left) * vaultT;
		const vy = deck - 2 * arch * vaultT * (1 - vaultT) + 9;
		glow(l, vx, vy + 3, 22, "rgba(248,196,116,.19)");
	}
	b.beginPath();
	b.moveTo(left, deck + 8);
	b.quadraticCurveTo((left + right) / 2, deck - arch, right, deck + 8);
	b.lineTo(right, deck + 15);
	b.quadraticCurveTo((left + right) / 2, deck - arch + 8, left, deck + 15);
	b.closePath();
	b.fillStyle = "#182c31";
	b.fill();
	for (let i = 0; i <= 60; i++) {
		const t = i / 60,
			x = left + (right - left) * t,
			y = deck - 2 * arch * t * (1 - t);
		stroke(
			b,
			[
				[x, y - 7],
				[x, y + 5],
			],
			"rgba(132,143,131,.45)",
			0.7,
		);
		glow(l, x, y + 6, 4, "rgba(235,183,113,.15)");
	}
	for (const [offset, color] of [
		[-7, "rgba(209,199,161,.32)"],
		[6, "rgba(246,185,99,.72)"],
	] as const) {
		l.beginPath();
		l.moveTo(left, deck + offset);
		l.quadraticCurveTo(
			(left + right) / 2,
			deck - arch + offset,
			right,
			deck + offset,
		);
		l.strokeStyle = color;
		l.lineWidth = 1.2;
		l.stroke();
	}
	drawRiverTerrace(b, l, W, H);
	// A shaded near bank frames the water without crossing the boat's horizontal route.
	k.beginPath();
	k.moveTo(0, H * 0.89);
	k.bezierCurveTo(W * 0.15, H * 0.92, W * 0.18, H * 0.97, W * 0.43, H);
	k.lineTo(0, H);
	k.closePath();
	k.fillStyle = "#0a1c20";
	k.fill();
	k.beginPath();
	k.moveTo(W, H * 0.895);
	k.bezierCurveTo(W * 0.89, H * 0.93, W * 0.82, H * 0.98, W * 0.69, H);
	k.lineTo(W, H);
	k.closePath();
	k.fill();
	drawNearBankLanterns(k, W, H, portrait);
	for (let i = 0; i < 4; i++) {
		const x = W * (-0.035 + i * 0.033),
			y = H * (0.91 + i * 0.015);
		tree(k, x, y, H * (0.21 + random() * 0.045), true);
	}
	tree(k, W * 1.015, H * 0.915, H * 0.19, true);
	// Scattered grass blades and textured stones at the viewer's feet.
	for (let i = 0; i < 500; i++) {
		const x = random() * W,
			y = H * (0.95 + random() * 0.05);
		if (x > W * 0.25 && x < W * 0.83) continue;
		stroke(
			k,
			[
				[x, y],
				[x + (random() - 0.5) * 7, y - random() * 10],
			],
			"rgba(40,56,45,.38)",
			0.6,
		);
	}
}
