export function assetBase(value) {
	if (!value) return "/";
	const url = new URL(value);
	if (
		url.protocol !== "https:" ||
		url.username ||
		url.password ||
		url.search ||
		url.hash ||
		url.pathname !== "/"
	)
		throw new Error("ASSET_BASE_URL must be a plain HTTPS origin");
	return `${url.origin}/`;
}
