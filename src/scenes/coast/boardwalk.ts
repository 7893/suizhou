import { stroke } from "../../drawing/canvas.ts";
import type { Points } from "../../drawing/types.ts";
import { createPierGeometry } from "./pier.ts";

export function drawBoardwalk(
	ctx: CanvasRenderingContext2D,
	W: number,
	H: number,
	shape: (points: Points, fill: string) => void,
) {
	// PerspectiveMesh's own geometry projects every plank and support consistently.
	const mesh = createPierGeometry(W, H),
		vertices = mesh.positions;
	const point = (column: number, row: number): [number, number] => {
		const i = (row * mesh.verticesX + column) * 2;
		return [vertices[i], vertices[i + 1]];
	};
	const scale = Math.min(W, H) / 700;
	try {
		// Soft cast shadow from the upper-left coastal sun onto the shallow water and beach.
		const s0 = point(0, 0),
			s1 = point(24, 0),
			s2 = point(24, 2),
			s3 = point(0, 2);
		const sx = 9 * scale,
			sy = 14 * scale;
		ctx.save();
		ctx.fillStyle = "rgba(22, 62, 58, 0.17)";
		ctx.beginPath();
		ctx.moveTo(s0[0] + sx * 0.7, s0[1] + sy * 0.85);
		ctx.lineTo(s1[0] + sx, s1[1] + sy);
		ctx.lineTo(s2[0] + sx, s2[1] + sy * 1.1);
		ctx.lineTo(s3[0] + sx * 0.7, s3[1] + sy * 0.95);
		ctx.closePath();
		ctx.fill();
		ctx.restore();
		// Paired posts, with the near-side beam following the very same projected edge.
		for (const column of [1, 7, 13, 19, 24]) {
			const depth = 0.7 + column / 80,
				drop = 17 * scale * depth,
				radius = 1.8 * scale * depth;
			for (const row of [0, 2]) {
				const [x, y] = point(column, row);
				ctx.fillStyle = "#405f5524";
				ctx.beginPath();
				ctx.ellipse(
					x + drop * 0.18,
					y + drop,
					radius * 4,
					radius,
					-0.1,
					0,
					Math.PI * 2,
				);
				ctx.fill();
				shape(
					[
						[x - radius, y],
						[x + radius, y],
						[x + radius, y + drop],
						[x - radius, y + drop],
					],
					"#74654a",
				);
				stroke(
					ctx,
					[
						[x - radius * 0.5, y],
						[x - radius * 0.5, y + drop],
					],
					"#c0aa7d",
					scale * 0.7,
				);
			}
		}
		const a = point(0, 2),
			b = point(24, 2);
		shape(
			[a, b, [b[0], b[1] + scale * 3.2], [a[0], a[1] + scale * 2]],
			"#756348",
		);
		for (let column = 0; column < 24; column++) {
			const a = point(column, 0),
				b = point(column + 1, 0),
				c = point(column + 1, 2),
				d = point(column, 2);
			shape(
				[a, b, c, d],
				["#ad976f", "#b29b72", "#a9926a", "#b5a079"][column % 4],
			);
			stroke(ctx, [a, d], "#645b4266", 0.7 * scale);
			stroke(
				ctx,
				[point(column, 1), point(column + 1, 1)],
				"#e4ce9b33",
				0.6 * scale,
			);
		}
		stroke(ctx, [point(0, 0), point(24, 0)], "#ddc99a", 0.8 * scale);
	} finally {
		mesh.destroy();
	}
}
