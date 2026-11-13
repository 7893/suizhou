import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { create } from "fontkit";
import subsetFont from "subset-font";
import { copy } from "../src/config/copy.ts";
import { renameSubset } from "./font-name.mjs";

const root = new URL("../", import.meta.url);
const scenes = Object.values(copy.scenes);
const fonts = [
	{
		name: "qiuhong",
		url: "https://raw.githubusercontent.com/maoken-fonts/slidefont/e6a0d2bcef0501849178b8c55047d80e26c6fedb/fonts/Slideqiuhong-Regular.ttf",
		hash: "d74ea3a8872e10226833793d0075716a4bcc2a3f72edb45cfeac6330f912d899",
		text: scenes.map((scene) => scene.title).join(""),
	},
	{
		name: "wenkai",
		url: "https://github.com/lxgw/LxgwWenKai/releases/download/v1.522/LXGWWenKai-Regular.ttf",
		hash: "39ad71264b588165b469e35e6afb162a378dacd1f95348160240ba9038ac3009",
		text: copy.site.signature + scenes.flatMap((scene) => scene.poem).join(""),
	},
];

function verifyGlyphs(buffer, text, name) {
	const font = create(buffer);
	const missing = [...text].filter(
		(char) => !font.hasGlyphForCodePoint(char.codePointAt(0)),
	);
	if (missing.length)
		throw new Error(`${name}: missing glyphs ${missing.join("")}`);
}

export async function buildFonts() {
	await mkdir(new URL(".cache/fonts/", root), { recursive: true });
	for (const font of fonts) {
		const text = [...new Set(font.text)].sort().join("");
		const path = new URL(`.cache/fonts/${font.name}.ttf`, root);
		let source;
		try {
			source = await readFile(path);
		} catch (error) {
			if (error.code !== "ENOENT") throw error;
			const response = await fetch(font.url, {
				signal: AbortSignal.timeout(60000),
			});
			if (!response.ok)
				throw new Error(`Font download failed: ${response.status}`);
			source = Buffer.from(await response.arrayBuffer());
		}
		if (createHash("sha256").update(source).digest("hex") !== font.hash)
			throw new Error(`Font checksum mismatch: ${font.name}`);
		await writeFile(path, source);
		verifyGlyphs(source, text, font.name);
		const sfnt = await subsetFont(source, text, {
			targetFormat: "sfnt",
			preserveNameIds: [0, 13, 14],
		});
		// Avoid using upstream reserved family names for our modified web subset.
		const renamed = font.name === "wenkai" ? renameSubset(sfnt, "Boat") : sfnt;
		const subset = await subsetFont(renamed, text, {
			targetFormat: "woff2",
			preserveNameIds: [0, 13, 14],
		});
		verifyGlyphs(subset, text, font.name);
		await writeFile(
			new URL(`src/assets/fonts/${font.name}.woff2`, root),
			subset,
		);
		console.log(
			`${font.name}: ${text.length} characters, ${subset.length} bytes`,
		);
	}
}

export async function verifyFonts() {
	for (const font of fonts) {
		const text = [...new Set(font.text)].sort().join("");
		const subset = await readFile(
			new URL(`src/assets/fonts/${font.name}.woff2`, root),
		);
		verifyGlyphs(subset, text, font.name);
	}
}

if (
	process.argv[1] &&
	pathToFileURL(process.argv[1]).href === import.meta.url
) {
	if (process.argv.includes("--verify")) await verifyFonts();
	else await buildFonts();
}
