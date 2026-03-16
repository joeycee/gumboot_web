"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ApiError, AUTH_CHANGED_EVENT } from "@/lib/api";
import { getUnreadNotificationCount } from "@/lib/notifications";
import { resolveUserImageUrl } from "@/lib/messages";
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
  .nav-account {
    position: relative;
  }
  .nav-account-trigger {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    height: 40px;
    padding: 5px 10px 5px 6px;
    border-radius: 999px;
    border: 1px solid rgba(229,229,229,0.12);
    background: rgba(229,229,229,0.04);
    color: #E5E5E5;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s;
  }
  .nav-account-trigger:hover,
  .nav-account-trigger[aria-expanded="true"] {
    background: rgba(229,229,229,0.08);
    border-color: rgba(229,229,229,0.22);
  }
  .nav-account-avatar {
    width: 28px;
    height: 28px;
    border-radius: 999px;
    overflow: hidden;
    background: rgba(38,166,154,0.18);
    border: 1px solid rgba(255,255,255,0.08);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .nav-account-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .nav-account-fallback {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    color: #E5E5E5;
  }
  .nav-account-name {
    font-size: 13px;
    font-weight: 500;
    color: #E5E5E5;
    max-width: 132px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .nav-account-chevron {
    opacity: 0.72;
    transition: transform 0.15s ease;
  }
  .nav-account-trigger[aria-expanded="true"] .nav-account-chevron {
    transform: rotate(180deg);
  }
  .nav-account-menu {
    position: absolute;
    top: calc(100% + 10px);
    right: 0;
    min-width: 210px;
    padding: 8px;
    border-radius: 16px;
    border: 1px solid rgba(229,229,229,0.10);
    background: rgba(42,52,57,0.96);
    box-shadow: 0 18px 40px rgba(0,0,0,0.35);
    backdrop-filter: blur(14px);
    z-index: 60;
  }
  .nav-account-item {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    border: none;
    border-radius: 12px;
    background: transparent;
    color: #E5E5E5;
    text-decoration: none;
    font: inherit;
    font-size: 13px;
    padding: 11px 12px;
    cursor: pointer;
    text-align: left;
  }
  .nav-account-item:hover {
    background: rgba(229,229,229,0.07);
  }
  .nav-account-item-label {
    display: inline-flex;
    align-items: center;
    gap: 10px;
  }
  .nav-account-item-note {
    font-size: 11px;
    color: rgba(229,229,229,0.42);
  }
  .nav-account-item.danger {
    color: #ffd9d9;
  }
  .nav-notification {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 999px;
    border: 1px solid rgba(229,229,229,0.12);
    background: rgba(229,229,229,0.03);
    color: #E5E5E5;
    text-decoration: none;
    transition: background 0.15s, border-color 0.15s, transform 0.15s;
  }
  .nav-notification:hover {
    background: rgba(229,229,229,0.08);
    border-color: rgba(229,229,229,0.22);
    transform: translateY(-1px);
  }
  .nav-notification-badge {
    position: absolute;
    top: -4px;
    right: -4px;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    border-radius: 999px;
    background: #F97316;
    color: #ffffff;
    font-size: 10px;
    font-weight: 700;
    line-height: 18px;
    text-align: center;
    box-shadow: 0 4px 10px rgba(249,115,22,0.35);
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
    .nav-account-name { max-width: 86px; }
  }
`;

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/jobs/post", label: "Post Job" },
  { href: "/jobs/calendar", label: "Calendar" },
  { href: "/messages", label: "Messages" },
];

const AUTH_KEYS = ["gumboot_token", "token"] as const;

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
  const [unreadCount, setUnreadCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);

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
    return [u.firstname || u.name || "", u.lastname || ""].join(" ").trim() || "Account";
  }, [user]);

  const avatarSrc = useMemo(() => {
    if (!user || typeof user !== "object") return "";
    const u = user as { image?: string };
    return resolveUserImageUrl(u.image) || "";
  }, [user]);

  const initials = useMemo(() => {
    const parts = displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2);
    return (parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "GB").slice(0, 2);
  }, [displayName]);

  const syncUnreadNotifications = useCallback(async () => {
    if (!hasAuthToken()) {
      setUnreadCount(0);
      return;
    }
    try {
      const count = await getUnreadNotificationCount();
      setUnreadCount(Math.max(0, Number(count) || 0));
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        setUnreadCount(0);
        return;
      }
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      setMenuOpen(false);
      return;
    }

    void syncUnreadNotifications();
    const interval = window.setInterval(() => {
      void syncUnreadNotifications();
    }, 30000);

    return () => window.clearInterval(interval);
  }, [isAuthenticated, pathname, syncUnreadNotifications]);

  useEffect(() => {
    if (!menuOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);

  const handleLogout = useCallback(async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    setMenuOpen(false);

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
      setUnreadCount(0);

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
                <Link
                  href="/notifications"
                  className="nav-notification"
                  onClick={() => setMenuOpen(false)}
                  aria-label={
                    unreadCount > 0
                      ? `${unreadCount} unread notifications`
                      : "View notifications"
                  }
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M9.5 20a2.5 2.5 0 0 0 5 0m-8-7.5V11a5.5 5.5 0 1 1 11 0v1.5c0 .7.2 1.38.58 1.97L19.5 16.5H4.5l1.42-2.03c.38-.59.58-1.27.58-1.97Z"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {unreadCount > 0 ? (
                    <span className="nav-notification-badge">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  ) : null}
                </Link>
                <div className="nav-account" ref={accountMenuRef}>
                  <button
                    type="button"
                    className="nav-account-trigger"
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                    onClick={() => setMenuOpen((open) => !open)}
                  >
                    <span className="nav-account-avatar" aria-hidden="true">
                      {avatarSrc ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={avatarSrc} alt={displayName} />
                      ) : (
                        <span className="nav-account-fallback">{initials}</span>
                      )}
                    </span>
                    <span className="nav-account-name">{displayName}</span>
                    <svg
                      className="nav-account-chevron"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="m6 9 6 6 6-6"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>

                  {menuOpen ? (
                    <div className="nav-account-menu" role="menu" aria-label="Account menu">
                      <Link
                        href="/profile"
                        className="nav-account-item"
                        role="menuitem"
                        onClick={() => setMenuOpen(false)}
                      >
                        <span className="nav-account-item-label">Profile</span>
                        <span className="nav-account-item-note">View account</span>
                      </Link>
                      <Link
                        href="/profile/payments"
                        className="nav-account-item"
                        role="menuitem"
                        onClick={() => setMenuOpen(false)}
                      >
                        <span className="nav-account-item-label">Wallet</span>
                        <span className="nav-account-item-note">Cards & payouts</span>
                      </Link>
                      <Link
                        href="/support"
                        className="nav-account-item"
                        role="menuitem"
                        onClick={() => setMenuOpen(false)}
                      >
                        <span className="nav-account-item-label">Support</span>
                        <span className="nav-account-item-note">Help center</span>
                      </Link>
                      <button
                        type="button"
                        className="nav-account-item danger"
                        role="menuitem"
                        onClick={handleLogout}
                        disabled={loggingOut}
                      >
                        <span className="nav-account-item-label">
                          {loggingOut ? "Signing out…" : "Log out"}
                        </span>
                      </button>
                    </div>
                  ) : null}
                </div>
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
