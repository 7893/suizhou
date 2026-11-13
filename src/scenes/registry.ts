/**
 * Geographic references live in config/places; composition lives beside each scene.
 * Each scene module loads on demand so initial startup fetches only the active painting,
 * Spine beach actors load only with coast, and hidden scenes stay out of public bundles.
 */
import type { Texture, UniformData, WebGLRenderer } from "pixi.js";
import type { Painting, SceneName } from "./types.ts";

export interface SceneActor {
	resourceName: string;
	texture: Texture;
	draw: (
		renderer: WebGLRenderer,
		time: number,
		width: number,
		height: number,
	) => void;
	dispose: () => void;
}

export interface SceneDefinition {
	create: (width: number, height: number) => Painting;
	drawStatic: (
		ctx: CanvasRenderingContext2D,
		painting: Painting,
		boat: HTMLCanvasElement,
	) => void;
	fragment: string;
	nearest?: string[];
	uniforms?: () => Record<string, UniformData>;
	update?: (
		uniforms: Record<string, unknown>,
		canvas: HTMLCanvasElement,
		time: number,
	) => void;
	createActor?: () => SceneActor;
}

const loaders: Record<
	SceneName,
	() => Promise<{ definition: SceneDefinition }>
> = {
	ink: () => import("./ink/definition.ts"),
	city: () => import("./city/definition.ts"),
	coast: () => import("./coast/definition.ts"),
	garden: () => import("./garden/definition.ts"),
	room: () => import("./room/definition.ts"),
};

const loaded = new Map<SceneName, SceneDefinition>();
const inflight = new Map<SceneName, Promise<SceneDefinition>>();

export function isSceneLoaded(name: SceneName) {
	return loaded.has(name);
}

export function getDefinition(name: SceneName): SceneDefinition {
	const definition = loaded.get(name);
	if (!definition) throw new Error(`Scene not loaded yet: ${name}`);
	return definition;
}

export function loadDefinition(name: SceneName): Promise<SceneDefinition> {
	const cached = loaded.get(name);
	if (cached) return Promise.resolve(cached);
	const pending = inflight.get(name);
	if (pending) return pending;
	const loader = loaders[name];
	if (!loader) return Promise.reject(new Error(`Unknown scene: ${name}`));
	const request = loader()
		.then(({ definition }) => {
			loaded.set(name, definition);
			inflight.delete(name);
			return definition;
		})
		.catch((error) => {
			inflight.delete(name);
			throw error;
		});
	inflight.set(name, request);
	return request;
}
