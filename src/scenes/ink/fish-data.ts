import { FISH_COUNT, fishState } from "../../motion/fish.ts";
import { LEAP_DURATION, leapingFish } from "../../motion/fish-leap.ts";

const STARTLE_RADIUS = 0.28;
const STARTLE_DURATION = 4.2;

export function startledFish(
	base: number[],
	aspect: number,
	time: number,
	touch?: ArrayLike<number>,
) {
	if (!touch) return base;
	const touchAge = time - touch[2];
	if (touchAge <= 0 || touchAge >= STARTLE_DURATION) return base;
	const dx = (base[0] - touch[0]) * aspect;
	const dy = (base[1] - touch[1]) * 1.8;
	const dist = Math.hypot(dx, dy);
	if (dist >= STARTLE_RADIUS) return base;

	const ux = dist > 1e-4 ? dx / dist : 1;
	const uy = dist > 1e-4 ? dy / dist : 0;
	const proximity = (1 - dist / STARTLE_RADIUS) ** 2;
	const rise = 1 - Math.exp(-touchAge * 8.5);
	const decay = Math.cos((touchAge / STARTLE_DURATION) * Math.PI * 0.5) ** 2;
	const amp = 0.055 * proximity * rise * decay;

	const escapeHeading = Math.atan2(uy / 1.8, ux);
	const deltaAngle = Math.atan2(
		Math.sin(escapeHeading - base[2]),
		Math.cos(escapeHeading - base[2]),
	);
	const burst = Math.exp(-touchAge * 2.4) * proximity * rise;

	return [
		Math.max(0.04, Math.min(0.96, base[0] + (ux / aspect) * amp)),
		Math.max(0.795, Math.min(0.945, base[1] + (uy / 1.8) * amp)),
		base[2] + deltaAngle * burst * 0.85,
		Math.min(0.68, base[3] + burst * 0.14),
	];
}

export function updateFish(
	canvas: HTMLCanvasElement,
	time: number,
	fishData: Float32Array,
	rippleData: Float32Array,
	touch?: ArrayLike<number>,
) {
	const aspect = canvas.width / canvas.height;
	for (let i = 0; i < FISH_COUNT; i++) {
		const period = 13 + i * 3;
		const age = (time + period - i * 3 - 2) % period;
		const position = fishState(
			time - age + (i === 0 ? LEAP_DURATION : 0),
			i,
			aspect,
		);
		const airborne = i === 0 && age < LEAP_DURATION;
		const base =
			i === 0 ? leapingFish(time, age, aspect) : fishState(time, i, aspect);
		fishData.set(
			airborne ? base : startledFish(base, aspect, time, touch),
			i * 4,
		);
		rippleData.set(
			[
				position[0],
				position[1],
				age,
				age < 4 ? Math.sin((Math.PI * age) / 4) * 0.65 : 0,
			],
			i * 4,
		);
	}
}
