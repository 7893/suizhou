import type { Painting } from "../types.ts";
import { cityLayout } from "./composition.ts";

export function drawStaticCity(
	ctx: CanvasRenderingContext2D,
	city: Painting,
	boatLayer: HTMLCanvasElement,
) {
	const { width: w, height: h, layers } = city;
	const sky = ctx.createLinearGradient(0, 0, 0, h);
	sky.addColorStop(0, "#102330");
	sky.addColorStop(0.57, "#63727a");
	sky.addColorStop(0.63, "#455d68");
	sky.addColorStop(cityLayout.waterline, "#152d3b");
	sky.addColorStop(1, "#081d2b");
	ctx.fillStyle = sky;
	ctx.fillRect(0, 0, w, h);
	ctx.drawImage(layers.buildings, 0, 0);
	ctx.drawImage(layers.lights, 0, 0);
	ctx.save();
	ctx.globalCompositeOperation = "screen";
	ctx.globalAlpha = 0.6;
	ctx.drawImage(layers.glow, 0, 0, w, h);
	ctx.restore();
	ctx.save();
	ctx.translate(0, h * cityLayout.waterline);
	ctx.scale(1, cityLayout.staticReflectionScale);
	ctx.translate(0, -h * (cityLayout.waterline - 0.005));
	ctx.globalAlpha = 0.26;
	ctx.drawImage(layers.buildings, 0, 0);
	ctx.globalAlpha = 0.38;
	ctx.drawImage(layers.lights, 0, 0);
	ctx.restore();
	ctx.drawImage(layers.bank, 0, 0);
	ctx.drawImage(boatLayer, 0, 0);
}
