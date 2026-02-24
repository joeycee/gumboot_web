const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL!;
const AUTH_TOKEN_KEY = "gumboot_token";

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

function readAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearAuthToken() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
}

export async function api<T>(
  path: string,
  opts: { method?: Method; body?: unknown; headers?: Record<string, string>; auth?: boolean } = {}
): Promise<T> {
  const token = readAuthToken();
  const shouldAttachAuth = opts.auth !== false;
  const hasAuthHeader = Boolean(opts.headers?.Authorization || opts.headers?.authorization);

  const res = await fetch(`${API_BASE}${path}`, {
    method: opts.method ?? "GET",
    headers: {
      ...(opts.body ? { "Content-Type": "application/json" } : {}),
      ...(shouldAttachAuth && token && !hasAuthHeader ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers ?? {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    cache: "no-store",
  });

  const text = await res.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  const envelope = data as { success?: boolean; message?: string };
  if (!res.ok || envelope?.success === false) {
    throw new Error(envelope?.message || `HTTP ${res.status}`);
  }

  return data as T;
}
