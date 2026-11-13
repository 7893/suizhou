import { contourAt, silhouette } from "../../drawing/contour.ts";
import type { Brush } from "../../drawing/types.ts";
import type { KarstPeak } from "./composition.ts";
import { peakProfiles } from "./composition.ts";
import { paintLimestone } from "./limestone.ts";

export function paintKarst(
	tools: Brush,
	W: number,
	H: number,
	peak: KarstPeak,
) {
	const { ctx, noise, brush } = tools;
	const { x, foot, width, height, strength, variant } = peak;
	const span = width * W,
		elevation = height * H,
		base = foot * H;
	const left = x * W - span / 2;
	const ridge = (t: number) =>
		base -
		elevation *
			Math.max(
				0,
				contourAt(peakProfiles[variant], t) +
					Math.sin(t * Math.PI) *
						(noise(t * 36, x * 19) * 0.009 + noise(t * 109, variant) * 0.003),
			);
	const path = silhouette(left, span, base + 2, ridge);
	ctx.save();
	ctx.clip(path);
	const wash = ctx.createLinearGradient(
		left,
		base - elevation,
		left + span,
		base,
	);
	wash.addColorStop(0, `rgba(61,83,68,${strength * 0.77})`);
	wash.addColorStop(0.45, `rgba(91,109,86,${strength * 0.56})`);
	wash.addColorStop(0.85, `rgba(111,122,97,${strength * 0.38})`);
	wash.addColorStop(1, `rgba(129,136,109,${strength * 0.12})`);
	ctx.fillStyle = wash;
	ctx.fill(path);
	paintLimestone(tools, { left, span, base, elevation, strength, ridge });
	ctx.restore();
	for (let i = 6; i < 153; i += 4) {
		const t = i / 160;
		brush(
			[
				[left + span * t, ridge(t)],
				[left + span * (t + 0.0125), ridge(t + 0.0125)],
			],
			strength * 0.2,
			0.7,
		);
	}
}
