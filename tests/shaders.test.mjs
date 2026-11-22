import assert from "node:assert/strict";
import test from "node:test";
import { skyline } from "../src/scenes/city/composition.ts";
import { lights as cityLights } from "../src/scenes/city/shaders/lights.ts";
import { fragment as cityFragment } from "../src/scenes/city/shaders/main.ts";
import { people as coastPeople } from "../src/scenes/coast/shaders/people.ts";
import { fragment as inkFragment } from "../src/scenes/ink/shaders/main.ts";

test("ink shader composites boat and its reflection behind foreground shore and foliage", () => {
	const mainBody = inkFragment.slice(inkFragment.indexOf("void main()"));
	const boatIdx = mainBody.indexOf("color = over(color, boatInk);");
	const reflectionIdx = mainBody.indexOf("color = over(color, reflectedBoat);");
	const shoreIdx = mainBody.indexOf("sampleLayer(u_shore");
	const foliageIdx = mainBody.indexOf("sampleLayer(u_foliage");
	assert(boatIdx > 0 && reflectionIdx > boatIdx);
	assert(shoreIdx > reflectionIdx && foliageIdx > shoreIdx);
});

test("city animated tower light band matches composition coordinates in both orientations", () => {
	assert(
		cityLights.includes(
			`portrait?${skyline.portrait.tower.x}:${skyline.landscape.tower.x}`,
		),
	);
	assert(
		cityLights.includes(
			`portrait?${skyline.portrait.tower.top}:${skyline.landscape.tower.top}`,
		),
	);
	assert(
		cityLights.includes(
			`portrait?${skyline.portrait.tower.width}:${skyline.landscape.tower.width}`,
		),
	);
});

test("coast beach crew shader composites premultiplied RenderTexture without double-multiplying alpha", () => {
	assert(!coastPeople.includes("over(color,texture(u_beachCrew"));
	assert(coastPeople.includes("color=color*(1.-s.a)+s.rgb;"));
});

test("city shader evaluates promenade canopy foliage excess and masks boat rim cleanly", () => {
	assert(cityFragment.includes("foliage.g - foliage.b"));
	assert(
		!cityFragment.includes("sampleLayer(u_buildings, p - vec2(0.0, 0.008)).a"),
	);
	assert(cityFragment.includes("float rim = max(0.0, neighbor.a - boat.a);"));
	assert(
		cityFragment.includes(
			"color += vec3(0.95, 0.68, 0.34) * rim * (0.78 + bridgeAndBankGlow * 0.48) * (1.0 - bank.a);",
		),
	);
});
