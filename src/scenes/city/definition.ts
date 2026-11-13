import type { SceneDefinition } from "../registry.ts";
import { createCity } from "./painting.ts";
import { fragment } from "./shaders/main.ts";
import { drawStaticCity } from "./static.ts";

export const definition: SceneDefinition = {
	create: createCity,
	drawStatic: drawStaticCity,
	fragment,
	nearest: ["windows"],
};
