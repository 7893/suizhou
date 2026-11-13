import { createBeachActors } from "../../actors/beach.ts";
import type { SceneDefinition } from "../registry.ts";
import { createCoast } from "./painting.ts";
import { fragment } from "./shaders/main.ts";
import { drawStaticCoast } from "./static.ts";

export const definition: SceneDefinition = {
	create: createCoast,
	drawStatic: drawStaticCoast,
	fragment,
	createActor: () => ({
		resourceName: "u_beachCrew",
		...createBeachActors(),
	}),
};
