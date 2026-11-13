import { expect, test } from "@playwright/test";

test("renders production bundle and switches scenes cleanly", async ({
	page,
}) => {
	const issues: string[] = [];
	await page.route("http://localhost:4173/", async (route) => {
		const response = await route.fetch();
		await route.fulfill({
			response,
			headers: {
				...response.headers(),
				"content-security-policy":
					"default-src 'none'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self' data:; connect-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
			},
		});
	});
	page.on("pageerror", (error) => issues.push(`pageerror: ${error.message}`));
	page.on("requestfailed", (req) =>
		issues.push(`requestfailed: ${req.url()} ${req.failure()?.errorText}`),
	);
	page.on("console", (msg) => {
		if (msg.text().includes("GPU stall due to ReadPixels")) return;
		if (msg.type() === "warning" || msg.type() === "error")
			issues.push(`${msg.type()}: ${msg.text()}`);
	});
	await page.goto("/");
	await expect(page).toHaveTitle(/随舟/i);
	const canvas = page.locator("canvas#landscape");
	await expect(canvas).toBeVisible();
	await expect(canvas).toHaveAttribute("data-ready", "true");

	for (const scene of ["ink", "city", "coast"] as const) {
		const btn = page.locator(`button[data-scene="${scene}"]`);
		await btn.click();
		await expect(btn).toHaveAttribute("aria-pressed", "true");
	}
	await page.setViewportSize({ width: 1024, height: 700 });
	await page.waitForTimeout(250);
	expect(issues).toEqual([]);
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
