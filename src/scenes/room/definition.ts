import type { SceneDefinition } from "../registry.ts";
import { createRoom } from "./painting.ts";
import { fragment } from "./shaders/main.ts";
import { drawStaticRoom } from "./static.ts";
import { roomUniforms, updateRoom } from "./uniforms.ts";

export const definition: SceneDefinition = {
	create: createRoom,
	drawStatic: drawStaticRoom,
	fragment,
	uniforms: roomUniforms,
	update: updateRoom,
};
