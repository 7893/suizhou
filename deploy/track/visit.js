/* First-party visitor trail for the 随舟 document only. Posts to /sz/track on this host. */
(() => {
	if (window.__szVisit) return;
	window.__szVisit = 1;

	const started = performance.now();
	const vid = visitorId();
	const sid = hex(8);
	let seq = 0;
	let profilePromise = null;
	let maxScroll = 0;
	let tabSwitches = 0;
	let hiddenAt = null;
	let left = false;
	let lastPointer = 0;
	let resizeTimer = 0;
	const scrollMarks = new Set();

	function hex(bytes) {
		const data = new Uint8Array(bytes);
		crypto.getRandomValues(data);
		return Array.from(data, (value) =>
			value.toString(16).padStart(2, "0"),
		).join("");
	}

	function visitorId() {
		try {
			let stored = localStorage.getItem("sz_vid");
			if (!stored || !/^[0-9a-f]{24}$/.test(stored)) {
				stored = hex(12);
				localStorage.setItem("sz_vid", stored);
			}
			return stored;
		} catch {
			return hex(12);
		}
	}

	function scene() {
		const pressed = document.querySelector("[data-scene][aria-pressed='true']");
		return pressed?.dataset?.scene || null;
	}

	function scrollPct() {
		const root = document.documentElement;
		const span = root.scrollHeight - window.innerHeight;
		if (span <= 0) return 0;
		return Math.max(
			0,
			Math.min(100, Math.round((window.scrollY / span) * 100)),
		);
	}

	function media(query) {
		try {
			return window.matchMedia ? window.matchMedia(query).matches : null;
		} catch {
			return null;
		}
	}

	function gpu() {
		try {
			const canvas = document.createElement("canvas");
			const gl =
				canvas.getContext("webgl2") ||
				canvas.getContext("webgl") ||
				canvas.getContext("experimental-webgl");
			if (!gl) return null;
			const debug = gl.getExtension("WEBGL_debug_renderer_info");
			const info = {
				webgl_ver:
					typeof WebGL2RenderingContext !== "undefined" &&
					gl instanceof WebGL2RenderingContext
						? "webgl2"
						: "webgl1",
				vendor: debug
					? gl.getParameter(debug.UNMASKED_VENDOR_WEBGL)
					: gl.getParameter(gl.VENDOR),
				renderer: debug
					? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)
					: gl.getParameter(gl.RENDERER),
				max_tex_size: gl.getParameter(gl.MAX_TEXTURE_SIZE),
			};
			gl.getExtension("WEBGL_lose_context")?.loseContext();
			return info;
		} catch {
			return null;
		}
	}

	async function canvasFp() {
		try {
			const canvas = document.createElement("canvas");
			canvas.width = 220;
			canvas.height = 44;
			const ctx = canvas.getContext("2d");
			if (!ctx) return null;
			ctx.textBaseline = "alphabetic";
			ctx.fillStyle = "#fbbc04";
			ctx.fillRect(10, 4, 80, 24);
			ctx.fillStyle = "#0b57d0";
			ctx.font = "15px Arial, sans-serif";
			ctx.fillText("sz-fp-2026 中文 AaBb", 6, 22);
			ctx.strokeStyle = "#34a853";
			ctx.beginPath();
			ctx.arc(170, 22, 14, 0, Math.PI * 1.6);
			ctx.stroke();
			const digest = await crypto.subtle.digest(
				"SHA-256",
				new TextEncoder().encode(canvas.toDataURL()),
			);
			return Array.from(new Uint8Array(digest).slice(0, 8), (value) =>
				value.toString(16).padStart(2, "0"),
			).join("");
		} catch {
			return null;
		}
	}

	function fonts() {
		try {
			const ctx = document.createElement("canvas").getContext("2d");
			if (!ctx) return [];
			const sample = "mmmmmmmmmmlli中文测试";
			const bases = ["monospace", "sans-serif", "serif"];
			const widths = {};
			for (const base of bases) {
				ctx.font = `36px ${base}`;
				widths[base] = ctx.measureText(sample).width;
			}
			const probes = [
				"PingFang SC",
				"Hiragino Sans GB",
				"Heiti SC",
				"SF Pro Text",
				"Microsoft YaHei",
				"SimSun",
				"Segoe UI",
				"HarmonyOS Sans",
				"HarmonyOS Sans SC",
				"MiSans",
				"Roboto",
				"Noto Sans CJK SC",
				"Source Han Sans SC",
				"Ubuntu",
			];
			const found = [];
			for (const name of probes) {
				for (const base of bases) {
					ctx.font = `36px "${name}", ${base}`;
					if (ctx.measureText(sample).width !== widths[base]) {
						found.push(name);
						break;
					}
				}
			}
			return found;
		} catch {
			return [];
		}
	}

	async function profile() {
		if (!profilePromise) profilePromise = collect();
		return profilePromise;
	}

	async function collect() {
		const time = (() => {
			try {
				return Intl.DateTimeFormat().resolvedOptions();
			} catch {
				return {};
			}
		})();
		let hints = null;
		try {
			if (navigator.userAgentData?.getHighEntropyValues) {
				hints = await navigator.userAgentData.getHighEntropyValues([
					"architecture",
					"bitness",
					"formFactors",
					"fullVersionList",
					"model",
					"platform",
					"platformVersion",
					"wow64",
				]);
			}
		} catch {
			hints = null;
		}
		let battery = null;
		try {
			if (navigator.getBattery) {
				const cell = await Promise.race([
					navigator.getBattery(),
					new Promise((resolve) => setTimeout(() => resolve(null), 1500)),
				]);
				if (cell) {
					battery = {
						level:
							typeof cell.level === "number"
								? Math.round(cell.level * 100) / 100
								: null,
						charging: !!cell.charging,
					};
				}
			}
		} catch {
			battery = null;
		}
		let storage = null;
		try {
			if (navigator.storage?.estimate) {
				const estimate = await navigator.storage.estimate();
				storage = {
					quota_mb: estimate.quota
						? Math.round(estimate.quota / 1048576)
						: null,
					usage_mb: estimate.usage
						? Math.round((estimate.usage / 1048576) * 100) / 100
						: 0,
					persisted: navigator.storage.persisted
						? await navigator.storage.persisted()
						: null,
				};
			}
		} catch {
			storage = null;
		}
		let nav = null;
		try {
			const entry = performance.getEntriesByType?.("navigation")?.[0];
			if (entry) {
				nav = {
					type: entry.type,
					protocol: entry.nextHopProtocol || null,
					dns_ms: Math.round(entry.domainLookupEnd - entry.domainLookupStart),
					tcp_ms: Math.round(entry.connectEnd - entry.connectStart),
					tls_ms:
						entry.secureConnectionStart > 0
							? Math.round(entry.connectEnd - entry.secureConnectionStart)
							: 0,
					ttfb_ms: Math.round(entry.responseStart - entry.requestStart),
					dom_ready_ms: Math.round(
						entry.domContentLoadedEventEnd - entry.startTime,
					),
					transfer_bytes: entry.transferSize ?? null,
				};
			}
		} catch {
			nav = null;
		}
		const link =
			navigator.connection ||
			navigator.mozConnection ||
			navigator.webkitConnection;
		const screenInfo = window.screen;
		const visual = window.visualViewport;
		return {
			client_time: new Date().toISOString(),
			tz: time.timeZone || null,
			tz_offset_min: new Date().getTimezoneOffset(),
			locale: time.locale || null,
			calendar: time.calendar || null,
			numbering: time.numberingSystem || null,
			hour_cycle: time.hourCycle || null,
			lang: navigator.language || null,
			langs: navigator.languages ? Array.from(navigator.languages) : [],
			url: location.href,
			referrer: document.referrer || null,
			platform: navigator.platform || null,
			vendor: navigator.vendor || null,
			ua_client: navigator.userAgent || null,
			ua_mobile: navigator.userAgentData
				? !!navigator.userAgentData.mobile
				: null,
			ua_high_entropy: hints,
			cpu_cores: navigator.hardwareConcurrency || null,
			ram_gb: navigator.deviceMemory || null,
			max_touch_points: navigator.maxTouchPoints ?? 0,
			webdriver: !!navigator.webdriver,
			pdf_viewer: navigator.pdfViewerEnabled ?? null,
			cookie_enabled: navigator.cookieEnabled ?? null,
			dnt: navigator.doNotTrack || null,
			gpc: navigator.globalPrivacyControl ?? null,
			online: navigator.onLine ?? null,
			screen: {
				w: screenInfo?.width ?? null,
				h: screenInfo?.height ?? null,
				avail_w: screenInfo?.availWidth ?? null,
				avail_h: screenInfo?.availHeight ?? null,
				avail_left: screenInfo?.availLeft ?? null,
				avail_top: screenInfo?.availTop ?? null,
				color_depth: screenInfo?.colorDepth ?? null,
				pixel_depth: screenInfo?.pixelDepth ?? null,
				dpr: window.devicePixelRatio || 1,
				orientation: screenInfo?.orientation?.type || null,
				extended: screenInfo?.isExtended ?? null,
			},
			viewport: {
				inner_w: window.innerWidth,
				inner_h: window.innerHeight,
				outer_w: window.outerWidth,
				outer_h: window.outerHeight,
				visual_w: visual?.width ?? null,
				visual_h: visual?.height ?? null,
				visual_scale: visual?.scale ?? null,
			},
			display: {
				dark_mode: media("(prefers-color-scheme: dark)"),
				hdr: media("(dynamic-range: high)"),
				gamut_p3: media("(color-gamut: p3)"),
				gamut_rec2020: media("(color-gamut: rec2020)"),
				pointer_coarse: media("(pointer: coarse)"),
				hover: media("(hover: hover)"),
				reduced_motion: media("(prefers-reduced-motion: reduce)"),
				reduced_transparency: media("(prefers-reduced-transparency: reduce)"),
				contrast_more: media("(prefers-contrast: more)"),
				forced_colors: media("(forced-colors: active)"),
				display_mode: media("(display-mode: standalone)")
					? "standalone"
					: "browser",
			},
			gpu: gpu(),
			canvas_fp: await canvasFp(),
			fonts: fonts(),
			network: link
				? {
						effective_type: link.effectiveType || null,
						downlink_mbps: link.downlink ?? null,
						rtt_ms: link.rtt ?? null,
						save_data: !!link.saveData,
						type: link.type || null,
					}
				: null,
			battery,
			storage,
			nav_perf: nav,
			js_heap_limit_mb: performance.memory?.jsHeapSizeLimit
				? Math.round(performance.memory.jsHeapSizeLimit / 1048576)
				: null,
		};
	}

	async function send(event, detail = {}, beacon = false) {
		try {
			const body = {
				vid,
				sid,
				seq: ++seq,
				event,
				client_ts: new Date().toISOString(),
				dwell_ms: Math.round(performance.now() - started),
				scene: scene(),
				detail,
			};
			if (event === "page_open") body.profile = await profile();
			const raw = JSON.stringify(body);
			if (raw.length > 12000) return;
			const url = `/sz/track?ev=${encodeURIComponent(event)}&vid=${encodeURIComponent(vid)}&sid=${encodeURIComponent(sid)}`;
			if (
				beacon &&
				navigator.sendBeacon?.(
					url,
					new Blob([raw], { type: "application/json" }),
				)
			) {
				return;
			}
			await fetch(url, {
				method: "POST",
				body: raw,
				headers: { "Content-Type": "application/json" },
				credentials: "same-origin",
				keepalive: true,
				cache: "no-store",
			});
		} catch {
			/* the page keeps working if the trail is blocked */
		}
	}

	function markScroll() {
		maxScroll = Math.max(maxScroll, scrollPct());
		for (const mark of [25, 50, 75, 100]) {
			if (maxScroll >= mark && !scrollMarks.has(mark)) {
				scrollMarks.add(mark);
				void send("scroll_depth", { pct: mark });
			}
		}
	}

	document.addEventListener("click", (event) => {
		const button = event.target?.closest?.("button");
		if (!button) return;
		const label = (
			button.getAttribute("aria-label") ||
			button.textContent ||
			""
		)
			.replace(/\s+/g, " ")
			.trim()
			.slice(0, 40);
		void send("click", {
			id: button.id || null,
			scene: button.dataset.scene || null,
			label,
		});
	});

	document.addEventListener("keydown", (event) => {
		if (event.key === "Escape") void send("key_escape", {});
	});

	document.addEventListener("copy", () => {
		const selected = String(window.getSelection?.() || "");
		void send("text_copy", { len: selected.length });
	});

	window.addEventListener("scroll", markScroll, { passive: true });
	window.addEventListener("resize", () => {
		clearTimeout(resizeTimer);
		resizeTimer = setTimeout(() => {
			void send("viewport_resize", {
				inner_w: window.innerWidth,
				inner_h: window.innerHeight,
				dpr: window.devicePixelRatio || 1,
			});
		}, 400);
	});
	window.addEventListener("online", () => void send("online", {}));
	window.addEventListener("offline", () => void send("offline", {}));

	document.addEventListener("visibilitychange", () => {
		if (document.visibilityState === "hidden") {
			hiddenAt = performance.now();
			tabSwitches += 1;
			void send("visibility_hidden", {});
			return;
		}
		const away =
			hiddenAt === null ? null : Math.round(performance.now() - hiddenAt);
		hiddenAt = null;
		void send("tab_return", { away_ms: away, tab_switches: tabSwitches });
	});

	window.addEventListener("pagehide", () => {
		if (left) return;
		left = true;
		void send(
			"page_leave",
			{ max_scroll_pct: maxScroll, tab_switches: tabSwitches },
			true,
		);
	});

	window.addEventListener("pageshow", (event) => {
		if (!event.persisted) return;
		left = false;
		void send("page_restore", {});
	});

	const canvas = document.querySelector("canvas#landscape");
	if (canvas) {
		const reportCanvas = () =>
			void send("canvas_state", {
				ready: canvas.dataset.ready || null,
				renderer: canvas.dataset.renderer || null,
			});
		new MutationObserver(reportCanvas).observe(canvas, {
			attributes: true,
			attributeFilter: ["data-ready", "data-renderer"],
		});
		canvas.addEventListener(
			"webglcontextlost",
			() => void send("webgl_lost", {}),
		);
		canvas.addEventListener(
			"webglcontextrestored",
			() => void send("webgl_restored", {}),
		);
		canvas.addEventListener("pointerdown", (event) => {
			const now = performance.now();
			if (now - lastPointer < 400) return;
			lastPointer = now;
			const rect = canvas.getBoundingClientRect();
			void send("canvas_pointer", {
				pointer: event.pointerType || null,
				button: event.button,
				x: rect.width
					? Math.round(((event.clientX - rect.left) / rect.width) * 1000) / 1000
					: null,
				y: rect.height
					? Math.round(((event.clientY - rect.top) / rect.height) * 1000) / 1000
					: null,
			});
		});
	}

	void send("page_open", { opened_at: openedStamp() });

	function openedStamp() {
		return new Date(Date.now() - (performance.now() - started)).toISOString();
	}
})();
