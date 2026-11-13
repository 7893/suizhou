import { expect, test } from "@playwright/test";

test("renders production bundle and switches scenes cleanly", async ({
	page,
}) => {
	const errors: string[] = [];
	page.on("pageerror", (error) => errors.push(error.message));
	await page.goto("/");
	await expect(page).toHaveTitle(/随舟/i);
	const canvas = page.locator("canvas#landscape");
	await expect(canvas).toBeVisible();
	await expect(canvas).toHaveAttribute("data-ready", "true");

	const coastBtn = page.locator('button[data-scene="coast"]');
	await coastBtn.click();
	await expect(coastBtn).toHaveAttribute("aria-pressed", "true");
	expect(errors).toEqual([]);
});

test("static Canvas 2D fallback matches viewport and resizes cleanly", async ({
	page,
}) => {
	await page.addInitScript(() => {
		const original = HTMLCanvasElement.prototype.getContext;
		HTMLCanvasElement.prototype.getContext = function (
			type: string,
			...rest: unknown[]
		) {
			if (type === "webgl2") return null;
			return original.apply(this, [type, ...rest] as never);
		} as typeof HTMLCanvasElement.prototype.getContext;
	});
	await page.setViewportSize({ width: 960, height: 640 });
	await page.goto("/");
	const landscape = page.locator("canvas#landscape");
	await expect(landscape).toHaveAttribute("data-renderer", "canvas2d");
	await expect(landscape).toHaveAttribute("data-ready", "true");

	const fallback = page.locator("canvas#fallback-canvas");
	await expect(fallback).toBeVisible();
	const initial = await fallback.evaluate((el: HTMLCanvasElement) => ({
		width: el.width,
		height: el.height,
	}));
	expect(initial.width).toBeGreaterThanOrEqual(960);
	expect(initial.height).toBeGreaterThanOrEqual(640);

	await page.setViewportSize({ width: 390, height: 844 });
	await expect
		.poll(() =>
			fallback.evaluate((el: HTMLCanvasElement) => ({
				width: el.width,
				height: el.height,
			})),
		)
		.toEqual({ width: 390, height: 844 });
});
