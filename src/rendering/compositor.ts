import type { Geometry, RenderTexture, WebGLRenderer } from "pixi.js";
import type { JourneyState } from "../scenes/types.ts";
import { createPass } from "./pass.ts";
import { fragment } from "./shaders/transition.ts";

export function createCompositor(
	textures: RenderTexture[],
	geometry: Geometry,
) {
	const pass = createPass(
		fragment,
		{
			u_size: { value: [0, 0], type: "vec2<f32>" },
			u_time: { value: 0, type: "f32" },
			u_blend: { value: 0, type: "f32" },
			u_sourceInk: { value: 0, type: "i32" },
			u_destinationInk: { value: 0, type: "i32" },
		},
		{ u_source: textures[0].source, u_destination: textures[1].source },
		geometry,
	);
	return {
		draw(renderer: WebGLRenderer, time: number, journey: JourneyState) {
			const u = pass.uniforms.uniforms;
			const size = u.u_size as number[];
			size[0] = renderer.width;
			size[1] = renderer.height;
			u.u_time = time;
			u.u_blend = journey.blend;
			u.u_sourceInk = Number(journey.from === "ink");
			u.u_destinationInk = Number(journey.to === "ink");
			pass.shader.resources.u_destination =
				textures[journey.transitioning ? 1 : 0].source;
			renderer.render({ container: pass.mesh, clear: true });
		},
		dispose: pass.dispose,
	};
}
