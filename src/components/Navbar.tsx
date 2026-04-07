"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ApiError, AUTH_CHANGED_EVENT } from "@/lib/api";
import {
  NOTIFICATIONS_REFRESH_EVENT,
  getNotificationReadState,
  getNotificationHref,
  getNotifications,
  getUnreadNotificationCount,
  resolveNotificationHref,
  type NotificationItem,
} from "@/lib/notifications";
import { normalizeConversation, resolveUserImageUrl } from "@/lib/messages";
import { getChatSocket, type SocketLike } from "@/lib/socketClient";
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
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 8px;
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
  .nav-link-badge-dot {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: #F97316;
    box-shadow: 0 0 0 2px rgba(249,115,22,0.18), 0 4px 10px rgba(249,115,22,0.30);
    flex-shrink: 0;
  }
  .nav-menu {
    position: relative;
  }
  .nav-menu-trigger {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 400;
    color: rgba(229,229,229,0.48);
    text-decoration: none;
    padding: 6px 12px;
    border-radius: 7px;
    border: 1px solid transparent;
    background: transparent;
    cursor: pointer;
    transition: color 0.15s, background 0.15s, border-color 0.15s;
    letter-spacing: 0.01em;
  }
  .nav-menu-trigger:hover,
  .nav-menu-trigger[aria-expanded="true"],
  .nav-menu-trigger.active {
    color: #E5E5E5;
    background: rgba(229,229,229,0.07);
    border-color: rgba(229,229,229,0.10);
  }
  .nav-menu-panel {
    position: absolute;
    top: calc(100% + 10px);
    left: 0;
    min-width: 180px;
    border-radius: 16px;
    border: 1px solid rgba(229,229,229,0.10);
    background: rgba(42,52,57,0.96);
    box-shadow: 0 18px 40px rgba(0,0,0,0.28);
    backdrop-filter: blur(12px);
    overflow: hidden;
    z-index: 30;
  }
  .nav-menu-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 14px;
    text-decoration: none;
    color: rgba(229,229,229,0.76);
    font-size: 13px;
    border-top: 1px solid rgba(229,229,229,0.08);
  }
  .nav-menu-item:first-child {
    border-top: 0;
  }
  .nav-menu-item:hover,
  .nav-menu-item.active {
    background: rgba(229,229,229,0.06);
    color: #fff;
  }
  .nav-menu-note {
    font-size: 10px;
    color: rgba(229,229,229,0.42);
    text-transform: uppercase;
    letter-spacing: 0.10em;
  }

  /* Right actions */
  .nav-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }
  .nav-mobile-toggle {
    display: none;
    width: 38px;
    height: 38px;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    border: 1px solid rgba(229,229,229,0.12);
    background: rgba(229,229,229,0.04);
    color: #E5E5E5;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s, transform 0.15s;
  }
  .nav-mobile-toggle:hover,
  .nav-mobile-toggle[aria-expanded="true"] {
    background: rgba(229,229,229,0.08);
    border-color: rgba(229,229,229,0.22);
    transform: translateY(-1px);
  }
  .nav-mobile-sheet {
    display: none;
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
  .nav-notification.ringing {
    animation: nav-bell-ring 0.7s ease;
    border-color: rgba(249,115,22,0.45);
    background: rgba(249,115,22,0.10);
  }
  @keyframes nav-bell-ring {
    0% { transform: rotate(0deg); }
    15% { transform: rotate(14deg); }
    30% { transform: rotate(-12deg); }
    45% { transform: rotate(10deg); }
    60% { transform: rotate(-8deg); }
    75% { transform: rotate(4deg); }
    100% { transform: rotate(0deg); }
  }
  .nav-notification-wrap {
    position: relative;
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
  .nav-popover {
    position: absolute;
    top: calc(100% + 10px);
    right: 0;
    width: min(344px, calc(100vw - 24px));
    max-height: min(calc(100dvh - 84px), 520px);
    padding: 10px;
    border-radius: 16px;
    border: 1px solid rgba(229,229,229,0.10);
    background: rgba(42,52,57,0.97);
    box-shadow: 0 18px 40px rgba(0,0,0,0.35);
    backdrop-filter: blur(14px);
    z-index: 60;
    overflow: hidden;
  }
  .nav-popover-title {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(229,229,229,0.42);
  }
  .nav-popover-copy {
    color: rgba(229,229,229,0.60);
    font-size: 10px;
    line-height: 1.35;
  }
  .nav-popover-section {
    border-top: 1px solid rgba(229,229,229,0.08);
    padding-top: 8px;
  }
  .nav-popover-section.list {
    min-height: 0;
    overflow: hidden;
  }
  .nav-notification-actions {
    display: flex;
    gap: 8px;
    padding-top: 8px;
    border-top: 1px solid rgba(229,229,229,0.08);
  }
  .nav-notification-btn, .nav-notification-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 9px;
    padding: 8px 10px;
    font: inherit;
    font-size: 10px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    text-decoration: none;
    border: 1px solid rgba(229,229,229,0.12);
    background: rgba(229,229,229,0.08);
    color: #E5E5E5;
    cursor: pointer;
    flex: 1 1 0;
    min-height: 34px;
  }
  .nav-notification-list {
    display: grid;
    gap: 4px;
  }
  .nav-notification-empty {
    border-radius: 10px;
    border: 1px solid rgba(229,229,229,0.08);
    background: rgba(229,229,229,0.04);
    padding: 10px;
    font-size: 11px;
    line-height: 1.5;
    color: rgba(229,229,229,0.58);
  }
  .nav-notification-item {
    display: grid;
    grid-template-columns: 26px minmax(0, 1fr);
    gap: 6px;
    width: 100%;
    text-decoration: none;
    text-align: left;
    font: inherit;
    color: inherit;
    border-radius: 9px;
    border: 1px solid rgba(229,229,229,0.08);
    background: rgba(229,229,229,0.04);
    padding: 6px;
    appearance: none;
    transition: background 0.15s, border-color 0.15s;
    cursor: pointer;
  }
  .nav-notification-item:hover {
    background: rgba(229,229,229,0.07);
    border-color: rgba(229,229,229,0.16);
  }
  .nav-notification-item.unread {
    background: rgba(38,166,154,0.10);
    border-color: rgba(38,166,154,0.22);
  }
  .nav-notification-avatar {
    width: 26px;
    height: 26px;
    border-radius: 999px;
    overflow: hidden;
    background: rgba(38,166,154,0.18);
    border: 1px solid rgba(255,255,255,0.08);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .nav-notification-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .nav-notification-fallback {
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.06em;
    color: #E5E5E5;
  }
  .nav-notification-item-title {
    font-size: 9px;
    font-weight: 600;
    color: #E5E5E5;
    line-height: 1.2;
  }
  .nav-notification-item-msg {
    margin-top: 2px;
    font-size: 9px;
    line-height: 1.2;
    color: rgba(229,229,229,0.68);
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .nav-notification-item-meta {
    margin-top: 2px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .nav-notification-pill {
    display: inline-flex;
    align-items: center;
    min-height: 20px;
    padding: 0 8px;
    border-radius: 999px;
    border: 1px solid rgba(229,229,229,0.10);
    background: rgba(229,229,229,0.06);
    font-size: 10px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: rgba(229,229,229,0.58);
  }
  .nav-notification-time {
    font-size: 8px;
    color: rgba(229,229,229,0.38);
    white-space: nowrap;
  }
  .nav-toast {
    position: fixed;
    top: 72px;
    right: 16px;
    width: min(360px, calc(100vw - 32px));
    border-radius: 16px;
    border: 1px solid rgba(38,166,154,0.22);
    background: rgba(42,52,57,0.98);
    box-shadow: 0 20px 48px rgba(0,0,0,0.35);
    backdrop-filter: blur(14px);
    padding: 14px;
    z-index: 80;
  }
  .nav-toast-kicker {
    font-size: 10px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgba(38,166,154,0.92);
  }
  .nav-toast-title {
    margin-top: 6px;
    font-size: 14px;
    font-weight: 700;
    color: #E5E5E5;
  }
  .nav-toast-copy {
    margin-top: 6px;
    font-size: 13px;
    line-height: 1.6;
    color: rgba(229,229,229,0.72);
  }
  .nav-toast-actions {
    margin-top: 12px;
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .nav-toast-btn, .nav-toast-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 34px;
    padding: 0 12px;
    border-radius: 10px;
    border: 1px solid rgba(229,229,229,0.12);
    background: rgba(229,229,229,0.07);
    color: #E5E5E5;
    text-decoration: none;
    font: inherit;
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    cursor: pointer;
  }
  .nav-toast-btn.primary, .nav-toast-link.primary {
    background: #26A69A;
    border-color: transparent;
    color: #fff;
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

  @media (max-width: 860px) {
    .nav-root {
      height: auto;
      min-height: 56px;
    }
    .nav-inner {
      padding: 10px 14px;
      gap: 12px;
      flex-wrap: wrap;
    }
    .nav-links {
      display: none;
    }
    .nav-mobile-toggle {
      display: inline-flex;
      order: 3;
      margin-left: auto;
    }
    .nav-actions {
      margin-left: auto;
      gap: 6px;
    }
    .nav-btn-ghost {
      display: none;
    }
    .nav-sep {
      display: none;
    }
    .nav-btn-cta {
      padding: 8px 12px;
      font-size: 11px;
    }
    .nav-account-trigger {
      padding-right: 8px;
    }
    .nav-mobile-sheet {
      display: block;
      width: 100%;
      border-top: 1px solid rgba(229,229,229,0.08);
      padding: 12px 0 2px;
    }
    .nav-mobile-sheet-inner {
      display: grid;
      gap: 10px;
      padding: 0 14px 12px;
    }
    .nav-mobile-group {
      border: 1px solid rgba(229,229,229,0.10);
      border-radius: 18px;
      background: rgba(42,52,57,0.78);
      overflow: hidden;
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
    }
    .nav-mobile-section-title {
      padding: 12px 16px 10px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: rgba(229,229,229,0.42);
      border-bottom: 1px solid rgba(229,229,229,0.08);
    }
    .nav-mobile-link,
    .nav-mobile-button {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 14px 16px;
      border: 0;
      border-top: 1px solid rgba(229,229,229,0.08);
      background: transparent;
      color: #E5E5E5;
      text-decoration: none;
      font: inherit;
      font-size: 14px;
      cursor: pointer;
      text-align: left;
    }
    .nav-mobile-link:first-child,
    .nav-mobile-button:first-child {
      border-top: 0;
    }
    .nav-mobile-link.active {
      background: rgba(38,166,154,0.12);
      color: #ffffff;
    }
    .nav-mobile-link-note {
      font-size: 11px;
      color: rgba(229,229,229,0.44);
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .nav-mobile-auth {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    .nav-mobile-auth-link {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 46px;
      border-radius: 14px;
      text-decoration: none;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.10em;
      text-transform: uppercase;
      border: 1px solid rgba(229,229,229,0.12);
      color: #E5E5E5;
      background: rgba(229,229,229,0.06);
    }
    .nav-mobile-auth-link.primary {
      background: #26A69A;
      border-color: transparent;
      color: #fff;
      box-shadow: 0 8px 18px rgba(38,166,154,0.24);
    }
  }

  @media (max-width: 640px) {
    .nav-brand-text { font-size: 17px; }
    .nav-account-name { display: none; }
    .nav-account-trigger {
      width: 40px;
      padding: 5px;
      justify-content: center;
    }
    .nav-account-chevron {
      display: none;
    }
    .nav-notification {
      width: 34px;
      height: 34px;
    }
    .nav-btn-cta {
      padding: 8px 10px;
    }
    .nav-mobile-auth {
      grid-template-columns: 1fr;
    }
    .nav-popover {
      position: fixed;
      top: 64px;
      left: 12px;
      right: 12px;
      width: auto;
      max-height: calc(100dvh - 88px);
    }
  }
`;

const NOTIFICATION_PREVIEW_CACHE_KEY = "gumboot_notification_preview_v1";

const NAV_LINKS = [
  { href: "/", label: "Home" },
];

const JOB_LINKS = [
  { href: "/jobs/post", label: "Post Job", note: "Create" },
  { href: "/jobs/manage", label: "My Jobs", note: "Manage" },
  { href: "/", label: "All Jobs", note: "Browse" },
] as const;

const AUTH_NAV_LINKS = [
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

function formatNotificationTime(value?: string) {
  if (!value) return "Recently";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function getNotificationInitials(item?: NotificationItem | null) {
  const first = item?.notification?.sender?.firstname?.trim() ?? "";
  const last = item?.notification?.sender?.lastname?.trim() ?? "";
  return `${first[0] ?? ""}${last[0] ?? ""}`.trim().toUpperCase() || "GB";
}

function isActivePath(pathname: string, href: string) {
  // Exact match for "/" to avoid always-active root link
  if (href === "/") return pathname === "/";
  // Treat sub-routes as active (eg /profile/edit should keep Profile highlighted)
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Navbar() {
  const notificationPreviewLimit = 5;
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, refresh } = useMe();

  const [tokenPresent, setTokenPresent] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotificationBadge, setShowNotificationBadge] = useState(false);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [jobsMenuOpen, setJobsMenuOpen] = useState(false);
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationItems, setNotificationItems] = useState<NotificationItem[]>([]);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [toastNotification, setToastNotification] = useState<NotificationItem | null>(null);
  const [bellRinging, setBellRinging] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const jobsMenuRef = useRef<HTMLDivElement | null>(null);
  const notificationMenuRef = useRef<HTMLDivElement | null>(null);
  const initializedNotificationRef = useRef(false);
  const seenUnreadNotificationIdsRef = useRef<Set<string>>(new Set());
  const viewedUnreadNotificationIdsRef = useRef<Set<string>>(new Set());
  const toastTimerRef = useRef<number | null>(null);
  const bellRingTimerRef = useRef<number | null>(null);

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

  const visibleNavLinks = useMemo(
    () => (isAuthenticated ? [...NAV_LINKS, ...AUTH_NAV_LINKS] : NAV_LINKS),
    [isAuthenticated]
  );
  const jobsMenuActive = useMemo(
    () => JOB_LINKS.some(({ href }) => isActivePath(pathname, href)),
    [pathname]
  );

  const meRecord = (user ?? null) as {
    _id?: string;
  } | null;

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
  const loggedInUserId = meRecord?._id ?? "";

  const storeNotificationPreview = useCallback((items: NotificationItem[]) => {
    if (typeof window === "undefined" || !loggedInUserId) return;
    try {
      window.localStorage.setItem(
        `${NOTIFICATION_PREVIEW_CACHE_KEY}:${loggedInUserId}`,
        JSON.stringify(items.slice(0, notificationPreviewLimit))
      );
    } catch {}
  }, [loggedInUserId, notificationPreviewLimit]);

  const readNotificationPreview = useCallback(() => {
    if (typeof window === "undefined" || !loggedInUserId) return null;
    try {
      const rawValue = window.localStorage.getItem(`${NOTIFICATION_PREVIEW_CACHE_KEY}:${loggedInUserId}`);
      if (!rawValue) return null;
      const parsed = JSON.parse(rawValue) as unknown;
      return Array.isArray(parsed) ? (parsed as NotificationItem[]) : null;
    } catch {
      return null;
    }
  }, [loggedInUserId]);

  const syncUnreadMessages = useCallback(
    async (clientOverride?: SocketLike | null) => {
      if (!isAuthenticated || !loggedInUserId) {
        setUnreadMessageCount(0);
        return;
      }

      try {
        const client = clientOverride ?? await getChatSocket();
        client.emit("connect_user", { userId: loggedInUserId });
        client.emit("chat_list", { sender_id: loggedInUserId });
      } catch {
        setUnreadMessageCount(0);
      }
    },
    [isAuthenticated, loggedInUserId]
  );

  const syncUnreadNotifications = useCallback(async () => {
    if (!hasAuthToken()) {
      setUnreadCount(0);
      setShowNotificationBadge(false);
      setNotificationItems([]);
      initializedNotificationRef.current = false;
      seenUnreadNotificationIdsRef.current = new Set();
      viewedUnreadNotificationIdsRef.current = new Set();
      return;
    }
    try {
      const [countResponse, notificationsResponse] = await Promise.all([
        getUnreadNotificationCount(),
        getNotifications(),
      ]);
      const items = Array.isArray(notificationsResponse.body) ? notificationsResponse.body : [];
      const unreadItems = items.filter((item) => !getNotificationReadState(item));
      const nextUnreadIds = new Set(
        unreadItems
          .map((item) => item.notification?._id?.trim() ?? "")
          .filter(Boolean)
      );
      const nextViewedUnreadIds = new Set(
        Array.from(viewedUnreadNotificationIdsRef.current).filter((id) => nextUnreadIds.has(id))
      );
      const hasUncheckedUnread = Array.from(nextUnreadIds).some((id) => !nextViewedUnreadIds.has(id));

      setUnreadCount(Math.max(0, Number(countResponse.body?.count ?? unreadItems.length ?? 0) || 0));
      setShowNotificationBadge(hasUncheckedUnread);
      const previewItems = items.slice(0, notificationPreviewLimit);
      setNotificationItems(previewItems);
      storeNotificationPreview(previewItems);

      if (initializedNotificationRef.current) {
        const nextToast =
          unreadItems.find((item) => {
            const notificationId = item.notification?._id?.trim() ?? "";
            return notificationId && !seenUnreadNotificationIdsRef.current.has(notificationId);
          }) ?? null;
        if (nextToast) {
          setToastNotification(nextToast);
          setBellRinging(true);
        }
      } else {
        initializedNotificationRef.current = true;
      }

      viewedUnreadNotificationIdsRef.current = nextViewedUnreadIds;
      seenUnreadNotificationIdsRef.current = nextUnreadIds;
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        setUnreadCount(0);
        setShowNotificationBadge(false);
        setNotificationItems([]);
        initializedNotificationRef.current = false;
        seenUnreadNotificationIdsRef.current = new Set();
        viewedUnreadNotificationIdsRef.current = new Set();
        return;
      }
    }
  }, [notificationPreviewLimit, storeNotificationPreview]);

  const markNotificationsChecked = useCallback(() => {
    viewedUnreadNotificationIdsRef.current = new Set(seenUnreadNotificationIdsRef.current);
    setShowNotificationBadge(false);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      setShowNotificationBadge(false);
      setUnreadMessageCount(0);
      setMenuOpen(false);
      setNotificationMenuOpen(false);
      setNotificationItems([]);
      setToastNotification(null);
      return;
    }

    const cachedItems = readNotificationPreview();
    if (cachedItems?.length) {
      setNotificationItems(cachedItems.slice(0, notificationPreviewLimit));
    }
    void syncUnreadNotifications();
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void syncUnreadNotifications();
      }
    }, 10000);

    return () => window.clearInterval(interval);
  }, [isAuthenticated, notificationPreviewLimit, pathname, readNotificationPreview, syncUnreadNotifications]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const handleFocus = () => {
      void syncUnreadNotifications();
    };
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void syncUnreadNotifications();
      }
    };
    const handleRefresh = () => {
      void syncUnreadNotifications();
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener(NOTIFICATIONS_REFRESH_EVENT, handleRefresh);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener(NOTIFICATIONS_REFRESH_EVENT, handleRefresh);
    };
  }, [isAuthenticated, syncUnreadNotifications]);

  useEffect(() => {
    if (!isAuthenticated || !loggedInUserId) return;

    let active = true;
    let client: SocketLike | null = null;
    let retryOne: number | null = null;
    let retryTwo: number | null = null;

    const handleIncomingMessage = (payload: unknown) => {
      if (!active) return;
      const data = (payload ?? {}) as { receiver_id?: string; sender_id?: string };
      if (data.receiver_id !== loggedInUserId) return;
      if (pathname.startsWith("/messages")) return;
      void syncUnreadNotifications();
      retryOne = window.setTimeout(() => {
        void syncUnreadNotifications();
      }, 400);
      retryTwo = window.setTimeout(() => {
        void syncUnreadNotifications();
      }, 1200);
    };

    (async () => {
      try {
        client = await getChatSocket();
        if (!active) return;
        client.emit("connect_user", { userId: loggedInUserId });
        client.on("send_message", handleIncomingMessage);
      } catch {
        // Ignore socket bootstrap failures here; the poll/focus fallback still runs.
      }
    })();

    return () => {
      active = false;
      if (retryOne) window.clearTimeout(retryOne);
      if (retryTwo) window.clearTimeout(retryTwo);
      client?.off("send_message", handleIncomingMessage);
    };
  }, [isAuthenticated, loggedInUserId, pathname, syncUnreadNotifications]);

  useEffect(() => {
    if (!isAuthenticated || !loggedInUserId) {
      setUnreadMessageCount(0);
      return;
    }

    let active = true;
    let client: SocketLike | null = null;
    let retryOne: number | null = null;
    let retryTwo: number | null = null;

    const refreshChatList = () => {
      if (!active || !client) return;
      client.emit("chat_list", { sender_id: loggedInUserId });
    };

    const handleChatList = (payload: unknown) => {
      if (!active) return;
      const rows = Array.isArray(payload) ? payload : [];
      const nextUnreadCount = rows
        .map((item) => normalizeConversation((item ?? {}) as Record<string, unknown>, loggedInUserId))
        .reduce((sum, item) => sum + Math.max(0, Number(item.unreadCount) || 0), 0);
      setUnreadMessageCount(nextUnreadCount);
    };

    const handleIncomingMessage = (payload: unknown) => {
      if (!active) return;
      const data = (payload ?? {}) as { receiver_id?: string };
      if (data.receiver_id !== loggedInUserId) return;
      refreshChatList();
      retryOne = window.setTimeout(refreshChatList, 400);
      retryTwo = window.setTimeout(refreshChatList, 1200);
    };

    const handleReadStatus = () => {
      refreshChatList();
    };

    const handleConnect = () => {
      if (!active || !client) return;
      client.emit("connect_user", { userId: loggedInUserId });
      refreshChatList();
    };

    getChatSocket()
      .then((nextClient) => {
        if (!active) return;
        client = nextClient;
        client.on("connect", handleConnect);
        client.on("chat_list", handleChatList);
        client.on("send_message", handleIncomingMessage);
        client.on("read_data_status", handleReadStatus);
        if (client.connected) handleConnect();
        void syncUnreadMessages(client);
      })
      .catch(() => {
        if (!active) return;
        setUnreadMessageCount(0);
      });

    const handleFocus = () => {
      refreshChatList();
    };
    const handleVisibility = () => {
      if (document.visibilityState === "visible") refreshChatList();
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") refreshChatList();
    }, 10000);

    return () => {
      active = false;
      if (retryOne) window.clearTimeout(retryOne);
      if (retryTwo) window.clearTimeout(retryTwo);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.clearInterval(interval);
      client?.off("connect", handleConnect);
      client?.off("chat_list", handleChatList);
      client?.off("send_message", handleIncomingMessage);
      client?.off("read_data_status", handleReadStatus);
    };
  }, [isAuthenticated, loggedInUserId, syncUnreadMessages]);

  useEffect(() => {
    if (!bellRinging) return;
    if (bellRingTimerRef.current) window.clearTimeout(bellRingTimerRef.current);
    bellRingTimerRef.current = window.setTimeout(() => {
      setBellRinging(false);
      bellRingTimerRef.current = null;
    }, 900);

    return () => {
      if (bellRingTimerRef.current) {
        window.clearTimeout(bellRingTimerRef.current);
        bellRingTimerRef.current = null;
      }
    };
  }, [bellRinging]);

  useEffect(() => {
    if (!toastNotification) return;
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => {
      setToastNotification(null);
      toastTimerRef.current = null;
    }, 6000);

    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
        toastTimerRef.current = null;
      }
    };
  }, [toastNotification]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (pathname.startsWith("/notifications")) {
      markNotificationsChecked();
    }
  }, [markNotificationsChecked, pathname]);

  useEffect(() => {
    if (!menuOpen && !notificationMenuOpen && !jobsMenuOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
      if (!jobsMenuRef.current?.contains(event.target as Node)) {
        setJobsMenuOpen(false);
      }
      if (!notificationMenuRef.current?.contains(event.target as Node)) {
        setNotificationMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setJobsMenuOpen(false);
        setNotificationMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [jobsMenuOpen, menuOpen, notificationMenuOpen]);

  const openNotificationMenu = useCallback(async () => {
    setMenuOpen(false);
    setMobileMenuOpen(false);
    setNotificationMenuOpen((open) => !open);

    if (notificationMenuOpen) return;
    markNotificationsChecked();

    const cachedItems = readNotificationPreview();
    const hasCachedPreview = Boolean(cachedItems?.length || notificationItems.length);
    if (cachedItems?.length) {
      setNotificationItems(cachedItems.slice(0, notificationPreviewLimit));
    }
    setNotificationLoading(!hasCachedPreview);
    try {
      const response = await getNotifications();
      const items = Array.isArray(response.body) ? response.body : [];
      const previewItems = items.slice(0, notificationPreviewLimit);
      setNotificationItems(previewItems);
      storeNotificationPreview(previewItems);
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        router.replace("/auth/login");
        return;
      }
    } finally {
      setNotificationLoading(false);
    }
  }, [markNotificationsChecked, notificationItems.length, notificationMenuOpen, notificationPreviewLimit, readNotificationPreview, router, storeNotificationPreview]);

  const handleDismissToast = useCallback(() => {
    setToastNotification(null);
  }, []);

  const handleViewToast = useCallback(async () => {
    const href = await resolveNotificationHref(toastNotification);
    setToastNotification(null);
    router.push(href);
  }, [router, toastNotification]);

  const handleNotificationPreviewClick = useCallback(
    async (item?: NotificationItem | null) => {
      const href = await resolveNotificationHref(item);
      setNotificationMenuOpen(false);
      setToastNotification(null);
      router.push(href);
    },
    [router]
  );

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
      setShowNotificationBadge(false);

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

      {toastNotification ? (
        <div className="nav-toast" role="status" aria-live="polite">
          <div className="nav-toast-kicker">Notification</div>
          <div className="nav-toast-title">New update</div>
          <div className="nav-toast-copy">
            {toastNotification.notification?.message?.trim() || "You have a new account update."}
          </div>
          <div className="nav-toast-actions">
            <button type="button" className="nav-toast-btn primary" onClick={handleViewToast}>
              View
            </button>
            <button type="button" className="nav-toast-btn" onClick={handleDismissToast}>
              Dismiss
            </button>
          </div>
        </div>
      ) : null}

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
            {visibleNavLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`nav-link${isActivePath(pathname, href) ? " active" : ""}`}
                aria-label={
                  href === "/messages" && unreadMessageCount > 0
                    ? `${unreadMessageCount} unread messages`
                    : undefined
                }
              >
                {label}
                {href === "/messages" && unreadMessageCount > 0 ? (
                  <span className="nav-link-badge-dot" aria-hidden="true" />
                ) : null}
              </Link>
            ))}
            <div className="nav-menu" ref={jobsMenuRef}>
              <button
                type="button"
                className={`nav-menu-trigger${jobsMenuActive ? " active" : ""}`}
                aria-haspopup="menu"
                aria-expanded={jobsMenuOpen}
                onClick={() => {
                  setMenuOpen(false);
                  setNotificationMenuOpen(false);
                  setJobsMenuOpen((open) => !open);
                }}
              >
                <span>Jobs</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {jobsMenuOpen ? (
                <div className="nav-menu-panel" role="menu" aria-label="Jobs menu">
                  {JOB_LINKS.map(({ href, label, note }) => (
                    <Link
                      key={href}
                      href={href}
                      className={`nav-menu-item${isActivePath(pathname, href) ? " active" : ""}`}
                      role="menuitem"
                      onClick={() => setJobsMenuOpen(false)}
                    >
                      <span>{label}</span>
                      <span className="nav-menu-note">{note}</span>
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          </nav>

          {/* Auth actions */}
          <div className="nav-actions">
            {loading && !tokenPresent && !user ? (
              <span className="nav-loading">···</span>
            ) : isAuthenticated ? (
              <>
                <div className="nav-notification-wrap" ref={notificationMenuRef}>
                  <button
                    type="button"
                    className={`nav-notification${bellRinging ? " ringing" : ""}`}
                    onClick={() => {
                      void openNotificationMenu();
                    }}
                    aria-haspopup="dialog"
                    aria-expanded={notificationMenuOpen}
                    aria-label={
                      unreadCount > 0
                        ? `${unreadCount} unread notifications`
                        : "Notification settings"
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
                    {showNotificationBadge && unreadCount > 0 ? (
                      <span className="nav-notification-badge">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    ) : null}
                  </button>
                  {notificationMenuOpen ? (
                    <div className="nav-popover" role="dialog" aria-label="Notification settings">
                      <div className="nav-popover-title">Notifications</div>
                      <div className="nav-popover-section list">
                        {notificationLoading ? (
                          <div className="nav-notification-empty">Loading notifications…</div>
                        ) : notificationItems.length > 0 ? (
                          <div className="nav-notification-list">
                            {notificationItems.map((item, index) => {
                              const senderName =
                                [item.notification?.sender?.firstname, item.notification?.sender?.lastname]
                                  .filter(Boolean)
                                  .join(" ")
                                  .trim() || "Gumboot";
                              const senderAvatar = resolveUserImageUrl(item.notification?.sender?.image);
                              const unread = !getNotificationReadState(item);
                              return (
                                <button
                                  key={item.notification?._id ?? `${getNotificationHref(item)}-${index}`}
                                  className={`nav-notification-item${unread ? " unread" : ""}`}
                                  type="button"
                                  onClick={() => {
                                    void handleNotificationPreviewClick(item);
                                  }}
                                >
                                  <span className="nav-notification-avatar" aria-hidden="true">
                                    {senderAvatar ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img src={senderAvatar} alt={senderName} />
                                    ) : (
                                      <span className="nav-notification-fallback">{getNotificationInitials(item)}</span>
                                    )}
                                  </span>
                                  <span>
                                    <span className="nav-notification-item-title">{senderName}</span>
                                    <span className="nav-notification-item-msg">
                                      {item.notification?.message?.trim() || "Notification update"}
                                    </span>
                                    <span className="nav-notification-item-meta">
                                      <span className="nav-notification-time">
                                        {formatNotificationTime(item.notification?.createdAt)}
                                      </span>
                                    </span>
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="nav-notification-empty">No notifications yet.</div>
                        )}
                      </div>
                      <div className="nav-notification-actions">
                        <Link
                          href="/notifications"
                          className="nav-notification-link"
                          onClick={() => setNotificationMenuOpen(false)}
                        >
                          View all
                        </Link>
                      </div>
                    </div>
                  ) : null}
                </div>
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
                        href="/profile/settings"
                        className="nav-account-item"
                        role="menuitem"
                        onClick={() => setMenuOpen(false)}
                      >
                        <span className="nav-account-item-label">Settings</span>
                        <span className="nav-account-item-note">Edit account</span>
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
            <button
              type="button"
              className="nav-mobile-toggle"
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileMenuOpen}
              onClick={() => {
                setMenuOpen(false);
                setNotificationMenuOpen(false);
                setJobsMenuOpen(false);
                setMobileMenuOpen((open) => !open);
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                {mobileMenuOpen ? (
                  <path
                    d="M6 6l12 12M18 6 6 18"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                ) : (
                  <>
                    <path d="M4 7h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    <path d="M4 12h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    <path d="M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </>
                )}
              </svg>
            </button>
          </div>

          {mobileMenuOpen ? (
            <div className="nav-mobile-sheet" aria-label="Mobile navigation">
              <div className="nav-mobile-sheet-inner">
                <div className="nav-mobile-group">
                  {visibleNavLinks.map(({ href, label }) => (
                    <Link
                      key={`mobile-${href}`}
                      href={href}
                      className={`nav-mobile-link${isActivePath(pathname, href) ? " active" : ""}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <span>{label}</span>
                      <span className="nav-mobile-link-note">Open</span>
                    </Link>
                  ))}
                </div>

                <div className="nav-mobile-group">
                  <div className="nav-mobile-section-title">Jobs</div>
                  {JOB_LINKS.map(({ href, label, note }) => (
                    <Link
                      key={`mobile-jobs-${href}`}
                      href={href}
                      className={`nav-mobile-link${isActivePath(pathname, href) ? " active" : ""}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <span>{label}</span>
                      <span className="nav-mobile-link-note">{note}</span>
                    </Link>
                  ))}
                </div>

                {isAuthenticated ? (
                  <div className="nav-mobile-group">
                    <Link
                      href="/profile"
                      className="nav-mobile-link"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <span>Profile</span>
                      <span className="nav-mobile-link-note">Account</span>
                    </Link>
                    <Link
                      href="/profile/payments"
                      className="nav-mobile-link"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <span>Wallet</span>
                      <span className="nav-mobile-link-note">Payments</span>
                    </Link>
                    <Link
                      href="/profile/settings"
                      className="nav-mobile-link"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <span>Settings</span>
                      <span className="nav-mobile-link-note">Manage</span>
                    </Link>
                    <Link
                      href="/support"
                      className="nav-mobile-link"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <span>Support</span>
                      <span className="nav-mobile-link-note">Help</span>
                    </Link>
                    <button
                      type="button"
                      className="nav-mobile-button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        void handleLogout();
                      }}
                    >
                      <span>{loggingOut ? "Signing out…" : "Log out"}</span>
                      <span className="nav-mobile-link-note">Secure</span>
                    </button>
                  </div>
                ) : (
                  <div className="nav-mobile-auth">
                    <Link
                      href="/auth/login"
                      className="nav-mobile-auth-link"
                      onClick={() => {
                        broadcastAuthChanged();
                        setMobileMenuOpen(false);
                      }}
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/auth/signup"
                      className="nav-mobile-auth-link primary"
                      onClick={() => {
                        broadcastAuthChanged();
                        setMobileMenuOpen(false);
                      }}
                    >
                      Get started
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </header>
    </>
  );
}
