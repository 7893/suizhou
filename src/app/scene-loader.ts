import type { SceneName } from "../scenes/types.ts";

export interface SceneLoaderOptions {
	load: (name: SceneName) => Promise<unknown>;
	isLoaded: (name: SceneName) => boolean;
	onLoaded?: (name: SceneName) => void;
	onError?: (name: SceneName, error: unknown, attempt: number) => void;
	now?: () => number;
	baseDelayMs?: number;
	maxDelayMs?: number;
	maxAttempts?: number;
}

interface FailureState {
	attempts: number;
	nextRetryAt: number;
}

// Guard on-demand chunk fetches called from the render loop with deduplication,
// exponential backoff, and a retry ceiling so offline errors never cause storms.
export function createSceneLoader({
	load,
	isLoaded,
	onLoaded,
	onError,
	now = () => Date.now(),
	baseDelayMs = 1000,
	maxDelayMs = 30_000,
	maxAttempts = 5,
}: SceneLoaderOptions) {
	const inflight = new Set<SceneName>();
	const failures = new Map<SceneName, FailureState>();

	function request(name: SceneName): boolean {
		if (isLoaded(name)) {
			failures.delete(name);
			return true;
		}
		if (inflight.has(name)) return false;
		const state = failures.get(name);
		if (state) {
			if (state.attempts >= maxAttempts) return false;
			if (now() < state.nextRetryAt) return false;
		}
		inflight.add(name);
		let pending: Promise<unknown>;
		try {
			pending = load(name);
		} catch (error: unknown) {
			pending = Promise.reject(error);
		}
		void pending
			.then(() => {
				inflight.delete(name);
				failures.delete(name);
				onLoaded?.(name);
			})
			.catch((error: unknown) => {
				inflight.delete(name);
				const attempts = (failures.get(name)?.attempts ?? 0) + 1;
				const delay = Math.min(maxDelayMs, baseDelayMs * 2 ** (attempts - 1));
				failures.set(name, { attempts, nextRetryAt: now() + delay });
				onError?.(name, error, attempts);
			});
		return false;
	}

	return {
		request,
		hasFailed(name: SceneName) {
			return (failures.get(name)?.attempts ?? 0) > 0;
		},
		hasExhausted(name: SceneName) {
			return (failures.get(name)?.attempts ?? 0) >= maxAttempts;
		},
		reset(name?: SceneName) {
			if (name) failures.delete(name);
			else failures.clear();
		},
	};
}
