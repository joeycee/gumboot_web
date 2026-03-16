"use client";

import { useEffect, useState } from "react";
import { me } from "@/lib/auth";
import { AUTH_CHANGED_EVENT } from "@/lib/api";

type MeResponse = {
  body?: {
    profiledata?: unknown;
    userDetail?: unknown;
    ratingdata?: unknown;
  };
};

export function useMe() {
  const [user, setUser] = useState<unknown | null>(null);
  const [raw, setRaw] = useState<unknown | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    try {
      const res = await me();
      setRaw(res);

      const r = res as MeResponse;
      const normalizedUser =
        r?.body?.profiledata ??
        r?.body?.userDetail ??
        r?.body ??
        res ??
        null;
      setUser(normalizedUser);
    } catch {
      setUser(null);
      setRaw(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    const handleRefresh = () => {
      void refresh();
    };

    window.addEventListener("focus", handleRefresh);
    window.addEventListener("storage", handleRefresh);
    window.addEventListener(AUTH_CHANGED_EVENT, handleRefresh);

    return () => {
      window.removeEventListener("focus", handleRefresh);
      window.removeEventListener("storage", handleRefresh);
      window.removeEventListener(AUTH_CHANGED_EVENT, handleRefresh);
    };
  }, []);

  return { user, raw, loading, refresh };
}
