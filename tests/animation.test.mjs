import assert from "node:assert/strict";
import test from "node:test";
import { createAnimation, createCadence } from "../src/app/animation.ts";
import { createJourney, scenes } from "../src/motion/journey.ts";
import { createWind } from "../src/motion/wind.ts";

test("cadence backs off under sustained pressure and recovers without oscillation", () => {
	const c = createCadence();
	for (let i = 0; i < 300; i++) c.sample(1000 / 60, 3);
	assert.equal(c.fps, 60);
	for (let i = 0; i < 120; i++) c.sample(1000 / 30, 17);
	assert.equal(c.fps, 30);
	for (let i = 0; i < 120; i++) c.sample(1000 / 60, 3);
	assert.equal(c.fps, 30);
	for (let i = 0; i < 700; i++) c.sample(1000 / 60, 3);
	assert.equal(c.fps, 60);
	// Repeated drops back off recovery and lock at 30fps after 3 strikes.
	for (let strike = 2; strike <= 3; strike++) {
		for (let i = 0; i < 120; i++) c.sample(1000 / 30, 17);
		assert.equal(c.fps, 30);
		if (strike < 3) {
			for (let i = 0; i < 1500; i++) c.sample(1000 / 60, 3);
			assert.equal(c.fps, 60);
		}
	}
	for (let i = 0; i < 3000; i++) c.sample(1000 / 60, 3);
	assert.equal(c.fps, 30);
	c.reset();
	assert.equal(c.fps, 60);
});

test("render throttling never throttles journey time; resuming excludes hidden time", (t) => {
	const originalRAF = globalThis.requestAnimationFrame,
		originalCancel = globalThis.cancelAnimationFrame;
	let now = 0;
	t.mock.method(performance, "now", () => now);
	let pending,
		elapsed = 0,
		draws = 0,
		rate = 60;
	globalThis.requestAnimationFrame = (fn) => {
		pending = (stamp) => {
			now = stamp;
			fn(stamp);
		};
		return 1;
	};
	globalThis.cancelAnimationFrame = () => {
		pending = null;
	};
	try {
		const loop = createAnimation({
			active: () => true,
			advance: (dt) => (elapsed += dt),
			draw: () => draws++,
			onRate: (fps) => (rate = fps),
		});
		loop.sync();
		for (let i = 0; i <= 600; i++) {
			const cb = pending;
			pending = null;
			cb((i * 1000) / 60);
		}
		assert(Math.abs(elapsed - 10) < 1e-8);
		assert(draws >= 590 && draws <= 601, `Observed ${draws} draws`);
		loop.stop();
		assert.equal(pending, null);
		now = 60000;
		loop.sync();
		pending(60000);
		assert(Math.abs(elapsed - 10) < 1e-8);
		for (let i = 1; i <= 120; i++) pending(60000 + (i * 1000) / 30);
		assert.equal(rate, 30);
		const beforeTime = elapsed,
			beforeDraws = draws;
		for (let i = 1; i <= 120; i++) pending(64000 + (i * 1000) / 60);
		assert(Math.abs(elapsed - beforeTime - 2) < 1e-8);
		assert(draws - beforeDraws >= 58 && draws - beforeDraws <= 62);
		loop.stop();
	} finally {
		globalThis.requestAnimationFrame = originalRAF;
		globalThis.cancelAnimationFrame = originalCancel;
	}
});

test("wind inertia stays stable and nearly identical at 30 and 60 fps", () => {
	const a = createWind(),
		b = createWind();
	let largestJump = 0,
		previous = 0;
	for (let i = 0; i < 3600; i++) {
		a.advance(1 / 60);
		largestJump = Math.max(largestJump, Math.abs(a.value[0] - previous));
		previous = a.value[0];
		assert(a.value.every(Number.isFinite));
		assert(Math.abs(a.value[0]) < 1.5);
	}
	for (let i = 0; i < 1800; i++) b.advance(1 / 30);
	for (let i = 0; i < 4; i++) assert(Math.abs(a.value[i] - b.value[i]) < 1e-4);
	assert(largestJump < 0.03);
	assert(a.value[2] > 30);
});

test("only startup is random; subsequent scenes follow the visible order", () => {
	const starts = new Set();
	for (let seed = 1; seed <= 30; seed++) {
		let n = Math.imul(seed, 2654435761) >>> 0;
		let calls = 0;
		const random = () => {
			calls++;
			return (n = (Math.imul(n, 1664525) + 1013904223) >>> 0) / 4294967296;
		};
		const j = createJourney(0.69, random),
			arrivals = [j.state().scene];
		starts.add(j.state().scene);
		let moving = false;
		for (let i = 0; i < 6000; i++) {
			j.advance(0.1);
			const s = j.state();
			if (moving && !s.transitioning) arrivals.push(s.scene);
			moving = s.transitioning;
		}
		for (let i = 1; i < arrivals.length; i++)
			assert.equal(
				arrivals[i],
				scenes[(scenes.indexOf(arrivals[i - 1]) + 1) % scenes.length],
			);
		assert.equal(calls, 1, "randomness is consumed only on startup");
		assert(!arrivals.includes("garden") && !arrivals.includes("room"));
		j.dispose();
		for (let i = 0; i + scenes.length <= arrivals.length; i += scenes.length)
			assert.equal(
				new Set(arrivals.slice(i, i + scenes.length)).size,
				scenes.length,
			);
	}
	assert.equal(starts.size, scenes.length);
});

test("authored transitions preserve easing and can be interrupted", () => {
	const journey = createJourney(0.69, () => 0);
	journey.select("city");
	journey.advance(2.5);
	let state = journey.state();
	assert.equal(state.transitioning, true);
	assert.equal(state.blend, 0.5);
	assert(Math.abs(state.positions.ink - 0.725) < 0.000001);
	assert(Math.abs(state.positions.city - 0.145) < 0.000001);
	journey.select("coast");
	state = journey.state();
	assert(Math.abs(state.positions.city - 0.145) < 0.000001);
	journey.advance(5);
	state = journey.state();
	assert.equal(state.scene, "coast");
	assert.equal(state.transitioning, false);
	assert.equal(state.positions.coast, 0.22);
});

test("hidden scene stays outside the public journey until returned", () => {
	const journey = createJourney(0.69, () => 0.9);
	assert(!scenes.includes("room"));
	journey.select("room");
	journey.advance(5);
	assert.equal(journey.state().scene, "room");
	for (let i = 0; i < 1000; i++) journey.advance(1);
	assert.equal(journey.state().scene, "room");
	journey.select("coast");
	journey.advance(5);
	assert.equal(journey.state().scene, "coast");
	journey.dispose();
});

test("manual selection resumes the fixed cycle from the selected scene", () => {
	for (const scene of scenes) {
		const journey = createJourney(0.69, () => 0);
		journey.select(scene, true);
		journey.advance(22);
		assert.equal(
			journey.state().to,
			scenes[(scenes.indexOf(scene) + 1) % scenes.length],
		);
		journey.advance(5);
		assert.equal(journey.state().transitioning, false);
		journey.dispose();
	}
});
