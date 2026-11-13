import type { SceneDefinition } from "../registry.ts";
import { createGarden } from "./painting.ts";
import { fragment } from "./shaders/main.ts";
import { drawStaticGarden } from "./static.ts";

export const definition: SceneDefinition = {
	create: createGarden,
	drawStatic: drawStaticGarden,
	fragment,
};
