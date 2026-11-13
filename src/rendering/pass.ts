import type { TextureSource, UniformData } from "pixi.js";
import {
	Geometry,
	GlProgram,
	Mesh,
	Shader,
	State,
	UniformGroup,
} from "pixi.js";
import { vertex } from "./shaders/common.ts";

export function createGeometry() {
	return new Geometry({
		attributes: {
			aPosition: {
				buffer: new Float32Array([-1, -1, 3, -1, -1, 3]),
				format: "float32x2",
				stride: 2 * 4,
				offset: 0,
			},
		},
		indexBuffer: new Uint32Array([0, 1, 2]),
	});
}

// One fullscreen primitive; Pixi owns its buffers, program and render submission.
export function createPass(
	fragment: string,
	data: Record<string, UniformData>,
	textures: Record<string, TextureSource>,
	geometry: Geometry,
) {
	const uniforms = new UniformGroup(data);
	const shader = new Shader({
		glProgram: GlProgram.from({
			vertex,
			fragment,
			preferredFragmentPrecision: "highp",
		}),
		resources: { sceneUniforms: uniforms, ...textures },
	});
	const state = State.for2d();
	state.blend = false;
	const mesh = new Mesh({ geometry, shader, state });
	mesh.eventMode = "none";
	return {
		mesh,
		shader,
		uniforms,
		dispose() {
			mesh.destroy();
			shader.destroy();
		},
	};
}
export type Pass = ReturnType<typeof createPass>;
