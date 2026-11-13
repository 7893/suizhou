import type { SceneDefinition } from "../registry.ts";
import { createInk } from "./painting.ts";
import { fragment } from "./shaders/main.ts";
import { drawStaticInk } from "./static.ts";
import { fishUniforms, updateFishUniforms } from "./uniforms.ts";

export const definition: SceneDefinition = {
	create: createInk,
	drawStatic: drawStaticInk,
	fragment,
	uniforms: fishUniforms,
	update: updateFishUniforms,
};
