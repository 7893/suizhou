import { glow } from "../../drawing/canvas.ts";
import { skyline } from "./composition.ts";
// Artistic compression of Beijing's skyline, not a literal viewpoint from the river.
export function drawBeijingSkyline(
	b: CanvasRenderingContext2D,
	l: CanvasRenderingContext2D,
	W: number,
	H: number,
) {
	const layout = skyline[W / H < 0.85 ? "portrait" : "landscape"];
	const x = W * layout.tower.x,
		top = H * layout.tower.top,
		base = H * 0.59,
		w = W * layout.tower.width,
		h = base - top;
	const tower = new Path2D();
	tower.moveTo(x - w * 0.62, top);
	tower.lineTo(x + w * 0.62, top);
	tower.bezierCurveTo(
		x + w * 0.34,
		top + h * 0.3,
		x + w * 0.3,
		top + h * 0.62,
		x + w * 0.66,
		base,
	);
	tower.lineTo(x - w * 0.66, base);
	tower.bezierCurveTo(
		x - w * 0.3,
		top + h * 0.62,
		x - w * 0.34,
		top + h * 0.3,
		x - w * 0.62,
		top,
	);
	tower.closePath();

	// Cylindrical cool-to-warm glass facade gradient gives China Zun sculpted 3D volume.
	const towerGrad = b.createLinearGradient(
		x - w * 0.66,
		top,
		x + w * 0.66,
		top,
	);
	towerGrad.addColorStop(0, "#1c313c");
	towerGrad.addColorStop(0.32, "#2f4956");
	towerGrad.addColorStop(0.56, "#3b5965");
	towerGrad.addColorStop(0.84, "#243a45");
	towerGrad.addColorStop(1, "#182b34");
	b.fillStyle = towerGrad;
	b.fill(tower);

	b.save();
	b.clip(tower);
	l.save();
	l.clip(tower);
	// Subtle vertical shading fading into river mist at the base.
	const baseMist = b.createLinearGradient(0, top, 0, base);
	baseMist.addColorStop(0, "rgba(210,224,220,.08)");
	baseMist.addColorStop(0.7, "rgba(18,34,42,0)");
	baseMist.addColorStop(1, "rgba(14,28,34,.38)");
	b.fillStyle = baseMist;
	b.fillRect(x - w, top, w * 2, h);

	for (let i = -6; i <= 6; i++) {
		b.beginPath();
		b.moveTo(x + i * w * 0.095, top);
		b.bezierCurveTo(
			x + i * w * 0.055,
			top + h * 0.32,
			x + i * w * 0.048,
			top + h * 0.65,
			x + i * w * 0.1,
			base,
		);
		const ribAlpha = i === 0 || Math.abs(i) === 2 ? 0.42 : 0.24;
		b.strokeStyle = `rgba(184,202,198,${ribAlpha})`;
		b.lineWidth = 0.68;
		b.stroke();
		for (let j = 1; j < 48; j++) {
			const t = j / 48,
				waist = 0.55 + 0.4 * (2 * t - 1) ** 2;
			if ((i * 17 + j * 13) % 7 === 0) continue;
			const warm = (i + j) % 3 === 0 ? 1 : 0;
			l.fillStyle = warm
				? `rgba(235,198,136,${0.18 + (j % 4) * 0.055})`
				: `rgba(196,214,212,${0.12 + (j % 4) * 0.04})`;
			l.fillRect(x + i * w * 0.095 * waist, top + t * h, 1.15, 1.8);
		}
	}
	b.restore();
	l.restore();

	// Luminous warm golden crown parapet atop China Zun.
	glow(l, x, top + 3, w * 0.9, "rgba(238,196,124,.22)");
	l.strokeStyle = "rgba(244,205,134,.82)";
	l.lineWidth = 1.4;
	l.beginPath();
	l.moveTo(x - w * 0.61, top + 1.8);
	l.lineTo(x + w * 0.61, top + 1.8);
	l.stroke();

	// The inclined legs and cantilever enclose the recognizable open central void.
	const cx = W * layout.angled.x,
		cy = H * layout.angled.top,
		cw = W * layout.angled.width,
		ch = H * layout.angled.height;
	const shape = new Path2D();
	[
		[-0.48, 1],
		[-0.6, 0],
		[-0.19, -0.07],
		[0.58, 0.25],
		[0.43, 0.91],
		[0.11, 0.91],
		[0.23, 0.4],
		[-0.2, 0.21],
		[-0.09, 1],
	].forEach(([px, py], i) =>
		i
			? shape.lineTo(cx + px * cw, cy + py * ch)
			: shape.moveTo(cx + px * cw, cy + py * ch),
	);
	shape.closePath();

	// Dual-plane architectural shading gives CCTV tower unmistakable 3D facets.
	const cctvGrad = b.createLinearGradient(
		cx - cw * 0.6,
		cy,
		cx + cw * 0.58,
		cy + ch * 0.9,
	);
	cctvGrad.addColorStop(0, "#3f5860");
	cctvGrad.addColorStop(0.42, "#2f464e");
	cctvGrad.addColorStop(1, "#21363e");
	b.fillStyle = cctvGrad;
	b.fill(shape);

	b.save();
	b.clip(shape);
	// Darker inner-leg & cantilever underside shadow plane.
	b.fillStyle = "rgba(10,22,28,.34)";
	b.beginPath();
	b.moveTo(cx - 0.2 * cw, cy + 0.21 * ch);
	b.lineTo(cx + 0.23 * cw, cy + 0.4 * ch);
	b.lineTo(cx + 0.34 * cw, cy + 0.34 * ch);
	b.lineTo(cx - 0.14 * cw, cy + 0.14 * ch);
	b.closePath();
	b.fill();
	// Subtle lit right-leg inner bevel catching the CBD glow.
	b.fillStyle = "rgba(178,196,192,.11)";
	b.beginPath();
	b.moveTo(cx - 0.6 * cw, cy);
	b.lineTo(cx - 0.19 * cw, cy - 0.07 * ch);
	b.lineTo(cx + 0.58 * cw, cy + 0.25 * ch);
	b.lineTo(cx + 0.52 * cw, cy + 0.31 * ch);
	b.lineTo(cx - 0.2 * cw, cy + 0.01 * ch);
	b.lineTo(cx - 0.53 * cw, cy + 0.06 * ch);
	b.closePath();
	b.fill();
	b.restore();

	b.strokeStyle = "rgba(184,198,192,.44)";
	b.lineWidth = 0.8;
	b.stroke(shape);
	l.save();
	l.clip(shape);
	l.strokeStyle = "rgba(222,194,140,.24)";
	l.lineWidth = 0.65;
	for (let i = -ch; i < cw + ch; i += 10) {
		l.beginPath();
		l.moveTo(cx - cw + i, cy);
		l.lineTo(cx - cw + i + ch * 0.6, cy + ch);
		l.stroke();
		l.beginPath();
		l.moveTo(cx - cw + i, cy);
		l.lineTo(cx - cw + i - ch * 0.6, cy + ch);
		l.stroke();
	}
	// Subtle warm underside glow beneath the cantilevered bridge.
	glow(l, cx + 0.02 * cw, cy + 0.28 * ch, cw * 0.32, "rgba(236,194,126,.16)");
	l.restore();
}
