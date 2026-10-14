import { expect, test } from "@playwright/test";

test("has title and canvas", async ({ page }) => {
	await page.goto("/");
	await expect(page).toHaveTitle(/随舟/i);
	const canvas = page.locator("canvas#landscape");
	await expect(canvas).toBeVisible();
});

test("share page loads and has input form", async ({ page }) => {
	await page.goto("/share.html");
	await expect(page).toHaveTitle(/网址分享/);
	const urlInput = page.locator("#url-input");
	await expect(urlInput).toBeVisible();
	const submitBtn = page.locator("#submit-btn");
	await expect(submitBtn).toBeVisible();
});
