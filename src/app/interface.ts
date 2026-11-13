import { copy } from "../config/copy.ts";
import type { JourneyState, SceneName } from "../scenes/types.ts";
import type { SceneButton } from "./dom.ts";
import { element } from "./dom.ts";

function setLines(element: HTMLElement, lines: string[]) {
	element.replaceChildren(
		...lines.flatMap((line, i: number) =>
			i
				? [document.createElement("br"), document.createTextNode(line)]
				: [document.createTextNode(line)],
		),
	);
}

const cache = new WeakMap<
	HTMLCanvasElement,
	{ scene: SceneName | ""; target: SceneName | ""; inscription: HTMLElement }
>();

export function updateSceneUI(
	canvas: HTMLCanvasElement,
	state: JourneyState,
	sceneButtons: SceneButton[],
) {
	const transition = String(state.transitioning);
	if (canvas.dataset.transition !== transition)
		canvas.dataset.transition = transition;
	let entry = cache.get(canvas);
	if (!entry?.inscription.isConnected) {
		entry = { scene: "", target: "", inscription: element(".inscription") };
		cache.set(canvas, entry);
	}
	const opacity = state.transitioning
		? String(Math.abs(state.blend * 2 - 1))
		: "1";
	if (entry.inscription.style.opacity !== opacity)
		entry.inscription.style.opacity = opacity;
	if (entry.target !== state.to) {
		entry.target = state.to;
		for (const button of sceneButtons)
			button.setAttribute(
				"aria-pressed",
				String(button.dataset.scene === state.to),
			);
	}
	if (entry.scene === state.scene) return;
	canvas.dataset.scene = state.scene;
	entry.scene = state.scene;
	document.body.dataset.view = state.scene;
	const info = copy.scenes[state.scene];
	element("h1").textContent = info.title;
	setLines(element(".inscription p"), info.poem);
	setLines(element(".seal"), info.seal);
	element(".work-mark").textContent = info.mark;
	canvas.setAttribute("aria-label", info.description);
}
