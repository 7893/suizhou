import assert from "node:assert/strict";
import test from "node:test";
import { createEnvironment } from "../src/environment/state.ts";

test("conditions blend without moving the integrated cloud phase", () => {
	const environment = createEnvironment(),
		wind = [0.5, 0.8, 123, 0.65];
	const before = [...environment.sample("ink", 0, wind).atmosphere];
	environment.setTarget("ink", { wind: 2, cloud: 1, haze: 0 });
	assert.deepEqual([...environment.sample("ink", 0, wind).atmosphere], before);
	for (let i = 1; i <= 240; i++) environment.sample("ink", i / 4, wind);
	const state = environment.sample("ink", 60, wind);
	assert(state.atmosphere[0] > 1.99);
	assert(state.atmosphere[1] > 0.99);
	assert(state.atmosphere[2] < 0.01);
	assert.equal(state.wind[2], 123);
	assert(environment.sample("city", 60, wind).atmosphere[0] < 1);
});

test("invalid inputs are ignored, extremes bounded, presets recover gradually", () => {
	const environment = createEnvironment(),
		wind = [0, 0, 0, 0];
	environment.setTarget("coast", { wind: Infinity, cloud: NaN, haze: -30 });
	environment.sample("coast", 0, wind);
	for (let i = 1; i < 100; i++) environment.sample("coast", i, wind);
	const state = environment.sample("coast", 100, wind);
	assert.equal(state.atmosphere[0], 1);
	assert(state.atmosphere[1] > 0.37 && state.atmosphere[1] < 0.39);
	assert(state.atmosphere[2] >= 0 && state.atmosphere[2] < 0.001);
	environment.reset("coast");
	assert(environment.sample("coast", 101, wind).atmosphere[2] > 0);
	environment.breathe("ink", 32);
	const breathing = environment.sample("ink", 40, wind);
	assert(breathing.atmosphere.every((v) => Number.isFinite(v) && v >= 0));
	assert.throws(() => environment.setTarget("unknown", {}), /Unknown/);
});
