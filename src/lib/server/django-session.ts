import "server-only";

import { cookies } from "next/headers";
import { getApiBaseUrl, secureCookies } from "@/lib/env";

export type TokenPair = { access: string; refresh: string };
export type SessionAuthMethod = "password" | "auth0" | "moodle";

const UPSTREAM_TIMEOUT_MS = 20_000;
const REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60;
// The access cookie outlives the 15-minute JWT so an expired token still
// reaches Django, gets a 401 and triggers one refresh instead of a logout.
const ACCESS_COOKIE_MAX_AGE = REFRESH_COOKIE_MAX_AGE;
// Parallel requests that present the same (now rotated) refresh token reuse
// one refresh result instead of each rotating it and logging the user out.
const REFRESH_REUSE_MS = 30_000;

type RefreshResult = { pair: TokenPair | null; at: number };
const refreshes = new Map<string, Promise<RefreshResult>>();

const cookieOptions = () => ({ httpOnly: true, secure: secureCookies(), sameSite: "lax" as const, path: "/", priority: "high" as const });

function json(detail: string, status: number) {
  return Response.json({ detail }, { status });
}

async function fetchUpstream(url: string, init: RequestInit) {
  try {
    return await fetch(url, { ...init, cache: "no-store", signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS) });
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === "TimeoutError";
    return timedOut
      ? json("The server took too long to respond. Please try again.", 504)
      : json("We couldn't reach the server. Check your connection and try again.", 502);
  }
}

function rotate(refresh: string): Promise<RefreshResult> {
  const existing = refreshes.get(refresh);
  if (existing) return existing;
  const pending = (async () => {
    const response = await fetchUpstream(`${getApiBaseUrl()}/auth/refresh/`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ refresh }),
    });
    if (!response.ok) return { pair: null, at: Date.now() };
    const tokens = await response.json() as { access: string; refresh?: string };
    return { pair: { access: tokens.access, refresh: tokens.refresh || refresh }, at: Date.now() };
  })();
  refreshes.set(refresh, pending);
  pending.finally(() => setTimeout(() => refreshes.delete(refresh), REFRESH_REUSE_MS));
  return pending;
}

export function createDjangoSession(names: { access: string; refresh: string; authMethod: string }) {
  async function setSession(tokens: TokenPair, authMethod: SessionAuthMethod = "password") {
    const store = await cookies();
    store.set(names.access, tokens.access, { ...cookieOptions(), maxAge: ACCESS_COOKIE_MAX_AGE });
    store.set(names.refresh, tokens.refresh, { ...cookieOptions(), maxAge: REFRESH_COOKIE_MAX_AGE });
    store.set(names.authMethod, authMethod, { ...cookieOptions(), maxAge: REFRESH_COOKIE_MAX_AGE });
  }

  async function clearSession() {
    const store = await cookies();
    store.delete(names.access);
    store.delete(names.refresh);
    store.delete(names.authMethod);
  }

  async function authMethod(): Promise<SessionAuthMethod> {
    const method = (await cookies()).get(names.authMethod)?.value;
    return method === "auth0" || method === "moodle" ? method : "password";
  }

  async function refreshSession() {
    const refresh = (await cookies()).get(names.refresh)?.value;
    if (!refresh) return null;
    const { pair } = await rotate(refresh);
    if (!pair) {
      await clearSession();
      return null;
    }
    await setSession(pair, await authMethod());
    return pair.access;
  }

  async function request(path: string, init: RequestInit = {}, retry = true) {
    const store = await cookies();
    let access = store.get(names.access)?.value;
    if (!access && retry) access = (await refreshSession()) ?? undefined;
    if (!access) return json("Authentication required.", 401);
    const headers = new Headers(init.headers);
    headers.set("authorization", `Bearer ${access}`);
    if (init.body && !headers.has("content-type")) headers.set("content-type", "application/json");
    const url = `${getApiBaseUrl()}/${path.replace(/^\//, "")}`;
    let response = await fetchUpstream(url, { ...init, headers });
    if (response.status === 401 && retry) {
      const nextAccess = await refreshSession();
      if (!nextAccess) return response;
      headers.set("authorization", `Bearer ${nextAccess}`);
      response = await fetchUpstream(url, { ...init, headers });
    }
    return response;
  }

  async function refreshToken() {
    return (await cookies()).get(names.refresh)?.value;
  }

  return { setSession, clearSession, authMethod, request, refreshToken };
}
