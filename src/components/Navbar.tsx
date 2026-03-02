"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useMe } from "@/lib/useMe";
import { logout } from "@/lib/auth";

const styles = `
  .nav-root * { box-sizing: border-box; }
  .nav-root {
    position: sticky;
    top: 0;
    z-index: 50;
    height: 56px;
    background: #2A3439;
    border-bottom: 1px solid rgba(229,229,229,0.08);
    font-family: 'DM Sans', sans-serif;
    box-shadow: 0 1px 0 rgba(229,229,229,0.04), 0 4px 24px rgba(26,38,42,0.40);
  }

  .nav-inner {
    max-width: 1280px;
    margin: 0 auto;
    height: 100%;
    padding: 0 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
  }

  /* Brand */
  .nav-brand {
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
    flex-shrink: 0;
  }
  .nav-brand-logo {
    width: 32px; height: 32px;
    border-radius: 7px;
    overflow: hidden;
    flex-shrink: 0;
  }
  .nav-brand-text {
    font-family: 'DM Serif Display', serif;
    font-size: 18px;
    font-weight: 400;
    color: #E5E5E5;
    letter-spacing: -0.01em;
    line-height: 1;
  }
  .nav-brand-dot { color: #26A69A; }

  /* Nav links */
  .nav-links {
    display: flex;
    align-items: center;
    gap: 4px;
    flex: 1;
    padding-left: 20px;
  }
  .nav-link {
    font-size: 13px;
    font-weight: 400;
    color: rgba(229,229,229,0.48);
    text-decoration: none;
    padding: 6px 12px;
    border-radius: 7px;
    border: 1px solid transparent;
    transition: color 0.15s, background 0.15s, border-color 0.15s;
    letter-spacing: 0.01em;
  }
  .nav-link:hover {
    color: rgba(229,229,229,0.85);
    background: rgba(229,229,229,0.05);
  }
  .nav-link.active {
    color: #E5E5E5;
    background: rgba(229,229,229,0.07);
    border-color: rgba(229,229,229,0.10);
  }

  /* Right actions */
  .nav-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }
  .nav-sep {
    width: 1px; height: 18px;
    background: rgba(229,229,229,0.10);
    margin: 0 2px;
  }
  .nav-username {
    font-size: 13px;
    color: rgba(229,229,229,0.60);
    letter-spacing: 0.01em;
  }
  .nav-loading {
    font-size: 12px;
    color: rgba(229,229,229,0.25);
    letter-spacing: 0.08em;
  }

  .nav-btn-ghost {
    font-family: 'DM Sans', sans-serif;
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.04em;
    color: rgba(229,229,229,0.55);
    text-decoration: none;
    padding: 7px 14px;
    border-radius: 7px;
    border: 1px solid rgba(229,229,229,0.12);
    background: transparent;
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;
  }
  .nav-btn-ghost:hover {
    color: #E5E5E5;
    border-color: rgba(229,229,229,0.22);
    background: rgba(229,229,229,0.06);
  }
  .nav-btn-ghost[disabled] {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .nav-btn-cta {
    font-family: 'DM Sans', sans-serif;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #ffffff;
    text-decoration: none;
    padding: 8px 16px;
    border-radius: 7px;
    background: #26A69A;
    border: none;
    cursor: pointer;
    transition: background 0.15s, box-shadow 0.15s;
    box-shadow: 0 2px 10px rgba(38,166,154,0.22);
    white-space: nowrap;
  }
  .nav-btn-cta:hover {
    background: #1E8A80;
    box-shadow: 0 2px 14px rgba(38,166,154,0.32);
  }

  @media (max-width: 640px) {
    .nav-links { display: none; }
    .nav-username { display: none; }
  }
`;

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/jobs/post", label: "Post Job" },
  { href: "/profile", label: "Profile" },
];

const AUTH_KEYS = ["gumboot_token", "token"] as const;
const AUTH_CHANGED_EVENT = "gumboot-auth-changed";

function hasAuthToken(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return AUTH_KEYS.some((k) => Boolean(window.localStorage.getItem(k)));
  } catch {
    return false;
  }
}

function broadcastAuthChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

function isActivePath(pathname: string, href: string) {
  // Exact match for "/" to avoid always-active root link
  if (href === "/") return pathname === "/";
  // Treat sub-routes as active (eg /profile/edit should keep Profile highlighted)
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, refresh } = useMe();

  const [tokenPresent, setTokenPresent] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const syncTokenState = useCallback(() => {
    setTokenPresent(hasAuthToken());
  }, []);

  // Keep token state synced on route changes
  useEffect(() => {
    syncTokenState();
  }, [pathname, syncTokenState]);

  // Keep token state synced on focus / other tabs / custom auth changes
  useEffect(() => {
    const onFocus = () => syncTokenState();
    const onStorage = () => syncTokenState(); // other tabs
    const onAuthChanged = () => syncTokenState(); // same tab + app-wide

    window.addEventListener("focus", onFocus);
    window.addEventListener("storage", onStorage);
    window.addEventListener(AUTH_CHANGED_EVENT, onAuthChanged);

    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
    };
  }, [syncTokenState]);

  // Auth truth:
  // - while loading, you may temporarily show "signed in" if token exists (prevents flicker)
  // - once loading finishes, trust `user` only (prevents "token exists but 401" lying)
  const isAuthenticated = useMemo(() => {
    return loading ? tokenPresent : Boolean(user);
  }, [loading, tokenPresent, user]);

  const displayName = useMemo(() => {
    if (!user || typeof user !== "object") return "Account";
    const u = user as { firstname?: string; name?: string; lastname?: string };
    return u.firstname || u.name || "Account";
  }, [user]);

  const handleLogout = useCallback(async () => {
    if (loggingOut) return;
    setLoggingOut(true);

    try {
      // Optimistic UI: clear token state immediately so navbar flips instantly
      // Your logout() should remove tokens; we also broadcast either way.
      await logout();
    } catch {
      // even if logout throws, we still want UI to move to logged-out state
    } finally {
      // Ensure navbar + the rest of the app updates in the same tab
      broadcastAuthChanged();
      syncTokenState();

      // Ensure user state is re-fetched / cleared
      try {
        await refresh();
      } catch {
        // ignore
      }

      router.push("/");
      setLoggingOut(false);
    }
  }, [loggingOut, refresh, router, syncTokenState]);

  return (
    <>
      <style>{styles}</style>

      <header className="nav-root" role="banner">
        <div className="nav-inner">
          {/* Brand */}
          <Link href="/" className="nav-brand" aria-label="Gumboot home">
            <div className="nav-brand-logo">
              <Image src="/logo.png" alt="Gumboot logo" width={32} height={32} priority />
            </div>
            <span className="nav-brand-text">
              Gumboot<span className="nav-brand-dot">.</span>
            </span>
          </Link>

          {/* Page links */}
          <nav className="nav-links" aria-label="Main navigation">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`nav-link${isActivePath(pathname, href) ? " active" : ""}`}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Auth actions */}
          <div className="nav-actions">
            {loading && !tokenPresent && !user ? (
              <span className="nav-loading">···</span>
            ) : isAuthenticated ? (
              <>
                <span className="nav-username">{displayName}</span>
                <div className="nav-sep" aria-hidden />
                <button className="nav-btn-ghost" onClick={handleLogout} disabled={loggingOut}>
                  {loggingOut ? "Signing out…" : "Sign out"}
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="nav-btn-ghost"
                  onClick={() => broadcastAuthChanged()}
                >
                  Sign in
                </Link>
                <div className="nav-sep" aria-hidden />
                <Link
                  href="/auth/signup"
                  className="nav-btn-cta"
                  onClick={() => broadcastAuthChanged()}
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
    </>
  );
}