const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL!;
const AUTH_TOKEN_KEY = "gumboot_token";
const FALLBACK_AUTH_TOKEN_KEY = "token";
export const AUTH_CHANGED_EVENT = "gumboot-auth-changed";

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function readAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return (
    window.localStorage.getItem(AUTH_TOKEN_KEY) ||
    window.localStorage.getItem(FALLBACK_AUTH_TOKEN_KEY)
  );
}

export function getApiBaseUrl() {
  return API_BASE;
}

export function getApiOrigin() {
  return API_BASE.replace(/\/api\/?$/, "");
}

export function getStoredAuthToken() {
  return readAuthToken();
}

export function setAuthToken(token: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

export function clearAuthToken() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
  window.localStorage.removeItem(FALLBACK_AUTH_TOKEN_KEY);
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

export async function api<T>(
  path: string,
  opts: {
    method?: Method;
    body?: unknown;
    headers?: Record<string, string>;
    auth?: boolean;
  } = {}
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
    throw new ApiError(envelope?.message || `HTTP ${res.status}`, res.status);
  }

  return data as T;
}

export async function apiForm<T>(
  path: string,
  body: FormData,
  opts: {
    method?: Exclude<Method, "GET">;
    headers?: Record<string, string>;
    auth?: boolean;
  } = {}
): Promise<T> {
  const token = readAuthToken();
  const shouldAttachAuth = opts.auth !== false;
  const hasAuthHeader = Boolean(opts.headers?.Authorization || opts.headers?.authorization);

  const res = await fetch(`${API_BASE}${path}`, {
    method: opts.method ?? "POST",
    headers: {
      ...(shouldAttachAuth && token && !hasAuthHeader ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers ?? {}),
    },
    body,
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
    throw new ApiError(envelope?.message || `HTTP ${res.status}`, res.status);
  }

  return data as T;
}
