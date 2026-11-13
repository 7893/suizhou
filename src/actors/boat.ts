import { BOAT_FRAME, BOAT_MASK_COLORS } from "../config/actors.ts";
import { actorSurface } from "./surface.ts";
import "pixi.js/graphics";
import { createTimeline, engine } from "animejs";
import type { WebGLRenderer } from "pixi.js";
import {
	CanvasSource,
	Container,
	Graphics,
	Point,
	Sprite,
	Texture,
} from "pixi.js";
import { paintBoat } from "../drawing/boat.ts";
import { createBrush } from "../drawing/brush.ts";

engine.useDefaultMainLoop = false;
// A local reusable actor texture, independent of the viewport and scene palette.

export function createBoat() {
	const { x, y, width, height } = BOAT_FRAME;
	const canvas = document.createElement("canvas");
	canvas.width = width * 4;
	canvas.height = height * 4;
	const ctx = canvas.getContext("2d")!;
	ctx.scale(4, 4);
	paintBoat(createBrush(ctx, 707), x, y, 1, false);
	const hullTexture = new Texture({
		source: new CanvasSource({ resource: canvas, resolution: 4 }),
	});
	const hull = new Sprite({
		texture: hullTexture,
		tint: BOAT_MASK_COLORS.COVERAGE_INK,
	});
	const root = new Container(),
		model = new Container();
	model.position.set(x, y);
	root.addChild(hull, model);
	const body = new Container();
	body.position.set(12, -2);
	body.addChild(
		new Graphics()
			.moveTo(0, -5.5)
			.lineTo(0, 0)
			.stroke({
				color: BOAT_MASK_COLORS.COVERAGE_INK,
				width: 1.4,
				cap: "round",
			})
			.circle(0.4, -8.2, 1.55)
			.fill(BOAT_MASK_COLORS.COVERAGE_INK),
	);
	body.alpha = 0.78;
	const legs = new Graphics().moveTo(12, -2).lineTo(17, -1).stroke({
		color: BOAT_MASK_COLORS.COVERAGE_INK,
		width: 1.3,
		cap: "round",
		alpha: 0.78,
	});
	const arm = new Graphics()
		.moveTo(0, 0)
		.lineTo(4, 0)
		.stroke({ color: BOAT_MASK_COLORS.COVERAGE_INK, width: 1, cap: "round" });
	arm.position.set(0, -5.5);
	body.addChild(arm);
	const hand = new Container();
	hand.position.set(15, -4.55);
	const oar = new Graphics()
		.moveTo(0, 0)
		.lineTo(23, 0)
		.stroke({
			color: BOAT_MASK_COLORS.OAR_HIGHLIGHT,
			width: 0.8,
			cap: "round",
		})
		.moveTo(19.32, 0)
		.lineTo(23, 0)
		.stroke({
			color: BOAT_MASK_COLORS.OAR_HIGHLIGHT,
			width: 1.5,
			cap: "round",
		});
	oar.rotation = 0.45;
	oar.alpha = 0.66;
	hand.addChild(oar);
	model.addChild(legs, body, hand);
	const duration = ((2 * Math.PI) / 1.75) * 1000;
	const motion = createTimeline({
		autoplay: false,
		defaults: { duration, ease: "inOutSine" },
	})
		.add(body, { rotation: [0.12, 0, -0.12, 0] }, 0)
		.add(
			hand.position,
			{ x: [16.1, 15, 13.9, 15], y: [-5, -5.45, -5, -4.55] },
			0,
		)
		.add(oar, { rotation: [0.93, 0.45, -0.03, 0.45] }, 0);
	const grip = new Point();
	const surface = actorSurface(root, width, height, 4);
	return {
		texture: surface.texture,
		draw(renderer: WebGLRenderer, time: number) {
			// Bound the timeline's position even after months of continuous display.
			motion.seek((time * 1000) % duration, true);
			body.toLocal(hand.position, model, grip);
			const dx = grip.x,
				dy = grip.y + 5.5;
			arm.rotation = Math.atan2(dy, dx);
			arm.scale.x = Math.hypot(dx, dy) / 4;
			surface.draw(renderer);
		},
		dispose() {
			motion.cancel();
			surface.dispose();
			hullTexture.destroy(true);
		},
	};
}
