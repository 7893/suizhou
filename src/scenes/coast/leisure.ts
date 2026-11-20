import { stroke } from "../../drawing/canvas.ts";

export function paintLounger(
	ctx: CanvasRenderingContext2D,
	W: number,
	H: number,
	portrait = false,
) {
	ctx.save();
	ctx.translate(W * (portrait ? 0.83 : 0.23), H * (portrait ? 0.96 : 0.969));
	const scale = (portrait ? W * 1.15 : W) / 1200;
	ctx.scale(portrait ? -scale : scale, scale);
	ctx.fillStyle = "#77684b33";
	ctx.beginPath();
	ctx.ellipse(2, 3, 23, 4, -0.12, 0, Math.PI * 2);
	ctx.fill();
	stroke(
		ctx,
		[
			[-20, -14],
			[-11, -3],
			[21, -3],
		],
		"#eddeb5",
		6,
	);
	stroke(
		ctx,
		[
			[-20, -15],
			[-11, -3],
			[21, -3],
		],
		"#7c755a",
		1,
	);
	stroke(
		ctx,
		[
			[-12, -3],
			[-15, 4],
		],
		"#7c755a",
		1.3,
	);
	stroke(
		ctx,
		[
			[15, -3],
			[18, 3],
		],
		"#7c755a",
		1.3,
	);
	// Reclining adult: warm skin, linen shorts, an unhurried outstretched pose.
	stroke(
		ctx,
		[
			[-12, -12],
			[-5, -6],
			[4, -6],
		],
		"#b38c67",
		3.2,
	);
	stroke(
		ctx,
		[
			[3, -6],
			[9, -5],
		],
		"#7f9790",
		4,
	);
	stroke(
		ctx,
		[
			[9, -5],
			[17, -6],
			[21, -5],
		],
		"#b38c67",
		2.2,
	);
	stroke(
		ctx,
		[
			[-8, -10],
			[-3, -4],
			[3, -5],
		],
		"#bd9973",
		1.5,
	);
	ctx.fillStyle = "#b38c67";
	ctx.beginPath();
	ctx.arc(-14, -15, 2.6, 0, Math.PI * 2);
	ctx.fill();
	ctx.fillStyle = "#e6d4a4";
	ctx.beginPath();
	ctx.ellipse(-15, -17, 5, 1.6, -0.3, 0, Math.PI * 2);
	ctx.fill();
	ctx.restore();
}

export function paintRestingChildren(
	ctx: CanvasRenderingContext2D,
	w: number,
	h: number,
) {
	for (let i = 0; i < 2; i++) {
		const x = w * (0.095 + i * 0.035),
			y = h * 0.95,
			s = Math.min(w, h) / 640;
		ctx.save();
		ctx.translate(x, y);
		ctx.scale(s, s);
		stroke(
			ctx,
			[
				[-2, -1],
				[0, -8],
				[3, -1],
			],
			"#817252",
			1.7,
		);
		stroke(
			ctx,
			[
				[0, -8],
				[0, -14],
			],
			i ? "#c4a56c" : "#758b8b",
			3.7,
		);
		stroke(
			ctx,
			[
				[-4, -8],
				[0, -12],
				[4, -9],
			],
			"#b88c63",
			1.2,
		);
		ctx.fillStyle = "#b88c63";
		ctx.beginPath();
		ctx.arc(0, -17, 2.3, 0, Math.PI * 2);
		ctx.fill();
		ctx.restore();
	}
}
