import { defineConfig } from "vite";
import { assetBase } from "./scripts/asset-base.mjs";
import { renderCopy } from "./scripts/html.mjs";

export default defineConfig({
	base: assetBase(process.env.ASSET_BASE_URL),
	plugins: [
		{
			name: "artwork-copy",
			transformIndexHtml: { order: "pre", handler: (html) => renderCopy(html) },
		},
	],
	build: {
		target: "es2022",
		sourcemap: false,
		assetsInlineLimit: 0,
		license: { fileName: "assets/third-party.txt" },
	},
});
