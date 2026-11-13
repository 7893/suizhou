import { SpinePipe } from "@esotericsoftware/spine-pixi-v8";
import type { WebGLRenderer } from "pixi.js";
import { Container } from "pixi.js";
import { createRunningChild } from "./child.ts";
import { actorSurface } from "./surface.ts";

// Both children share one small atlas and one application clock.
export function createBeachActors() {
	const root = new Container(),
		children = [createRunningChild(0), createRunningChild(1)];
	root.addChild(...children.map((child) => child.root));
	const surface = actorSurface(root, 128, 64, 2);
	let attachedPipes: Record<string, SpinePipe | undefined> | null = null;
	let ownedPipe: SpinePipe | null = null;
	return {
		texture: surface.texture,
		draw(renderer: WebGLRenderer, time: number, width: number, height: number) {
			const pipes = renderer.renderPipes as unknown as Record<
				string,
				SpinePipe | undefined
			>;
			if (!pipes.spine) {
				ownedPipe = new SpinePipe(renderer);
				pipes.spine = ownedPipe;
				attachedPipes = pipes;
			}
			children.forEach((child) => child.update(time, width, height));
			surface.draw(renderer);
		},
		dispose() {
			children.forEach((child) => child.dispose());
			surface.dispose();
			if (ownedPipe && attachedPipes?.spine === ownedPipe) {
				delete attachedPipes.spine;
				ownedPipe.destroy();
			}
			ownedPipe = null;
			attachedPipes = null;
		},
	};
}
