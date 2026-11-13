import type { SceneName } from "../scenes/types.ts";

// Prepare one remaining scene per idle callback, after the first painted frame.
export function createPreparation(
	prepare: (name: SceneName) => void | Promise<void>,
) {
	let pending: number | null = null;
	let generation = 0;
	const schedule = window.requestIdleCallback
		? (fn: () => void) => window.requestIdleCallback(fn, { timeout: 2000 })
		: (fn: () => void) => setTimeout(fn, 150);
	const cancel = window.cancelIdleCallback
		? (id: number) => window.cancelIdleCallback(id)
		: clearTimeout;
	function stop() {
		generation++;
		if (pending !== null) cancel(pending);
		pending = null;
	}
	function start(names: SceneName[]) {
		stop();
		const activeGen = generation;
		const queue = [...names];
		async function next() {
			pending = null;
			if (document.hidden || activeGen !== generation) return;
			const name = queue.shift();
			if (name) await prepare(name);
			if (queue.length && !document.hidden && activeGen === generation)
				pending = schedule(() => {
					void next();
				});
		}
		if (queue.length)
			pending = schedule(() => {
				void next();
			});
	}
	return { start, stop };
}
