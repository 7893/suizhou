import type { SceneName } from "../scenes/types.ts";

type Conditions = { wind: number; cloud: number; haze: number };

import { places } from "../config/places.ts";

// Render conditions, independent of any weather provider or network lifecycle.
// wind: artistic multiplier [0,2]; cloud/haze: coverage [0,1].
// Rain and daylight will get their own rendering passes when weather is added.
export function createEnvironment() {
	const fields = ["wind", "cloud", "haze"] as const;
	const states = new Map(
		Object.entries(places).map(([name, place]) => [
			name,
			{
				target: { ...place.environment },
				current: { ...place.environment },
				time: null as number | null,
				atmosphere: new Float32Array(3),
				wind: new Float32Array(4),
			},
		]),
	);
	function setTarget(name: SceneName, conditions: Partial<Conditions> = {}) {
		const state = states.get(name);
		if (!state) throw new Error(`Unknown environment: ${name}`);
		for (const field of fields) {
			const value = conditions[field];
			if (typeof value === "number" && Number.isFinite(value))
				state.target[field] = Math.max(
					0,
					Math.min(field === "wind" ? 2 : 1, value),
				);
		}
	}
	function reset(name: SceneName) {
		if (!places[name]) throw new Error(`Unknown environment: ${name}`);
		setTarget(name, places[name].environment);
	}
	function breathe(name: SceneName, time: number) {
		const base = places[name]?.environment;
		if (!base) throw new Error(`Unknown environment: ${name}`);
		const seed = name.charCodeAt(0) * 0.37;
		setTarget(name, {
			wind:
				base.wind +
				Math.sin(time * 0.11 + seed) * 0.17 +
				Math.sin(time * 0.043 - seed) * 0.09,
			cloud:
				base.cloud +
				Math.sin(time * 0.067 + seed * 1.7) * 0.11 +
				Math.cos(time * 0.029 + seed) * 0.05,
			haze: base.haze + Math.cos(time * 0.053 - seed * 1.3) * 0.07,
		});
	}
	function sample(name: SceneName, time: number, wind: ArrayLike<number>) {
		const state = states.get(name);
		if (!state) throw new Error(`Unknown environment: ${name}`);
		// Hidden scenes do not jump through a long interpolation on re-entry.
		const dt =
			state.time === null ? 0 : Math.max(0, Math.min(1, time - state.time));
		state.time = time;
		const blend = 1 - Math.exp(-dt / 8);
		for (let i = 0; i < fields.length; i++) {
			const key = fields[i];
			state.current[key] += (state.target[key] - state.current[key]) * blend;
			state.atmosphere[i] = state.current[key];
		}
		const strength = 0.25 + 0.75 * state.current.wind;
		// Preserve integrated cloud drift: scaling absolute phase causes snapping.
		state.wind[0] = wind[0] * strength;
		state.wind[1] = wind[1] * strength;
		state.wind[2] = wind[2];
		state.wind[3] = wind[3] * strength;
		return state;
	}
	return { setTarget, reset, breathe, sample };
}
