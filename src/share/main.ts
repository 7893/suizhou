interface LinkItem {
	id: string;
	url: string;
	domain: string;
	note?: string;
	sender?: string;
	created_at: string;
	timestamp: number;
}

const form = document.getElementById("share-form") as HTMLFormElement;
const urlInput = document.getElementById("url-input") as HTMLInputElement;
const noteInput = document.getElementById("note-input") as HTMLInputElement;
const senderInput = document.getElementById("sender-input") as HTMLInputElement;
const submitBtn = document.getElementById("submit-btn") as HTMLButtonElement;
const pasteBtn = document.getElementById("paste-btn") as HTMLButtonElement;
const copyPageBtn = document.getElementById(
	"copy-page-link",
) as HTMLButtonElement;
const refreshBtn = document.getElementById("refresh-btn") as HTMLButtonElement;
const linksContainer = document.getElementById(
	"links-container",
) as HTMLElement;
const linksCountBadge = document.getElementById("links-count") as HTMLElement;
const toastEl = document.getElementById("toast") as HTMLElement;

let toastTimer: number | undefined;

function showToast(message: string, isError = false) {
	if (toastTimer) window.clearTimeout(toastTimer);
	toastEl.textContent = message;
	toastEl.className = isError ? "toast error show" : "toast show";
	toastTimer = window.setTimeout(() => {
		toastEl.className = isError ? "toast error" : "toast";
	}, 2800);
}

function formatRelativeTime(timestamp: number): string {
	const now = Math.floor(Date.now() / 1000);
	const diff = Math.max(0, now - timestamp);
	if (diff < 60) return "刚刚";
	if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`;
	if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`;
	if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} 天前`;
	const d = new Date(timestamp * 1000);
	return `${d.getMonth() + 1}月${d.getDate()}日`;
}

function escapeHtml(str: string): string {
	return str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

function renderLinks(links: LinkItem[]) {
	linksCountBadge.textContent = `${links.length} 条`;

	if (links.length === 0) {
		linksContainer.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity: 0.5;">
          <path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
        <p>暂无分享记录，在上方提交第一条网址吧</p>
      </div>
    `;
		return;
	}

	linksContainer.innerHTML = links
		.map((item) => {
			const safeUrl = escapeHtml(item.url);
			const safeDomain = escapeHtml(item.domain || "链接");
			const safeNote = item.note ? escapeHtml(item.note) : "";
			const safeSender = item.sender ? escapeHtml(item.sender) : "好朋友";
			const relativeTime = formatRelativeTime(
				item.timestamp || Math.floor(Date.now() / 1000),
			);

			return `
      <article class="link-card-item" data-id="${item.id}">
        <div class="link-card-top">
          <span class="domain-pill">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
            ${safeDomain}
          </span>
          <time class="meta-time" title="${item.created_at}">${relativeTime}</time>
        </div>

        <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="link-anchor" title="在新标签打开: ${safeUrl}">
          <span>${safeUrl}</span>
        </a>

        ${safeNote ? `<div class="note-box">${safeNote}</div>` : ""}

        <div class="link-card-bottom">
          <span class="sender-tag">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            ${safeSender}
          </span>
          <div class="actions-group">
            <button type="button" class="btn-card-action btn-copy" data-url="${safeUrl}">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              复制
            </button>
            <button type="button" class="btn-card-action btn-delete" data-id="${item.id}" title="删除此记录">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
              删除
            </button>
          </div>
        </div>
      </article>
    `;
		})
		.join("");
}

async function fetchLinks() {
	try {
		const res = await fetch("/api/links");
		if (!res.ok) throw new Error("加载失败");
		const data = await res.json();
		if (data.ok && Array.isArray(data.links)) {
			renderLinks(data.links);
		}
	} catch {
		linksContainer.innerHTML = `
      <div class="empty-state">
        <p style="color: #9c4939;">无法获取分享列表，请检查网络或后端服务</p>
      </div>
    `;
	}
}

async function handleSubmit(event: SubmitEvent) {
	event.preventDefault();
	let rawUrl = urlInput.value.trim();
	if (!rawUrl) return;

	if (!/^https?:\/\//i.test(rawUrl)) {
		rawUrl = `https://${rawUrl}`;
		urlInput.value = rawUrl;
	}

	submitBtn.disabled = true;
	submitBtn.classList.add("loading");

	try {
		const payload = {
			url: rawUrl,
			note: noteInput.value.trim(),
			sender: senderInput.value.trim(),
		};

		const res = await fetch("/api/links", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		});

		const result = await res.json();
		if (!res.ok || !result.ok) {
			throw new Error(result.error || "提交失败");
		}

		showToast("🎉 分享成功！感谢您的推荐");
		urlInput.value = "";
		noteInput.value = "";
		// 保存 sender 到 localStorage 方便下次无需重复输入
		if (payload.sender) {
			localStorage.setItem("suizhou_sender", payload.sender);
		}

		await fetchLinks();
	} catch (err: unknown) {
		const msg = err instanceof Error ? err.message : "提交发生异常";
		showToast(msg, true);
	} finally {
		submitBtn.disabled = false;
		submitBtn.classList.remove("loading");
	}
}

async function handlePaste() {
	try {
		if (navigator.clipboard?.readText) {
			const text = await navigator.clipboard.readText();
			if (text) {
				urlInput.value = text.trim();
				showToast("已自动填入剪贴板内容");
				urlInput.focus();
				return;
			}
		}
		urlInput.focus();
		showToast("请手动在输入框中粘贴链接");
	} catch {
		urlInput.focus();
		showToast("浏览器限制剪贴板读取，请手动长按粘贴");
	}
}

async function handleCopyPage() {
	try {
		const currentUrl = window.location.href;
		if (navigator.clipboard?.writeText) {
			await navigator.clipboard.writeText(currentUrl);
			showToast("🔗 分享链接已复制，可直接发给微信/QQ好友");
		} else {
			showToast(currentUrl);
		}
	} catch {
		showToast("复制失败，请手动复制浏览器地址栏");
	}
}

async function handleContainerClick(event: MouseEvent) {
	const target = event.target as HTMLElement;

	// 复制链接
	const copyBtn = target.closest<HTMLButtonElement>(".btn-copy");
	if (copyBtn) {
		const url = copyBtn.dataset.url;
		if (url) {
			try {
				await navigator.clipboard.writeText(url);
				showToast("网址已复制到剪贴板");
			} catch {
				showToast("复制失败");
			}
		}
		return;
	}

	// 删除链接
	const delBtn = target.closest<HTMLButtonElement>(".btn-delete");
	if (delBtn) {
		const id = delBtn.dataset.id;
		if (!id) return;
		if (!window.confirm("确定要删除这条分享记录吗？")) return;

		try {
			const res = await fetch(`/api/links?id=${encodeURIComponent(id)}`, {
				method: "DELETE",
			});
			const result = await res.json();
			if (result.ok) {
				showToast("已删除该条记录");
				await fetchLinks();
			} else {
				showToast(result.error || "删除失败", true);
			}
		} catch {
			showToast("删除请求失败", true);
		}
	}
}

function init() {
	form.addEventListener("submit", handleSubmit);
	pasteBtn.addEventListener("click", handlePaste);
	copyPageBtn.addEventListener("click", handleCopyPage);
	refreshBtn.addEventListener("click", () => {
		showToast("正在刷新...");
		fetchLinks();
	});
	linksContainer.addEventListener("click", handleContainerClick);

	// 恢复之前填写的称呼
	const savedSender = localStorage.getItem("suizhou_sender");
	if (savedSender && senderInput) {
		senderInput.value = savedSender;
	}

	fetchLinks();
}

init();
