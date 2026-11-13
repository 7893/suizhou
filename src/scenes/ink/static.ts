import { FISH_COUNT, fishState } from "../../motion/fish.ts";
import type { Painting } from "../types.ts";
import { inkLayout } from "./composition.ts";

export function drawStaticInk(
	ctx: CanvasRenderingContext2D,
	scene: Painting,
	boatLayer: HTMLCanvasElement,
) {
	const { layers, width, height } = scene;
	const sun = scene.portrait ? inkLayout.sun.portrait : inkLayout.sun.landscape;
	ctx.clearRect(0, 0, width, height);
	ctx.drawImage(layers.paper, 0, 0);
	ctx.save();
	ctx.fillStyle = "rgba(163,92,59,.19)";
	ctx.beginPath();
	ctx.arc(
		width * sun[0],
		height * sun[1],
		Math.min(width, height) * inkLayout.sun.radius,
		0,
		Math.PI * 2,
	);
	ctx.fill();
	ctx.restore();
	// The same ink layers yield a complete still painting without WebGL.
	for (const name of ["far", "middle", "near"])
		ctx.drawImage(layers[name], 0, 0);
	ctx.save();
	ctx.beginPath();
	ctx.rect(0, height * (inkLayout.waterline + 0.005), width, height * 0.215);
	ctx.clip();
	ctx.translate(0, height * inkLayout.waterline);
	ctx.scale(1, inkLayout.staticReflectionScale);
	ctx.translate(0, -height * inkLayout.waterline);
	ctx.globalAlpha = 0.18;
	for (const name of ["far", "middle", "near"])
		ctx.drawImage(layers[name], 0, 0);
	ctx.restore();
	for (let i = 0; i < FISH_COUNT; i++) {
		const fish = fishState(0, i, width / height),
			size = Math.min(width, height) * 0.027;
		ctx.save();
		ctx.translate(fish[0] * width, fish[1] * height);
		ctx.rotate(fish[2]);
		ctx.scale(size, size);
		ctx.fillStyle = `rgba(79,94,77,${fish[3]})`;
		ctx.beginPath();
		ctx.ellipse(0.08, 0, 0.58, 0.19, 0, 0, Math.PI * 2);
		ctx.fill();
		ctx.beginPath();
		ctx.moveTo(-0.4, 0);
		ctx.lineTo(-0.93, -0.27);
		ctx.lineTo(-0.88, 0.27);
		ctx.closePath();
		ctx.fill();
		ctx.restore();
	}
	for (const name of ["shore", "foliage"]) ctx.drawImage(layers[name], 0, 0);
	ctx.drawImage(boatLayer, 0, 0);
}
