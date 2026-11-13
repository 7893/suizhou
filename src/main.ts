import { createAnimation } from "./app/animation.ts";
import type { SceneButton } from "./app/dom.ts";
import { element } from "./app/dom.ts";
import { updateSceneUI } from "./app/interface.ts";
import { createPreparation } from "./app/preparation.ts";
import { createRoomControls } from "./app/room-controls.ts";
import { viewportSize } from "./app/viewport.ts";
import { arrivalText } from "./config/copy.ts";
import { createJourney, scenes } from "./motion/journey.ts";
import { createWind } from "./motion/wind.ts";
import { createRenderer } from "./rendering/renderer.ts";
import { createScene } from "./scenes/index.ts";
import type { Scene, SceneName } from "./scenes/types.ts";
import { hitWater } from "./scenes/water-hit.ts";

const canvas = element<HTMLCanvasElement>("#landscape");
const sceneButtons = [
	...document.querySelectorAll<SceneButton>("[data-scene]"),
];
const journey = createJourney(innerWidth / innerHeight < 0.85 ? 0.64 : 0.69);
for (const control of sceneButtons)
	control.hidden = !scenes.includes(control.dataset.scene);
updateSceneUI(canvas, journey.state(), sceneButtons);

let renderer = await createRenderer(canvas).catch((error: unknown) => {
		console.warn("Using static scenes.", error);
		return null;
	}),
	context: CanvasRenderingContext2D | null = null,
	painting: Scene | undefined;
let lost = false,
	time = 0,
	resizeTimer: number | undefined;
const roomControls = createRoomControls((name) => {
	journey.select(name, !renderer);
	draw();
});
let dimensions = "";
let touch = [0, 0, -100];
const wind = createWind();
const preparation = createPreparation((name) => {
	if (!renderer || lost) return;
	try {
		renderer.prepare(name);
	} catch (error) {
		console.warn("Deferring scene preparation.", error);
	}
});
const animation = createAnimation({
	active: () => !lost && !document.hidden && !!renderer,
	advance: (dt: number) => {
		time += dt;
		journey.advance(dt);
		wind.advance(dt);
	},
	draw,
	onRate: (fps) => {
		canvas.dataset.targetFps = String(fps);
	},
});

function fallback() {
	animation.stop();
	preparation.stop();
	renderer?.dispose();
	renderer = null;
	canvas.style.opacity = "0";
	canvas.style.pointerEvents = "none";
	let fallbackCanvas = document.getElementById(
		"fallback-canvas",
	) as HTMLCanvasElement | null;
	if (!fallbackCanvas) {
		fallbackCanvas = document.createElement("canvas");
		fallbackCanvas.id = "fallback-canvas";
		Object.assign(fallbackCanvas.style, {
			position: "absolute",
			inset: "0",
			width: "100%",
			height: "100%",
			zIndex: "-1",
		});
		canvas.parentElement?.appendChild(fallbackCanvas);
	}
	fallbackCanvas.style.display = "block";
	fallbackCanvas.width = canvas.width;
	fallbackCanvas.height = canvas.height;
	context = fallbackCanvas.getContext("2d");
	canvas.dataset.renderer = "canvas2d";
	if (painting) drawStatic(journey.state().scene);
}

function drawStatic(name: SceneName) {
	if (painting && context) painting.drawStatic(name, context);
}
function draw() {
	if (lost || !painting) return;
	const state = journey.state();
	try {
		if (renderer) renderer.draw(time, touch, state, wind.value);
		else drawStatic(state.scene);
	} catch (error) {
		console.warn("Using static scene.", error);
		fallback();
	}
	updateSceneUI(canvas, state, sceneButtons);
	roomControls.update(state);
}
function resize() {
	if (lost) return;
	const { width, height, key } = viewportSize(renderer?.maxSize);
	if (key === dimensions && painting) return;
	preparation.stop();
	dimensions = key;
	canvas.width = width;
	canvas.height = height;
	const fallbackCanvas = document.getElementById(
		"fallback-canvas",
	) as HTMLCanvasElement | null;
	if (fallbackCanvas) {
		fallbackCanvas.width = width;
		fallbackCanvas.height = height;
	}
	journey.setDefaultX(width / height < 0.85 ? 0.64 : 0.69);
	painting = createScene(width, height);
	if (renderer) {
		try {
			renderer.upload(painting);
		} catch (error) {
			console.warn("Using static ink layers.", error);
			fallback();
		}
	}
	draw();
	canvas.dataset.ready = "true";
	if (renderer)
		preparation.start(
			scenes.filter((name) => !renderer!.preparedScenes.includes(name)),
		);
}
for (const control of sceneButtons) {
	if (control.hidden) continue;
	control.addEventListener("click", () => {
		journey.select(control.dataset.scene, !renderer);
		draw();
		element("#status").textContent = arrivalText(control.dataset.scene);
	});
}
if (!renderer) fallback();
function sync() {
	animation.sync();
	if (document.hidden || !renderer || lost) preparation.stop();
	else
		preparation.start(
			scenes.filter((name) => !renderer!.preparedScenes.includes(name)),
		);
}
document.addEventListener("visibilitychange", sync);
window.addEventListener("pagehide", (event) => {
	clearTimeout(resizeTimer);
	animation.stop();
	preparation.stop();
	if (!event.persisted) {
		roomControls.dispose();
		journey.dispose();
		animation.dispose();
		renderer?.dispose();
		renderer = null;
	}
});
window.addEventListener("pageshow", (event) => {
	if (!event.persisted) return;
	resize();
	sync();
});
window.addEventListener("resize", () => {
	clearTimeout(resizeTimer);
	resizeTimer = setTimeout(resize, 120);
});
element("main").addEventListener("pointerdown", (event) => {
	if (event.target !== canvas || !painting) return;
	const state = journey.state();
	const x = event.clientX / innerWidth,
		y = event.clientY / innerHeight;
	if (
		state.transitioning ||
		!hitWater(painting, state.scene, x, y, state.positions[state.scene])
	)
		return;
	touch = [x, y, time];
	draw();
});
canvas.addEventListener("webglcontextlost", (event) => {
	if (event.target !== canvas || !renderer) return;
	event.preventDefault();
	lost = true;
	canvas.dataset.renderer = "webgl-lost";
	animation.stop();
	preparation.stop();
});
canvas.addEventListener("webglcontextrestored", () => {
	lost = false;
	canvas.style.opacity = "1";
	canvas.style.pointerEvents = "auto";
	const fallbackCanvas = document.getElementById("fallback-canvas");
	if (fallbackCanvas) fallbackCanvas.style.display = "none";
	try {
		renderer?.restore();
		dimensions = "";
		resize();
		animation.sync();
	} catch (error) {
		console.warn("Restoring the ink canvas.", error);
		fallback();
		draw();
	}
});
resize();
animation.sync();
