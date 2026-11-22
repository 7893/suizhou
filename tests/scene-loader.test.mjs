import assert from "node:assert/strict";
import test from "node:test";
import { createSceneLoader } from "../src/app/scene-loader.ts";

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

test("scene loader deduplicates inflight fetches, applies exponential backoff, and caps retries", async () => {
	let clock = 1000;
	let loaded = false;
	let calls = 0;
	let shouldFail = true;
	const errors = [];
	const loadedNames = [];

	const loader = createSceneLoader({
		isLoaded: () => loaded,
		load: () => {
			calls++;
			if (shouldFail) return Promise.reject(new Error(`offline-${calls}`));
			loaded = true;
			return Promise.resolve();
		},
		onLoaded: (name) => loadedNames.push(name),
		onError: (name, _err, attempt) => errors.push([name, attempt]),
		now: () => clock,
		baseDelayMs: 1000,
		maxDelayMs: 4000,
		maxAttempts: 3,
	});

	// Simulate 60fps requests while the first fetch is inflight.
	for (let i = 0; i < 10; i++) assert.equal(loader.request("city"), false);
	assert.equal(calls, 1);

	await flush();
	assert.deepEqual(errors, [["city", 1]]);
	assert.equal(loader.hasFailed("city"), true);
	assert.equal(loader.hasExhausted("city"), false);

	// Inside the 1000ms backoff window: no retry storms at 60fps.
	clock += 999;
	for (let i = 0; i < 60; i++) loader.request("city");
	assert.equal(calls, 1);

	// At +1000ms: attempt 2 fires and backs off for 2000ms.
	clock += 1;
	loader.request("city");
	assert.equal(calls, 2);
	await flush();
	assert.deepEqual(errors, [
		["city", 1],
		["city", 2],
	]);

	clock += 1999;
	loader.request("city");
	assert.equal(calls, 2);

	// At +2000ms: attempt 3 fires and reaches maxAttempts.
	clock += 1;
	loader.request("city");
	assert.equal(calls, 3);
	await flush();
	assert.equal(loader.hasExhausted("city"), true);

	// Even far in the future, automatic retries stop once exhausted.
	clock += 60_000;
	loader.request("city");
	assert.equal(calls, 3);

	// Resetting (e.g. online event or explicit click) allows immediate recovery.
	shouldFail = false;
	loader.reset("city");
	assert.equal(loader.hasExhausted("city"), false);
	assert.equal(loader.hasFailed("city"), false);
	loader.request("city");
	assert.equal(calls, 4);
	await flush();
	assert.deepEqual(loadedNames, ["city"]);
	assert.equal(loader.request("city"), true);
});

test("scene loader catches synchronous load exceptions without throwing", async () => {
	const errors = [];
	const loader = createSceneLoader({
		isLoaded: () => false,
		load: () => {
			throw new Error("sync failure");
		},
		onError: (name, error, attempt) =>
			errors.push([name, error.message, attempt]),
		now: () => 0,
	});

	assert.equal(loader.request("coast"), false);
	await flush();
	assert.deepEqual(errors, [["coast", "sync failure", 1]]);
});
