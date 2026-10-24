import { BACKEND_URL } from "@/lib/env";

export type TokenPair = { access_token: string; refresh_token: string };

// Refresh tokens rotate: the first use kills the old token. Requests that arrive
// together (or shortly after) carrying the same old token must share one refresh,
// otherwise every one but the first fails and logs the user out.
const RESULT_TTL_MS = 10_000;
const inflight = new Map<string, Promise<TokenPair | null>>();

async function requestRefresh(refreshToken: string, fetchImpl: typeof fetch) {
  try {
    const res = await fetchImpl(`${BACKEND_URL}/auth/refresh`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const body = (await res.json()) as Partial<TokenPair>;
    if (typeof body.access_token !== "string" || typeof body.refresh_token !== "string") {
      return null;
    }
    return { access_token: body.access_token, refresh_token: body.refresh_token };
  } catch {
    return null;
  }
}

/** Exchanges a refresh token for a new pair; null when the backend refuses it. */
export function refreshTokens(
  refreshToken: string,
  fetchImpl: typeof fetch = fetch,
): Promise<TokenPair | null> {
  const existing = inflight.get(refreshToken);
  if (existing) return existing;

  const promise = requestRefresh(refreshToken, fetchImpl);
  inflight.set(refreshToken, promise);
  void promise.then(() => {
    setTimeout(() => {
      if (inflight.get(refreshToken) === promise) inflight.delete(refreshToken);
    }, RESULT_TTL_MS);
  });
  return promise;
}

export function __resetRefreshCache() {
  inflight.clear();
}
