import { readdir, stat } from "node:fs/promises";
import { extname } from "node:path";
import { pathToFileURL } from "node:url";

export async function checkBuild(root) {
	const required = new Set(["index.html", "LICENSE", "NOTICE", "robots.txt"]);
	const extensions = new Set([".js", ".css", ".woff2", ".txt"]);
	let bytes = 0,
		files = 0;
	for (const name of await readdir(root, { recursive: true })) {
		const entry = await stat(new URL(name, root));
		if (entry.isDirectory()) {
			if (name !== "assets")
				throw new Error(`Unexpected output directory: ${name}`);
			continue;
		}
		if (required.has(name)) required.delete(name);
		else if (!name.startsWith("assets/") || !extensions.has(extname(name)))
			throw new Error(`Unexpected public file: ${name}`);
		bytes += entry.size;
		files++;
	}
	if (required.size || files > 1000 || bytes > 20 * 1024 * 1024)
		throw new Error("Public build violates the deployment contract");
	console.log(`Validated ${files} public files (${bytes} bytes).`);
}

if (
	process.argv[1] &&
	pathToFileURL(process.argv[1]).href === import.meta.url
) {
	await checkBuild(new URL("../dist/", import.meta.url));
}
