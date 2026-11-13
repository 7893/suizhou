import { Ticker } from "pixi.js";
// Monitor actual animation callbacks as well as CPU submission cost.
export function createCadence() {
	let fps = 60,
		interval = 16.67,
		cost = 0,
		windowTime = 0,
		strikes = 0;
	return {
		get fps() {
			return fps;
		},
		sample(delta: number, renderCost: number | null) {
			if (delta <= 0 || delta > 150) return;
			interval += (delta - interval) * 0.05;
			if (renderCost !== null) cost += (renderCost - cost) * 0.08;
			windowTime += delta;
			if (fps === 60 && windowTime > 2500 && (interval > 23 || cost > 13)) {
				fps = 30;
				strikes++;
				windowTime = 0;
			} else if (
				fps === 30 &&
				strikes < 3 &&
				windowTime > 10000 * strikes &&
				interval < 19 &&
				cost < 8
			) {
				fps = 60;
				windowTime = 0;
			}
		},
		reset() {
			fps = 60;
			interval = 16.67;
			cost = 0;
			windowTime = 0;
			strikes = 0;
		},
	};
}
export function createAnimation({
	active,
	advance,
	draw,
	onRate,
}: {
	active: () => boolean;
	advance: (dt: number) => void;
	draw: () => void;
	onRate: (fps: number) => void;
}) {
	const cadence = createCadence();
	const clock = new Ticker(),
		render = new Ticker();
	clock.minFPS = render.minFPS = 4;
	render.maxFPS = 60;
	let cost: number | null = null;
	render.add(() => {
		const start = performance.now();
		draw();
		cost = performance.now() - start;
	});
	clock.add((tick) => {
		if (!active()) {
			clock.stop();
			return;
		}
		advance(tick.deltaMS / 1000);
		cost = null;
		render.update(tick.lastTime + tick.elapsedMS);
		cadence.sample(tick.elapsedMS, cost);
		if (render.maxFPS !== cadence.fps) {
			render.maxFPS = cadence.fps;
			onRate(cadence.fps);
		}
	});
	return {
		stop: () => clock.stop(),
		sync() {
			clock.stop();
			cadence.reset();
			render.maxFPS = 60;
			render.lastTime = performance.now();
			onRate(60);
			if (active()) clock.start();
		},
		dispose() {
			clock.destroy();
			render.destroy();
		},
	};
}
