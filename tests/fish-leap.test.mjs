import assert from "node:assert/strict";
import test from "node:test";
import { fishState } from "../src/motion/fish.ts";
import { LEAP_DURATION, leapingFish } from "../src/motion/fish-leap.ts";
import { startledFish } from "../src/scenes/ink/fish-data.ts";

test("a leap joins the swimming path without position or heading jumps", () => {
	for (const aspect of [390 / 844, 1.44]) {
		for (let start = 2; start < 150; start += 13) {
			for (const age of [0, LEAP_DURATION, LEAP_DURATION + 0.001]) {
				const swimming = fishState(start + age, 0, aspect);
				const jumping = leapingFish(start + age, age, aspect);
				jumping.forEach((value, i) =>
					assert(Math.abs(value - swimming[i]) < 1e-8),
				);
			}
			const age = LEAP_DURATION / 2;
			const jumping = leapingFish(start + age, age, aspect);
			const swimming = fishState(start + age, 0, aspect);
			assert(jumping[1] < swimming[1] - 0.015, "fish must clear the surface");
			assert.equal(jumping[0], swimming[0], "forward travel must continue");
			for (let step = 0; step <= 60; step++) {
				const age = (LEAP_DURATION * step) / 60;
				assert(leapingFish(start + age, age, aspect).every(Number.isFinite));
			}
		}
	}
});

test("nearby water touches startle swimming fish smoothly and settle back to path", () => {
	const base = fishState(10, 1, 1.5);
	const touch = [base[0] - 0.03, base[1] - 0.01, 10];
	assert.deepEqual(startledFish(base, 1.5, 10, touch), base);
	const mid = startledFish(base, 1.5, 10.6, touch);
	assert(mid[0] > base[0] + 0.01, "fish darts away from nearby touch");
	assert(mid[3] > base[3], "startled fish flashes slightly clearer ink");
	assert.deepEqual(startledFish(base, 1.5, 15, touch), base);
});
