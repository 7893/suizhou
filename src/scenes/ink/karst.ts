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
	wash.addColorStop(0, `rgba(58,80,67,${strength * 0.78})`);
	wash.addColorStop(0.45, `rgba(89,107,85,${strength * 0.56})`);
	wash.addColorStop(0.82, `rgba(116,121,95,${strength * 0.36})`);
	wash.addColorStop(1, `rgba(136,134,107,${strength * 0.12})`);
	ctx.fillStyle = wash;
	ctx.fill(path);
	// Subtle Qianjiang (light-ochre) sunlit warmth along the upper right flank facing the pale sun.
	const sunRim = ctx.createLinearGradient(
		left + span * 0.38,
		base - elevation,
		left + span * 0.96,
		base - elevation * 0.12,
	);
	sunRim.addColorStop(0, "rgba(176,132,96,0)");
	sunRim.addColorStop(0.55, `rgba(176,132,96,${strength * 0.13})`);
	sunRim.addColorStop(1, `rgba(196,154,114,${strength * 0.22})`);
	ctx.fillStyle = sunRim;
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
