import { seededRandom, stroke } from "../../drawing/canvas.ts";
import { createGlow } from "../../drawing/glow.ts";
import { paintingLayers } from "../../drawing/layers.ts";
import { skyline } from "./composition.ts";
import { drawBeijingSkyline } from "./details.ts";
import { drawRiver } from "./river.ts";
import { createTrees } from "./trees.ts";
import { roomMarker } from "./windows.ts";
// An imagined Liangma River evening, drawn entirely from geometry and light.
export function createCity(width: number, height: number) {
	const { layers, contexts, W, H, portrait } = paintingLayers(width, height, [
		"buildings",
		"lights",
		"bank",
		"windows",
	]);
	const { buildings: b, lights: l, bank: k } = contexts;
	const markRoom = roomMarker(contexts.windows);
	const random = seededRandom(2873);
	const landmark = skyline[portrait ? "portrait" : "landscape"].angled;
	b.save();
	l.save();
	b.globalAlpha = 0.78;
	l.globalAlpha = 0.62;
	// Distant silhouettes alternate height with stepped crowns rather than blunt bars.
	for (const [x, w, h, setback] of [
		[0.015, 0.033, 0.085, 0.62],
		[0.1, 0.022, 0.13, 0.55],
		[0.17, 0.035, 0.065, 0.72],
		[0.29, 0.025, 0.115, 0.58],
		[0.36, 0.018, 0.075, 0.68],
	]) {
		const bx = W * x,
			bw = W * w,
			bh = H * h,
			by = H * 0.57 - bh;
		b.fillStyle = "#293942";
		b.fillRect(bx, by + bh * 0.14, bw, bh * 0.86);
		b.fillRect(bx + bw * ((1 - setback) * 0.5), by, bw * setback, bh * 0.16);
		l.fillStyle = "rgba(222,188,132,.22)";
		l.fillRect(bx + bw * ((1 - setback) * 0.5), by, bw * setback, 1.2);
	}
	drawBeijingSkyline(b, l, W, H);
	b.restore();
	l.restore();
	// Midground buildings: varied crowns, subtle facade mullions, and warm lived-in rooms.
	for (let i = 0; i < 16; i++) {
		const x = (i * W) / 15 - W * 0.015,
			w = W * (0.019 + random() * (i < 7 ? 0.02 : 0.037)),
			candidate = H * (0.035 + random() * (i < 7 ? 0.1 : 0.14)),
			nearLandmark =
				x + w > W * (landmark.x - landmark.width * 0.7) &&
				x < W * (landmark.x + landmark.width * 0.7),
			h = nearLandmark
				? Math.min(candidate, H * (0.59 - landmark.top - landmark.height * 0.8))
				: candidate,
			y = H * 0.59 - h;
		const shade = b.createLinearGradient(x, y, x + w, H * 0.59);
		shade.addColorStop(0, i % 2 ? "#283840" : "#24333b");
		shade.addColorStop(1, "#14272c");
		b.fillStyle = shade;
		b.fillRect(x, y, w, h);
		// Architectural crown setback or cantilevered eave so rooflines feel composed.
		if (i % 3 === 0 && h > H * 0.055) {
			const cw = w * 0.62,
				ch = Math.min(h * 0.12, 9);
			b.fillStyle = "#223239";
			b.fillRect(x + (w - cw) * 0.35, y - ch, cw, ch + 1);
			l.fillStyle = "rgba(232,190,126,.18)";
			l.fillRect(x + (w - cw) * 0.35, y - ch, cw, 1.2);
		} else if (i % 3 === 1) {
			b.fillStyle = "rgba(154,174,172,.08)";
			b.fillRect(x - 0.8, y, w + 1.6, 1.8);
		}
		// Faint vertical curtain-wall mullions break up flat digital rectangles.
		b.fillStyle = "rgba(142,165,166,.045)";
		for (let mx = x + 5; mx < x + w - 4; mx += 7)
			b.fillRect(mx, y + 3, 0.7, h - 5);
		let floor = i * 19;
		for (let yy = y + 8; yy < H * 0.585; yy += 7 + random() * 3) {
			floor++;
			const occupied = random();
			for (let xx = x + 4; xx < x + w - 4; xx += 5) {
				if (random() > occupied * 0.8 + 0.26) {
					const warm = random();
					l.fillStyle = `rgba(${222 + Math.floor(warm * 18)},${164 + Math.floor(warm * 44)},${112 + Math.floor(warm * 26)},${0.08 + random() * 0.31})`;
					const width = 1.5 + random() * 2.1;
					l.fillRect(xx, yy, width, 2.3);
					markRoom(xx, yy, width, 2.3, floor);
				}
			}
		}
	}
	// A quiet hotel frontage glimpsed through the trees, set back from the river.
	const hx = W * 0.2,
		hy = H * 0.49,
		hw = W * 0.09,
		hh = H * 0.095;
	b.fillStyle = "#1c3037";
	b.fillRect(hx, hy, hw, hh);
	for (let floor = 0; floor < 7; floor++) {
		const y = hy + 8 + (floor * hh) / 8;
		stroke(
			b,
			[
				[hx, y],
				[hx + hw, y],
			],
			"rgba(114,133,136,.11)",
			1,
		);
		for (let x = hx + 5; x < hx + hw - 5; x += 6)
			if (random() > 0.47) {
				l.fillStyle = `rgba(236,190,130,${0.13 + random() * 0.3})`;
				const width = 2 + random() * 2;
				l.fillRect(x, y - 3, width, 2);
				markRoom(x, y - 3, width, 2, 500 + floor);
			}
	}
	const tree = createTrees(random, l);
	drawRiver({ b, l, k, W, H, portrait, random, tree });
	layers.glow = createGlow(layers.lights);
	return { layers, width, height, portrait };
}
