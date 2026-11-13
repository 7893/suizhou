import { createHash } from "node:crypto";
import { defineConfig } from "vite";
import { assetBase } from "./scripts/asset-base.mjs";
import { renderCopy } from "./scripts/html.mjs";

function subresourceIntegrity() {
	return {
		name: "subresource-integrity",
		enforce: "post",
		generateBundle: {
			order: "post",
			handler(_options, bundle) {
				const html = bundle["index.html"];
				if (html?.type !== "asset" || typeof html.source !== "string") return;
				const hashes = new Map();
				for (const [fileName, item] of Object.entries(bundle)) {
					const bytes =
						item.type === "chunk"
							? Buffer.from(item.code, "utf8")
							: Buffer.from(item.source);
					const digest = createHash("sha384").update(bytes).digest("base64");
					hashes.set(fileName, `sha384-${digest}`);
				}
				html.source = html.source.replace(
					/<(script|link)\b([^>]*?\b(?:src|href)="[^"]*?(assets\/[^"]+)"[^>]*)>/g,
					(full, tag, attrs, assetPath) => {
						const integrity = hashes.get(assetPath);
						if (!integrity || /\bintegrity=/.test(attrs)) return full;
						return `<${tag}${attrs} integrity="${integrity}">`;
					},
				);
			},
		},
	};
}

export default defineConfig({
	base: assetBase(process.env.ASSET_BASE_URL),
	plugins: [
		{
			name: "artwork-copy",
			transformIndexHtml: { order: "pre", handler: (html) => renderCopy(html) },
		},
		subresourceIntegrity(),
	],
	build: {
		target: "es2022",
		sourcemap: false,
		assetsInlineLimit: 0,
		license: { fileName: "assets/third-party.txt" },
	},
});
