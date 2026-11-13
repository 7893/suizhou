import { Ticker, WebGLRenderer } from "pixi.js";
import "pixi.js/unsafe-eval";
import { createBoat } from "../actors/boat.ts";
import { createEnvironment } from "../environment/state.ts";
import { getDefinition } from "../scenes/registry.ts";
import type { JourneyState, Scene, SceneName } from "../scenes/types.ts";
import { createCompositor } from "./compositor.ts";
import { createGeometry } from "./pass.ts";
import { createResources } from "./resources.ts";
import { createTargets } from "./targets.ts";

export async function createRenderer(canvas: HTMLCanvasElement) {
	const gl = canvas.getContext("webgl2", {
		alpha: false,
		antialias: false,
		depth: false,
		stencil: true,
		powerPreference: "low-power",
	});
	if (!gl) return null;
	// Pixi maintenance shares the application clock, including hidden-tab pauses.
	Ticker.system.autoStart = false;
	Ticker.system.stop();
	const renderer = new WebGLRenderer();
	try {
		await renderer.init({
			canvas,
			context: gl,
			width: canvas.width,
			height: canvas.height,
			resolution: 1,
			autoDensity: false,
			antialias: false,
			backgroundAlpha: 1,
			clearBeforeRender: true,
			manageImports: false,
		});
	} catch (error) {
		console.warn("Using static scenes.", error);
		renderer.destroy(false);
		return null;
	}
	const environment = createEnvironment();
	const manualEnvironment = new Set<SceneName>();
	const geometry = createGeometry();
	const actor = createBoat();
	const resources = createResources(geometry, actor.texture.source);
	const targets = createTargets();
	const compositor = createCompositor(targets.textures, geometry);
	let scene: Scene;
	canvas.dataset.renderer = "webgl2";
	function upload(next: Scene) {
		scene = next;
		renderer.resize(next.width, next.height);
		resources.upload(next);
		targets.resize(next.width, next.height);
	}
	function drawScene(
		key: SceneName,
		slot: number | null,
		time: number,
		touch: number[],
		x: number,
		wind: ArrayLike<number>,
	) {
		const pass = resources.prepare(key);
		resources.drawActor(key, renderer, time, scene.width, scene.height);
		if (!manualEnvironment.has(key)) environment.breathe(key, time);
		const conditions = environment.sample(key, time, wind);
		const W = scene.portrait ? 760 : 1600;
		const H = (W * scene.height) / scene.width;
		const scale = scene.portrait ? 1.35 : 1.6;
		const u = pass.uniforms.uniforms;
		const size = u.u_size as number[],
			boat = u.u_boat as number[],
			actorScale = u.u_actorScale as number[];
		size[0] = scene.width;
		size[1] = scene.height;
		u.u_time = time;
		u.u_touch = touch;
		u.u_wind = conditions.wind;
		u.u_environment = conditions.atmosphere;
		u.u_boatCenter = scene.boatCenter;
		boat[0] = x - scene.boatCenter[0];
		boat[1] = Math.sin(time * 1.05) * 0.0022;
		// Ease offshore before the landing; stay beyond it until leaving the frame.
		const offshore =
			key === "coast" ? Math.max(0, Math.min(1, (x - 0.48) / 0.22)) : 0;
		const depth = offshore * offshore * (3 - 2 * offshore);
		boat[1] -= depth * 0.105;
		actorScale[0] = (scale * (1 - depth * 0.18)) / W;
		actorScale[1] = (scale * (1 - depth * 0.18)) / H;
		getDefinition(key).update?.(u, canvas, time);
		renderer.render({
			container: pass.mesh,
			target: slot === null ? undefined : targets.get(slot),
			clear: true,
		});
	}
	return {
		upload,
		draw(
			time: number,
			touch: number[],
			journey: JourneyState,
			wind: ArrayLike<number> = [0, 0, time, 0.65],
		) {
			Ticker.system.update(performance.now());
			if (
				journey.from !== "room" ||
				(journey.transitioning && journey.to !== "room")
			)
				actor.draw(renderer, time);
			const composite = journey.transitioning || journey.from === "ink";
			drawScene(
				journey.from,
				composite ? 0 : null,
				time,
				touch,
				journey.positions[journey.from]!,
				wind,
			);
			if (journey.transitioning)
				drawScene(
					journey.to,
					1,
					time,
					touch,
					journey.positions[journey.to]!,
					wind,
				);
			if (composite) compositor.draw(renderer, time, journey);
		},
		setEnvironment(
			name: SceneName,
			conditions?: Parameters<typeof environment.setTarget>[1],
		) {
			manualEnvironment.add(name);
			environment.setTarget(name, conditions);
		},
		resetEnvironment(name: SceneName) {
			manualEnvironment.delete(name);
			environment.reset(name);
		},
		dispose() {
			resources.dispose();
			compositor.dispose();
			actor.dispose();
			targets.dispose();
			geometry.destroy();
			renderer.destroy(false);
		},
		// Pixi restores programs and GPU allocations; upload rebuilds scene sources.
		restore() {
			canvas.dataset.renderer = "webgl2";
		},
		prepare: resources.prepare,
		get preparedScenes() {
			return resources.preparedScenes;
		},
		maxSize: Math.min(
			gl.getParameter(gl.MAX_TEXTURE_SIZE),
			gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
		),
	};
}
export type ArtRenderer = NonNullable<
	Awaited<ReturnType<typeof createRenderer>>
>;
