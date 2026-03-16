"use client";

type SocketHandler = (...args: unknown[]) => void;

export type SocketLike = {
  connected: boolean;
  emit: (event: string, payload?: unknown) => void;
  on: (event: string, handler: SocketHandler) => SocketLike;
  off: (event: string, handler?: SocketHandler) => SocketLike;
  disconnect: () => void;
};

declare global {
  interface Window {
    io?: (url: string, opts?: Record<string, unknown>) => SocketLike;
    __gumbootSocketIoLoader?: Promise<void>;
  }
}

let socketSingleton: SocketLike | null = null;

function getSocketBaseUrl() {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
  return apiBase.replace(/\/api\/?$/, "");
}

function loadSocketIoClient() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Socket client can only load in the browser"));
  }

  if (window.io) return Promise.resolve();
  if (window.__gumbootSocketIoLoader) return window.__gumbootSocketIoLoader;

  const baseUrl = getSocketBaseUrl();
  if (!baseUrl) {
    return Promise.reject(new Error("Missing NEXT_PUBLIC_API_BASE_URL"));
  }

  window.__gumbootSocketIoLoader = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-gumboot-socket="true"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Failed to load socket client")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = `${baseUrl}/socket.io/socket.io.js`;
    script.async = true;
    script.dataset.gumbootSocket = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load socket client"));
    document.head.appendChild(script);
  });

  return window.__gumbootSocketIoLoader;
}

export async function getChatSocket() {
  await loadSocketIoClient();

  if (socketSingleton) return socketSingleton;
  if (!window.io) throw new Error("Socket.IO client unavailable");

  socketSingleton = window.io(getSocketBaseUrl(), {
    transports: ["websocket", "polling"],
  });

  return socketSingleton;
}

export function resetChatSocket() {
  socketSingleton?.disconnect();
  socketSingleton = null;
}
