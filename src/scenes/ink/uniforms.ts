import type { UniformData } from "pixi.js";
import { FISH_COUNT } from "../../motion/fish.ts";
import { updateFish } from "./fish-data.ts";

export function fishUniforms(): Record<string, UniformData> {
	return {
		u_fish: {
			value: new Float32Array(FISH_COUNT * 4),
			type: "vec4<f32>",
			size: FISH_COUNT,
		},
		u_fishRipples: {
			value: new Float32Array(FISH_COUNT * 4),
			type: "vec4<f32>",
			size: FISH_COUNT,
		},
	};
}
export function updateFishUniforms(
	uniforms: Record<string, unknown>,
	canvas: HTMLCanvasElement,
	time: number,
) {
	updateFish(
		canvas,
		time,
		uniforms.u_fish as Float32Array,
		uniforms.u_fishRipples as Float32Array,
		uniforms.u_touch as ArrayLike<number> | undefined,
	);
}
