import type {
	Geometry,
	TextureSource,
	UniformData,
	WebGLRenderer,
} from "pixi.js";
import { CanvasSource, Texture } from "pixi.js";
import type { SceneActor } from "../scenes/registry.ts";
import { getDefinition } from "../scenes/registry.ts";
import type { Scene, SceneName } from "../scenes/types.ts";
import type { Pass } from "./pass.ts";
import { createPass } from "./pass.ts";

function texture(canvas: HTMLCanvasElement, nearest = false) {
	return new CanvasSource({
		resource: canvas,
		alphaMode: "no-premultiply-alpha",
		scaleMode: nearest ? "nearest" : "linear",
		autoGenerateMipmaps: false,
	});
}

function shared(): Record<string, UniformData> {
	return {
		u_size: { value: [0, 0], type: "vec2<f32>" },
		u_time: { value: 0, type: "f32" },
		u_touch: { value: [0, 0, -100], type: "vec3<f32>" },
		u_wind: { value: [0, 0, 0, 0], type: "vec4<f32>" },
		u_environment: { value: [0, 0, 0], type: "vec3<f32>" },
		u_boatCenter: { value: [0, 0], type: "vec2<f32>" },
		u_boat: { value: [0, 0], type: "vec2<f32>" },
		u_actorScale: { value: [0, 0], type: "vec2<f32>" },
	};
}

export function createResources(geometry: Geometry, boat: TextureSource) {
	const passes = new Map<SceneName, Pass>();
	const textures = new Map<SceneName, Record<string, CanvasSource>>();
	const actors = new Map<SceneName, SceneActor>();
	let painting: Scene;

	function clear() {
		textures.forEach((sources, name) => {
			const pass = passes.get(name);
			for (const [key, source] of Object.entries(sources)) {
				if (pass) pass.shader.resources[key] = Texture.EMPTY.source;
				source.destroy();
			}
		});
		textures.clear();
	}

	function upload(next: Scene) {
		clear();
		painting = next;
	}

	function prepare(name: SceneName) {
		if (textures.has(name)) return passes.get(name)!;
		const definition = getDefinition(name);
		const sources: Record<string, TextureSource> = { u_boatLayer: boat };
		let sceneActor = actors.get(name);
		if (!sceneActor && definition.createActor) {
			sceneActor = definition.createActor();
			actors.set(name, sceneActor);
		}
		if (sceneActor)
			sources[sceneActor.resourceName] = sceneActor.texture.source;

		const owned: Record<string, CanvasSource> = {};
		try {
			for (const [key, canvas] of Object.entries(painting.get(name).layers)) {
				const source = texture(canvas, definition.nearest?.includes(key));
				const uniformKey = `u_${key}`;
				sources[uniformKey] = source;
				owned[uniformKey] = source;
			}
			let pass = passes.get(name);
			if (!pass) {
				pass = createPass(
					definition.fragment,
					{
						...shared(),
						...definition.uniforms?.(),
					},
					sources,
					geometry,
				);
				passes.set(name, pass);
			} else {
				Object.assign(pass.shader.resources, sources);
			}
			textures.set(name, owned);
			return pass;
		} catch (error) {
			Object.values(owned).forEach((source) => source.destroy());
			throw error;
		}
	}

	function drawActor(
		name: SceneName,
		renderer: WebGLRenderer,
		time: number,
		width: number,
		height: number,
	) {
		actors.get(name)?.draw(renderer, time, width, height);
	}

	return {
		upload,
		prepare,
		drawActor,
		dispose() {
			passes.forEach((pass) => pass.dispose());
			passes.clear();
			clear();
			actors.forEach((actor) => actor.dispose());
			actors.clear();
		},
		get preparedScenes() {
			return [...textures.keys()];
		},
	};
}
