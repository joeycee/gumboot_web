"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getJobTypes, JobType } from "@/lib/postJob";
import { extractCardsFromResponse, getSavedCards } from "@/lib/payments";
import { useMe } from "@/lib/useMe";

type DateMode = "urgent" | "exact" | "before" | "after";
type TimeMode = "morning" | "afternoon" | "exact-time" | "anytime";
type JobTypeOption = JobType & {
  _id?: string;
  description?: string;
  image?: string | string[];
  iconPath?: string;
  jobTypeIconPath?: string;
  job_type_icon?: string;
};

type MeUser = {
  _id?: string;
  firstname?: string;
  lastname?: string;
};

const styles = `
  .pj-root * { box-sizing: border-box; }
  .pj-root {
    min-height: calc(100vh - 120px);
    background: #2A3439;
    color: #E5E5E5;
    font-family: 'DM Sans', sans-serif;
    padding: 28px 16px 40px;
  }
  .pj-wrap {
    max-width: 860px;
    margin: 0 auto;
    border: 1px solid rgba(229,229,229,0.10);
    border-radius: 18px;
    background: #3E4A51;
    padding: 22px;
  }
  .pj-step {
    font-size: 10px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: rgba(229,229,229,0.45);
    margin-bottom: 8px;
  }
  .pj-title {
    margin: 0 0 16px;
    font-family: 'DM Serif Display', serif;
    font-size: 34px;
    line-height: 1.1;
  }
  .pj-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;
  }
  @media (min-width: 740px) {
    .pj-grid.two { grid-template-columns: 1fr 1fr; }
  }
  .pj-field { display: flex; flex-direction: column; gap: 6px; }
  .pj-label {
    font-size: 10px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(229,229,229,0.42);
  }
  .pj-input, .pj-textarea {
    border: 1px solid rgba(229,229,229,0.14);
    background: #2A3439;
    color: #E5E5E5;
    border-radius: 10px;
    font-family: inherit;
    font-size: 14px;
    padding: 10px 12px;
    outline: none;
  }
  .pj-textarea { min-height: 120px; resize: vertical; }
  .pj-input.time-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    border: 0;
    overflow: hidden;
    clip: rect(0 0 0 0);
    clip-path: inset(100%);
    white-space: nowrap;
  }
  .pj-row { display: flex; gap: 8px; flex-wrap: wrap; }
  .pj-time-picker {
    display: grid;
    grid-template-columns: 96px minmax(0, 1fr);
    align-items: center;
    gap: 16px;
    border: 1px solid rgba(229,229,229,0.12);
    background:
      radial-gradient(circle at top left, rgba(38,166,154,0.16), transparent 48%),
      linear-gradient(180deg, rgba(28,35,38,0.96), rgba(42,52,57,0.98));
    color: #E5E5E5;
    border-radius: 18px;
    padding: 16px;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.04), 0 18px 40px rgba(12,17,19,0.20);
  }
  .pj-time-picker-clock {
    width: 96px;
    height: 96px;
    border-radius: 999px;
    border: 1px solid rgba(229,229,229,0.12);
    background:
      radial-gradient(circle at 50% 34%, rgba(255,255,255,0.08), transparent 54%),
      linear-gradient(180deg, rgba(64,77,84,0.92), rgba(25,31,34,0.98));
    position: relative;
    box-shadow: inset 0 1px 10px rgba(255,255,255,0.04), 0 14px 28px rgba(0,0,0,0.24);
  }
  .pj-time-picker-clock::before {
    content: "";
    position: absolute;
    inset: 8px;
    border-radius: 999px;
    border: 1px solid rgba(229,229,229,0.08);
  }
  .pj-time-marker {
    position: absolute;
    left: 50%;
    top: 8px;
    width: 2px;
    height: 10px;
    margin-left: -1px;
    border-radius: 999px;
    background: rgba(229,229,229,0.28);
    transform-origin: 50% 40px;
  }
  .pj-time-hand {
    position: absolute;
    left: 50%;
    bottom: 50%;
    transform-origin: 50% 100%;
    border-radius: 999px;
  }
  .pj-time-hand.hour {
    width: 4px;
    height: 23px;
    margin-left: -2px;
    background: #E5E5E5;
  }
  .pj-time-hand.minute {
    width: 2px;
    height: 31px;
    margin-left: -1px;
    background: rgba(38,166,154,0.95);
    box-shadow: 0 0 12px rgba(38,166,154,0.22);
  }
  .pj-time-hand-pin {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 10px;
    height: 10px;
    margin-left: -5px;
    margin-top: -5px;
    border-radius: 999px;
    background: #E5E5E5;
    box-shadow: 0 0 0 3px rgba(38,166,154,0.22);
  }
  .pj-time-picker-copy {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .pj-time-picker-label {
    font-size: 11px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(229,229,229,0.42);
  }
  .pj-time-picker-value {
    font-size: clamp(24px, 4vw, 32px);
    font-weight: 700;
    letter-spacing: -0.03em;
    color: #E5E5E5;
  }
  .pj-time-picker-subcopy {
    font-size: 13px;
    line-height: 1.5;
    color: rgba(229,229,229,0.64);
  }
  .pj-time-picker-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    width: fit-content;
    border: 1px solid rgba(38,166,154,0.34);
    background: linear-gradient(180deg, rgba(38,166,154,0.22), rgba(38,166,154,0.14));
    color: #E5E5E5;
    border-radius: 999px;
    padding: 11px 15px;
    font: inherit;
    font-size: 12px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    cursor: pointer;
    white-space: nowrap;
    box-shadow: 0 10px 24px rgba(38,166,154,0.14);
    transition: transform 0.15s ease, border-color 0.15s ease, background 0.15s ease;
  }
  .pj-time-picker-btn:hover {
    transform: translateY(-1px);
    border-color: rgba(38,166,154,0.52);
    background: linear-gradient(180deg, rgba(38,166,154,0.28), rgba(38,166,154,0.18));
  }
  @media (max-width: 560px) {
    .pj-time-picker {
      grid-template-columns: 1fr;
      justify-items: start;
    }
  }
  .pj-chip {
    border: 1px solid rgba(229,229,229,0.16);
    background: rgba(229,229,229,0.05);
    color: rgba(229,229,229,0.80);
    border-radius: 999px;
    padding: 8px 12px;
    font-size: 12px;
    cursor: pointer;
  }
  .pj-chip.active {
    background: rgba(38,166,154,0.22);
    border-color: rgba(38,166,154,0.52);
    color: #E5E5E5;
  }
  .pj-note {
    font-size: 12px;
    color: rgba(229,229,229,0.60);
    line-height: 1.6;
  }
  .pj-list {
    margin: 0;
    padding-left: 18px;
    color: rgba(229,229,229,0.86);
    line-height: 1.7;
    font-size: 13px;
  }
  .pj-error {
    border: 1px solid rgba(183,91,91,0.4);
    background: rgba(183,91,91,0.12);
    color: rgba(255,212,212,0.95);
    border-radius: 10px;
    padding: 10px 12px;
    margin-bottom: 12px;
    font-size: 13px;
    white-space: pre-wrap;
  }
  .pj-banner {
    border: 1px solid rgba(38,166,154,0.34);
    background: rgba(38,166,154,0.12);
    color: rgba(229,229,229,0.92);
    border-radius: 10px;
    padding: 10px 12px;
    margin-bottom: 12px;
    font-size: 13px;
    line-height: 1.6;
  }
  .pj-banner-link {
    color: #ffffff;
    font-weight: 600;
  }
  .pj-actions {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    margin-top: 18px;
  }
  .pj-btn {
    border: none;
    border-radius: 10px;
    font-family: inherit;
    font-size: 12px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 11px 14px;
    cursor: pointer;
  }
  .pj-btn.secondary {
    background: rgba(229,229,229,0.10);
    color: #E5E5E5;
    border: 1px solid rgba(229,229,229,0.16);
  }
  .pj-btn.primary {
    background: #26A69A;
    color: #fff;
    font-weight: 600;
  }
  .pj-btn:disabled { opacity: 0.45; cursor: not-allowed; }
  .pj-inline-label {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  .pj-info-btn {
    width: 22px;
    height: 22px;
    border-radius: 999px;
    border: 1px solid rgba(229,229,229,0.18);
    background: rgba(229,229,229,0.08);
    color: #E5E5E5;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    padding: 0;
  }
  .pj-modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(17,22,24,0.72);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    z-index: 30;
  }
  .pj-modal {
    width: min(100%, 460px);
    border-radius: 18px;
    border: 1px solid rgba(229,229,229,0.14);
    background: #3E4A51;
    color: #E5E5E5;
    padding: 20px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.28);
  }
  .pj-modal-title {
    margin: 0 0 10px;
    font-family: 'DM Serif Display', serif;
    font-size: 26px;
    line-height: 1.1;
  }
  .pj-modal-copy {
    margin: 0;
    color: rgba(229,229,229,0.82);
    line-height: 1.6;
    font-size: 14px;
  }
  .pj-modal-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 18px;
  }

  /* Job type cards (Step 2) */
  .jt-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;
  }
  @media (min-width: 680px) {
    .jt-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (min-width: 920px) {
    .jt-grid { grid-template-columns: repeat(3, 1fr); } /* ✅ 3 wide */
  }

  .jt-card {
    border: 1px solid rgba(229,229,229,0.12);
    background: rgba(42,52,57,0.55);
    border-radius: 16px;
    overflow: hidden;
    cursor: pointer;
    transition: transform 0.10s, border-color 0.15s, background 0.15s;
    outline: none;
  }
  .jt-card:hover {
    transform: translateY(-1px);
    border-color: rgba(229,229,229,0.20);
    background: rgba(42,52,57,0.70);
  }
  .jt-card:focus-visible {
    box-shadow: 0 0 0 3px rgba(229,229,229,0.20);
  }
  .jt-card.active {
    border-color: rgba(38,166,154,0.60);
    box-shadow: 0 0 0 3px rgba(38,166,154,0.18);
  }

  /* ✅ Circular teal image badge */
  .jt-img {
    width: 100%;
    height: 110px;
    display: grid;
    place-items: center;
    background: transparent;
  }
  .jt-img-badge {
    width: 74px;
    height: 74px;
    border-radius: 999px;
    background: #26A69A;
    display: grid;
    place-items: center;
    box-shadow: 0 10px 26px rgba(38,166,154,0.22);
    border: 1px solid rgba(255,255,255,0.10);
  }
  .jt-img-badge img {
    width: 44px;
    height: 44px;
    object-fit: contain;
    display: block;
    filter: drop-shadow(0 2px 8px rgba(0,0,0,0.18));
  }

  .jt-body { padding: 12px; display: flex; flex-direction: column; gap: 8px; }
  .jt-name { font-size: 14px; font-weight: 600; color: rgba(229,229,229,0.95); letter-spacing: 0.01em; }
  .jt-sub { font-size: 12px; color: rgba(229,229,229,0.60); line-height: 1.5; }

  /* skeletons */
  .sk-grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
  @media (min-width: 680px) { .sk-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (min-width: 920px) { .sk-grid { grid-template-columns: repeat(3, 1fr); } }
  .sk-card {
    border: 1px solid rgba(229,229,229,0.10);
    background: rgba(42,52,57,0.45);
    border-radius: 16px;
    overflow: hidden;
  }
  .sk-img {
    height: 110px;
    background: linear-gradient(90deg, rgba(229,229,229,0.06), rgba(229,229,229,0.10), rgba(229,229,229,0.06));
    background-size: 200% 100%;
    animation: shimmer 1.2s infinite;
  }
  .sk-body { padding: 12px; display: grid; gap: 10px; }
  .sk-line {
    height: 12px;
    border-radius: 10px;
    background: linear-gradient(90deg, rgba(229,229,229,0.06), rgba(229,229,229,0.10), rgba(229,229,229,0.06));
    background-size: 200% 100%;
    animation: shimmer 1.2s infinite;
  }
  .sk-line.sm { width: 55%; }
  .sk-line.md { width: 75%; }
  .sk-line.lg { width: 90%; }
  @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

  /* Calendar */
  .cal-wrap {
    border: 1px solid rgba(229,229,229,0.14);
    background: #2A3439;
    border-radius: 14px;
    padding: 12px;
  }
  .cal-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 10px;
  }
  .cal-title {
    font-size: 12px;
    letter-spacing: 0.10em;
    text-transform: uppercase;
    color: rgba(229,229,229,0.55);
  }
  .cal-nav { display: flex; gap: 8px; align-items: center; }
  .cal-nav-btn {
    border: 1px solid rgba(229,229,229,0.14);
    background: rgba(229,229,229,0.06);
    color: rgba(229,229,229,0.85);
    border-radius: 10px;
    padding: 6px 10px;
    cursor: pointer;
    font-size: 12px;
  }
  .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; }
  .cal-dow {
    font-size: 10px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: rgba(229,229,229,0.38);
    text-align: center;
    padding: 6px 0 2px;
  }
  .cal-day {
    border: 1px solid rgba(229,229,229,0.10);
    background: rgba(229,229,229,0.04);
    color: rgba(229,229,229,0.88);
    border-radius: 12px;
    padding: 10px 0;
    cursor: pointer;
    text-align: center;
    font-size: 13px;
    transition: transform 0.08s, background 0.15s, border-color 0.15s;
    user-select: none;
  }
  .cal-day:hover { background: rgba(229,229,229,0.07); border-color: rgba(229,229,229,0.16); transform: translateY(-1px); }
  .cal-day.muted { opacity: 0.35; cursor: not-allowed; }
  .cal-day.selected {
    background: rgba(38,166,154,0.22);
    border-color: rgba(38,166,154,0.52);
    color: #E5E5E5;
    font-weight: 600;
  }
  .cal-foot { margin-top: 10px; display: flex; gap: 10px; align-items: center; justify-content: space-between; }
  .cal-picked { font-size: 12px; color: rgba(229,229,229,0.68); }

  /* Image previews */
  .img-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-top: 10px; }
  @media (min-width: 740px) { .img-grid { grid-template-columns: repeat(4, 1fr); } }
  .img-card {
    border: 1px solid rgba(229,229,229,0.12);
    background: rgba(229,229,229,0.05);
    border-radius: 14px;
    overflow: hidden;
    position: relative;
    aspect-ratio: 1 / 1;
  }
  .img-card img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .img-badge {
    position: absolute; left: 8px; top: 8px;
    padding: 4px 8px; border-radius: 999px;
    font-size: 11px; color: rgba(255,255,255,0.95);
    background: rgba(0,0,0,0.35);
    border: 1px solid rgba(255,255,255,0.12);
    backdrop-filter: blur(8px);
  }
  .img-remove {
    position: absolute; right: 8px; top: 8px;
    border: 1px solid rgba(255,255,255,0.14);
    background: rgba(0,0,0,0.35);
    color: rgba(255,255,255,0.92);
    border-radius: 10px;
    padding: 4px 8px;
    cursor: pointer;
    font-size: 11px;
    backdrop-filter: blur(8px);
  }
`;

const steps = ["Basics", "Job Type", "Budget", "Images", "Date & Time", "Address", "Review"] as const;
const stepTitles = [
  "Start with the basics",
  "Choose the right job type",
  "Set a fair budget",
  "Add photos, for better results",
  "Choose the date & time that suits you",
  "Tell people where it is",
  "Review before you post",
] as const;
const POST_JOB_DRAFT_KEY = "gumboot-post-job-draft";

type PostJobDraft = {
  step?: number;
  title?: string;
  description?: string;
  jobTypeId?: string;
  budget?: string;
  dateMode?: DateMode;
  jobDate?: string;
  timeMode?: TimeMode;
  exactTime?: string;
  addressLine?: string;
  lat?: number | null;
  lng?: number | null;
  pendingSubmit?: boolean;
  hadImages?: boolean;
};

function readToken() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem("gumboot_token") || window.localStorage.getItem("token") || "";
}

function readPostJobDraft(): PostJobDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(POST_JOB_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PostJobDraft;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function writePostJobDraft(draft: PostJobDraft) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(POST_JOB_DRAFT_KEY, JSON.stringify(draft));
}

function clearPostJobDraft() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(POST_JOB_DRAFT_KEY);
}

function ymdFromDate(d: Date) {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function mapDateType(mode: DateMode) {
  switch (mode) {
    case "urgent":
      return "1";
    case "exact":
      return "2";
    case "before":
      return "3";
    case "after":
      return "4";
    default:
      return "";
  }
}

function mapShiftTime(mode: TimeMode) {
  return mode === "afternoon" ? "pm" : "am";
}

/** Calendar helpers (UTC-based to avoid timezone shifting) */
function startOfMonthUTC(year: number, month0: number) {
  return new Date(Date.UTC(year, month0, 1, 0, 0, 0));
}
function addMonthsUTC(d: Date, delta: number) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + delta, 1, 0, 0, 0));
}
function daysInMonthUTC(year: number, month0: number) {
  return new Date(Date.UTC(year, month0 + 1, 0)).getUTCDate();
}
function dayOfWeekUTC(year: number, month0: number, day: number) {
  return new Date(Date.UTC(year, month0, day)).getUTCDay(); // 0=Sun..6=Sat
}
function prettyYMD(ymd: string) {
  if (!ymd) return "—";
  const [y, m, d] = ymd.split("-").map((x) => Number(x));
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleDateString(undefined, { weekday: "short", year: "numeric", month: "short", day: "numeric" });
}

function prettyTime(value: string) {
  if (!value) return "Pick a time";
  const [hour, minute] = value.split(":").map((part) => Number(part));
  if (Number.isNaN(hour) || Number.isNaN(minute)) return value;
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function getClockHandDegrees(value: string) {
  const [rawHour, rawMinute] = value.split(":").map((part) => Number(part));
  if (Number.isNaN(rawHour) || Number.isNaN(rawMinute)) {
    return { hourDeg: 0, minuteDeg: 0 };
  }
  const minuteDeg = rawMinute * 6;
  const hourDeg = (rawHour % 12) * 30 + rawMinute * 0.5;
  return { hourDeg, minuteDeg };
}

function createBackendPlaceholderImageFile() {
  const transparentPngBase64 =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9pX6lz4AAAAASUVORK5CYII=";
  const binary = atob(transparentPngBase64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new File([bytes], "job-image-placeholder.png", { type: "image/png" });
}

/** Like MapJobs: make relative paths work by prefixing API origin (no /api) */
function resolveAssetUrl(pathOrUrl: string | undefined, apiOrigin: string) {
  if (!pathOrUrl) return "";
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) return pathOrUrl;

  const origin = apiOrigin.endsWith("/") ? apiOrigin.slice(0, -1) : apiOrigin;
  const raw = pathOrUrl.startsWith("/") ? `${origin}${pathOrUrl}` : `${origin}/${pathOrUrl}`;
  try {
    return new URL(raw).toString();
  } catch {
    return raw;
  }
}

/** Job type image resolver — prefers API-provided icon/image paths, falls back to /public/job-types/{slug}.jpg */
function resolveJobTypeImage(t: JobTypeOption, apiOrigin: string) {
  const raw =
    (typeof t?.icon === "string" && t.icon) ||
    (typeof t?.iconPath === "string" && t.iconPath) ||
    (typeof t?.image === "string" && t.image) ||
    (Array.isArray(t?.image) && t.image[0]) ||
    (typeof t?.jobTypeIconPath === "string" && t.jobTypeIconPath) ||
    (typeof t?.job_type_icon === "string" && t.job_type_icon) ||
    "";

  if (raw) return resolveAssetUrl(raw, apiOrigin);

  const slug =
    String(t?.name || "job")
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "job";

  return `/job-types/${slug}.jpg`; // put these in /public/job-types/
}

export default function PostJobPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: meUser, loading: meLoading } = useMe();
  const me = (meUser ?? null) as MeUser | null;
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
  const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // IMPORTANT: apiOrigin strips trailing /api like your MapJobs does
  const apiOrigin = useMemo(() => (API_BASE ?? "").replace(/\/api\/?$/, ""), [API_BASE]);

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardCheckLoading, setCardCheckLoading] = useState(true);
  const [hasSavedCard, setHasSavedCard] = useState(false);
  const [draftHydrated, setDraftHydrated] = useState(false);
  const [pendingResumeSubmit, setPendingResumeSubmit] = useState(false);
  const [restoredDraftHadImages, setRestoredDraftHadImages] = useState(false);

  const [jobTypes, setJobTypes] = useState<JobType[]>([]);
  const [jobTypesLoading, setJobTypesLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [jobTypeId, setJobTypeId] = useState("");
  const [budget, setBudget] = useState("");
  const [budgetInfoOpen, setBudgetInfoOpen] = useState(false);

  const [files, setFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<Array<{ url: string; name: string }>>([]);

  const [dateMode, setDateMode] = useState<DateMode>("exact");
  const [jobDate, setJobDate] = useState(""); // YYYY-MM-DD (UTC)
  const [timeMode, setTimeMode] = useState<TimeMode>("anytime");
  const [exactTime, setExactTime] = useState("");

  const [calCursor, setCalCursor] = useState<Date>(() =>
    startOfMonthUTC(new Date().getUTCFullYear(), new Date().getUTCMonth())
  );

  const [addressLine, setAddressLine] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const addressInputRef = useRef<HTMLInputElement | null>(null);
  const exactTimeInputRef = useRef<HTMLInputElement | null>(null);
  const resumeSubmitRef = useRef(false);
  const resumeRequested = searchParams.get("resume") === "1";
  const resumePath = "/jobs/post?resume=1";

  useEffect(() => {
    const draft = readPostJobDraft();
    if (draft) {
      setStep(
        Math.min(
          steps.length - 1,
          Math.max(resumeRequested || draft.pendingSubmit ? steps.length - 1 : 0, Number(draft.step ?? 0) || 0)
        )
      );
      setTitle(draft.title ?? "");
      setDescription(draft.description ?? "");
      setJobTypeId(draft.jobTypeId ?? "");
      setBudget(draft.budget ?? "");
      setDateMode(draft.dateMode ?? "exact");
      setJobDate(draft.jobDate ?? "");
      setTimeMode(draft.timeMode ?? "anytime");
      setExactTime(draft.exactTime ?? "");
      setAddressLine(draft.addressLine ?? "");
      setLat(typeof draft.lat === "number" ? draft.lat : null);
      setLng(typeof draft.lng === "number" ? draft.lng : null);
      setPendingResumeSubmit(Boolean(draft.pendingSubmit));
      setRestoredDraftHadImages(Boolean(draft.hadImages));
      if (resumeRequested && draft.hadImages) {
        setError("Your draft was restored. Please re-add any images before posting.");
      }
    } else if (resumeRequested) {
      setStep(steps.length - 1);
    }
    setDraftHydrated(true);
  }, [resumeRequested]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setJobTypesLoading(true);
        const types = await getJobTypes();
        if (!mounted) return;
        setJobTypes(types);
      } catch {
        if (!mounted) return;
        setJobTypes([]);
      } finally {
        if (mounted) setJobTypesLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const refreshSavedCardState = useCallback(async () => {
    const token = readToken();
    if (!token) {
      setHasSavedCard(false);
      setCardCheckLoading(false);
      return false;
    }

    setCardCheckLoading(true);
    try {
      const response = await getSavedCards();
      const hasCard = extractCardsFromResponse(response).length > 0;
      setHasSavedCard(hasCard);
      return hasCard;
    } catch {
      setHasSavedCard(false);
      return false;
    } finally {
      setCardCheckLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSavedCardState();
  }, [refreshSavedCardState]);

  useEffect(() => {
    if (!draftHydrated) return;
    writePostJobDraft({
      step,
      title,
      description,
      jobTypeId,
      budget,
      dateMode,
      jobDate,
      timeMode,
      exactTime,
      addressLine,
      lat,
      lng,
      pendingSubmit: pendingResumeSubmit,
      hadImages: files.length > 0,
    });
  }, [
    addressLine,
    budget,
    dateMode,
    description,
    draftHydrated,
    exactTime,
    files.length,
    jobDate,
    jobTypeId,
    lat,
    lng,
    pendingResumeSubmit,
    step,
    timeMode,
    title,
  ]);

  // Generate image previews whenever files change
  useEffect(() => {
    const urls = files.map((f) => ({ url: URL.createObjectURL(f), name: f.name }));
    setFilePreviews(urls);
    return () => {
      for (const p of urls) URL.revokeObjectURL(p.url);
    };
  }, [files]);

  // Google Places autocomplete
  useEffect(() => {
    if (!mapsKey) return;
    if (step !== 5) return;
    if (!addressInputRef.current) return;

    let cancelled = false;
    let autocomplete: google.maps.places.Autocomplete | null = null;

    const attachAutocomplete = () => {
      if (cancelled || !addressInputRef.current) return;
      if (!window.google?.maps?.places) return;

      autocomplete = new window.google.maps.places.Autocomplete(addressInputRef.current, {
        fields: ["formatted_address", "geometry"],
      });

      autocomplete.addListener("place_changed", () => {
        if (cancelled) return;
        const place = autocomplete?.getPlace();
        if (!place) return;

        const formatted = place.formatted_address || addressInputRef.current?.value || "";
        setAddressLine(formatted);

        const g = place.geometry?.location;
        if (g) {
          setLat(g.lat());
          setLng(g.lng());
        }
      });
    };

    const ensurePlacesLoaded = async () => {
      if (window.google?.maps?.places) {
        attachAutocomplete();
        return;
      }
      if (window.google?.maps?.importLibrary) {
        await window.google.maps.importLibrary("places");
        if (!cancelled) attachAutocomplete();
        return;
      }

      const scriptId = "google-maps-places-script";
      const existing = document.getElementById(scriptId) as HTMLScriptElement | null;

      if (existing) {
        if (window.google?.maps?.places) attachAutocomplete();
        else existing.addEventListener("load", attachAutocomplete, { once: true });
        return;
      }

      const script = document.createElement("script");
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${mapsKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.addEventListener("load", attachAutocomplete, { once: true });
      document.head.appendChild(script);
    };

    void ensurePlacesLoaded();

    return () => {
      cancelled = true;
      autocomplete = null;
    };
  }, [mapsKey, step]);

  const selectedTypeName = useMemo(() => {
    const found = (jobTypes as JobTypeOption[]).find((t) => String(t.id ?? t._id) === String(jobTypeId));
    return found?.name || "";
  }, [jobTypeId, jobTypes]);
  const clockHandDegrees = useMemo(() => getClockHandDegrees(exactTime), [exactTime]);

  function canProceed() {
    if (step === 0) return title.trim().length >= 3 && description.trim().length >= 10;
    if (step === 1) return Boolean(jobTypeId);
    if (step === 2) return Number(budget) > 0;
    if (step === 3) return true;
    if (step === 4) return Boolean(jobDate) && (timeMode !== "exact-time" || Boolean(exactTime));
    if (step === 5) return Boolean(addressLine.trim()) && lat != null && lng != null;
    return true;
  }

  const handleSubmit = useCallback(async () => {
    try {
      setError(null);

      if (!title.trim()) return setError("Job title is required.");
      if (!description.trim()) return setError("Description is required.");
      if (!jobTypeId) return setError("Job type is required.");
      if (!(Number(budget) > 0)) return setError("Price is required.");
      if (!jobDate) return setError("Expiry date is required.");
      if (!addressLine.trim()) return setError("Address is required.");
      if (lat == null || lng == null) return setError("Pick an address suggestion so lat/lng are captured.");

      const token = readToken();
      if (!token) {
        setPendingResumeSubmit(true);
        writePostJobDraft({
          step: steps.length - 1,
          title,
          description,
          jobTypeId,
          budget,
          dateMode,
          jobDate,
          timeMode,
          exactTime,
          addressLine,
          lat,
          lng,
          pendingSubmit: true,
          hadImages: files.length > 0,
        });
        router.push(`/auth/login?next=${encodeURIComponent(resumePath)}`);
        return;
      }

      setLoading(true);

      const canPostWithCard = await refreshSavedCardState();
      if (!canPostWithCard) {
        setPendingResumeSubmit(true);
        writePostJobDraft({
          step: steps.length - 1,
          title,
          description,
          jobTypeId,
          budget,
          dateMode,
          jobDate,
          timeMode,
          exactTime,
          addressLine,
          lat,
          lng,
          pendingSubmit: true,
          hadImages: files.length > 0,
        });
        router.push(`/profile/payments?next=${encodeURIComponent(resumePath)}`);
        return;
      }

      // 1) create address
      const addressRes = await fetch(`${API_BASE}/add_address`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          address: addressLine.trim(),
          latitude: String(lat),
          longitude: String(lng),
        }),
        cache: "no-store",
      });

      const addressText = await addressRes.text();
      let addressJson: Record<string, unknown> = {};
      try {
        addressJson = JSON.parse(addressText) as Record<string, unknown>;
      } catch {
        addressJson = { message: addressText };
      }

      if (!addressRes.ok) throw new Error(addressJson?.message || `add_address failed (${addressRes.status})`);

      const addressBody = addressJson?.body ?? addressJson?.data ?? addressJson;
      const addressId = addressBody?._id || addressBody?.id || addressBody?.address?._id || "";
      if (!addressId) throw new Error("add_address succeeded but no addressId returned");

      // 2) create job
      if (meLoading) {
        throw new Error("Your account is still loading. Please wait a moment and try posting again.");
      }

      if (!me?._id) {
        throw new Error("We could not resolve the signed-in account for this job post. Please refresh and try again.");
      }

      const payload = {
        job_title: title.trim(),
        job_type: String(jobTypeId),
        address: String(addressId),
        price: String(Number(budget)),
        description: description.trim(),
        exp_date: jobDate,
        est_time: timeMode === "exact-time" ? exactTime : timeMode,
        latitude: String(lat),
        longitude: String(lng),
        tools_required: false,
        isUrgent: dateMode === "urgent" ? "1" : "0",
        date: jobDate,
        date_type: mapDateType(dateMode),
        shift_time: mapShiftTime(timeMode),
        price_assured: "0",
        userId: me._id,
      } as Record<string, string>;

      if (timeMode === "exact-time" && exactTime) {
        payload.exact_time = exactTime;
      }

      console.debug("[post-job] add_job payload", payload);

      const fd = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        fd.append(key, value);
      });
      const filesToSubmit = files.length > 0 ? files : [createBackendPlaceholderImageFile()];
      for (const f of filesToSubmit) fd.append("image", f);

      const jobRes = await fetch(`${API_BASE}/add_job`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
        cache: "no-store",
      });

      const jobText = await jobRes.text();
      let jobJson: Record<string, unknown> = {};
      try {
        jobJson = JSON.parse(jobText) as Record<string, unknown>;
      } catch {
        jobJson = { message: jobText };
      }

      console.debug("[post-job] add_job response", jobJson?.body ?? jobJson?.data ?? jobJson);

      if (!jobRes.ok) throw new Error(jobJson?.message || jobJson?.error || `add_job failed (${jobRes.status})`);

      clearPostJobDraft();
      router.push("/?posted=1");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to post job");
    } finally {
      setLoading(false);
    }
  }, [
    API_BASE,
    addressLine,
    budget,
    dateMode,
    description,
    exactTime,
    files,
    jobDate,
    jobTypeId,
    lat,
    lng,
    meLoading,
    me?._id,
    refreshSavedCardState,
    resumePath,
    router,
    timeMode,
    title,
  ]);

  // Calendar model
  const calModel = useMemo(() => {
    const y = calCursor.getUTCFullYear();
    const m0 = calCursor.getUTCMonth();
    const dim = daysInMonthUTC(y, m0);
    const firstDow = dayOfWeekUTC(y, m0, 1);
    const today = ymdFromDate(new Date());

    const cells: Array<{ ymd: string; label: string; disabled: boolean; isSelected: boolean }> = [];
    for (let i = 0; i < firstDow; i++) cells.push({ ymd: "", label: "", disabled: true, isSelected: false });

    for (let d = 1; d <= dim; d++) {
      const ymd = `${y}-${String(m0 + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const disabled = ymd < today;
      cells.push({ ymd, label: String(d), disabled, isSelected: ymd === jobDate });
    }

    while (cells.length % 7 !== 0) cells.push({ ymd: "", label: "", disabled: true, isSelected: false });

    const monthLabel = calCursor.toLocaleDateString(undefined, { month: "long", year: "numeric", timeZone: "UTC" });
    return { monthLabel, cells };
  }, [calCursor, jobDate]);

  const removeFileAt = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  useEffect(() => {
    if (!draftHydrated || !resumeRequested || !pendingResumeSubmit || loading || cardCheckLoading) return;
    if (!readToken() || !hasSavedCard || restoredDraftHadImages) return;
    if (files.length > 0) return;
    if (resumeSubmitRef.current) return;
    resumeSubmitRef.current = true;
    void handleSubmit();
  }, [
    cardCheckLoading,
    draftHydrated,
    files.length,
    handleSubmit,
    hasSavedCard,
    loading,
    pendingResumeSubmit,
    restoredDraftHadImages,
    resumeRequested,
  ]);

  return (
    <>
      <style>{styles}</style>

      <div className="pj-root">
        <section className="pj-wrap">
          <p className="pj-step">
            Step {step + 1} of {steps.length} • {steps[step]}
          </p>
          <h1 className="pj-title">{stepTitles[step]}</h1>

          {step === steps.length - 1 && !readToken() && (
            <div className="pj-banner">
              Finish your draft first, then sign in on this last step and we&apos;ll keep it ready to post.
            </div>
          )}

          {step === steps.length - 1 && readToken() && !cardCheckLoading && !hasSavedCard && (
            <div className="pj-banner">
              A saved card is required before posting a job.
              {" "}
              <Link className="pj-banner-link" href={`/profile/payments?next=${encodeURIComponent(resumePath)}`}>
                Add a card in Wallet & Payments
              </Link>
              {" "}and we&apos;ll bring you back here to finish posting.
            </div>
          )}

          {error && <div className="pj-error">{error}</div>}

          {/* Step 1: Basics */}
          {step === 0 && (
            <div className="pj-grid">
              <div className="pj-field">
                <label className="pj-label">Job title</label>
                <input
                  className="pj-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Fix leaking kitchen tap"
                />
              </div>

              <div className="pj-field">
                <label className="pj-label">Job description</label>
                <textarea
                  className="pj-textarea"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe exactly what needs to be done."
                />
              </div>
            </div>
          )}

          {/* Step 2: Job Type */}
          {step === 1 && (
            <div className="pj-grid">
              <div className="pj-field">
                <label className="pj-label">Choose a job type</label>

                {jobTypesLoading ? (
                  <div className="sk-grid" aria-label="Loading job types">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div className="sk-card" key={i}>
                        <div className="sk-img" />
                        <div className="sk-body">
                          <div className="sk-line lg" />
                          <div className="sk-line md" />
                          <div className="sk-line sm" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : jobTypes.length === 0 ? (
                  <p className="pj-note">No job types available right now.</p>
                ) : (
                  <div className="jt-grid" role="list" aria-label="Job types">
                    {(jobTypes as JobTypeOption[]).map((t) => {
                      const id = String(t.id ?? t._id ?? "");
                      const isActive = id === String(jobTypeId);
                      const img = resolveJobTypeImage(t, apiOrigin) || "/globe.svg";

                      return (
                        <div
                          key={id}
                          role="listitem"
                          className={`jt-card${isActive ? " active" : ""}`}
                          onClick={() => setJobTypeId(id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setJobTypeId(id);
                            }
                          }}
                          tabIndex={0}
                        >
                          <div className="jt-img">
                            <div className="jt-img-badge">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={img} alt={t.name || "Job type"} loading="lazy" />
                            </div>
                          </div>

                          <div className="jt-body">
                            <div className="jt-name">{t.name}</div>
                            {t.description ? <div className="jt-sub">{t.description}</div> : null}
                            <div className="jt-sub" style={{ color: isActive ? "rgba(38,166,154,0.95)" : undefined }}>
                              {isActive ? "Selected" : "Tap to select"}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Budget */}
          {step === 2 && (
            <div className="pj-grid">
              <div className="pj-field" style={{ marginTop: 6 }}>
                <label className="pj-label">
                  <span className="pj-inline-label">
                    <span>Budget (single price)</span>
                    <button
                      type="button"
                      className="pj-info-btn"
                      aria-label="Budget information"
                      aria-haspopup="dialog"
                      aria-expanded={budgetInfoOpen}
                      onClick={() => setBudgetInfoOpen(true)}
                    >
                      i
                    </button>
                  </span>
                </label>
                <input
                  className="pj-input"
                  inputMode="decimal"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value.replace(/[^\d.]/g, ""))}
                  placeholder="120"
                />
                <p className="pj-note" style={{ marginTop: 4 }}>
                  {selectedTypeName ? (
                    <>
                      Posting under <strong>{selectedTypeName}</strong>.
                    </>
                  ) : (
                    "Select a job type first."
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Images */}
          {step === 3 && (
            <div className="pj-grid">
              <div className="pj-field">
                <label className="pj-label">Add images</label>
                <input
                  className="pj-input"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
                />
              </div>

              {files.length > 0 ? (
                <div className="img-grid" aria-label="Selected images preview">
                  {filePreviews.map((p, idx) => (
                    <div className="img-card" key={`${p.name}-${idx}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.url} alt={p.name} />
                      <span className="img-badge">{idx + 1}</span>
                      <button type="button" className="img-remove" onClick={() => removeFileAt(idx)}>
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="pj-note">No images selected. This step is optional.</p>
              )}
            </div>
          )}

          {/* Step 5: Date & Time */}
          {step === 4 && (
            <div className="pj-grid">
              <div className="pj-field">
                <label className="pj-label">Expiry date</label>

                <div className="cal-wrap" role="group" aria-label="Pick an expiry date">
                  <div className="cal-head">
                    <div className="cal-title">{calModel.monthLabel}</div>
                    <div className="cal-nav">
                      <button
                        type="button"
                        className="cal-nav-btn"
                        onClick={() => setCalCursor((d) => addMonthsUTC(d, -1))}
                        aria-label="Previous month"
                      >
                        ◀
                      </button>
                      <button
                        type="button"
                        className="cal-nav-btn"
                        onClick={() => setCalCursor((d) => addMonthsUTC(d, 1))}
                        aria-label="Next month"
                      >
                        ▶
                      </button>
                    </div>
                  </div>

                  <div className="cal-grid" aria-hidden="true">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                      <div key={d} className="cal-dow">
                        {d}
                      </div>
                    ))}
                  </div>

                  <div className="cal-grid">
                    {calModel.cells.map((c, i) => {
                      if (!c.label) return <div key={`empty-${i}`} />;
                      const cls = `cal-day${c.disabled ? " muted" : ""}${c.isSelected ? " selected" : ""}`;
                      return (
                        <div
                          key={c.ymd}
                          className={cls}
                          role="button"
                          tabIndex={c.disabled ? -1 : 0}
                          aria-disabled={c.disabled}
                          aria-pressed={c.isSelected}
                          onClick={() => {
                            if (c.disabled) return;
                            setJobDate(c.ymd);
                          }}
                          onKeyDown={(e) => {
                            if (c.disabled) return;
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setJobDate(c.ymd);
                            }
                          }}
                        >
                          {c.label}
                        </div>
                      );
                    })}
                  </div>

                  <div className="cal-foot">
                    <div className="cal-picked">
                      Selected: <strong>{jobDate ? prettyYMD(jobDate) : "—"}</strong>
                    </div>
                    <button
                      type="button"
                      className="cal-nav-btn"
                      onClick={() => {
                        const today = ymdFromDate(new Date());
                        setCalCursor(startOfMonthUTC(new Date().getUTCFullYear(), new Date().getUTCMonth()));
                        setJobDate(today);
                      }}
                    >
                      Today
                    </button>
                  </div>
                </div>

                <input className="pj-input" type="hidden" value={jobDate} readOnly />
              </div>

              <div className="pj-field">
                <label className="pj-label">Date mode</label>
                <div className="pj-row">
                  {(["urgent", "exact", "before", "after"] as DateMode[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      className={`pj-chip${dateMode === m ? " active" : ""}`}
                      onClick={() => setDateMode(m)}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pj-field">
                <label className="pj-label">Estimated time</label>
                <div className="pj-row">
                  {(["morning", "afternoon", "exact-time", "anytime"] as TimeMode[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      className={`pj-chip${timeMode === m ? " active" : ""}`}
                      onClick={() => setTimeMode(m)}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {timeMode === "exact-time" && (
                <div className="pj-field">
                  <label className="pj-label">Exact time</label>
                  <div className="pj-time-picker">
                    <div className="pj-time-picker-clock" aria-hidden="true">
                      {[0, 1, 2, 3].map((marker) => (
                        <span
                          key={marker}
                          className="pj-time-marker"
                          style={{ transform: `rotate(${marker * 90}deg)` }}
                        />
                      ))}
                      <span
                        className="pj-time-hand hour"
                        style={{ transform: `rotate(${clockHandDegrees.hourDeg}deg)` }}
                      />
                      <span
                        className="pj-time-hand minute"
                        style={{ transform: `rotate(${clockHandDegrees.minuteDeg}deg)` }}
                      />
                      <span className="pj-time-hand-pin" />
                    </div>
                    <div className="pj-time-picker-copy">
                      <span className="pj-time-picker-label">Selected time</span>
                      <span className="pj-time-picker-value">{prettyTime(exactTime)}</span>
                      <span className="pj-time-picker-subcopy">
                        Choose the exact arrival time and we&apos;ll save it with the job details.
                      </span>
                    </div>
                    <div>
                      <button
                        type="button"
                        className="pj-time-picker-btn"
                        onClick={() => {
                          const input = exactTimeInputRef.current;
                          if (!input) return;
                          input.focus();
                          if ("showPicker" in input) {
                            try {
                              (input as HTMLInputElement & { showPicker?: () => void }).showPicker?.();
                              return;
                            } catch {
                              // Fall back to native focus/click below.
                            }
                          }
                          input.click();
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path
                            d="M7 3.75V6m10-2.25V6M4.75 9.25h14.5M6.8 20.25h10.4c1.15 0 2.05-.92 2.05-2.05V7.8c0-1.13-.9-2.05-2.05-2.05H6.8c-1.13 0-2.05.92-2.05 2.05v10.4c0 1.13.92 2.05 2.05 2.05Z"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span>Select time</span>
                      </button>
                    </div>
                  </div>
                  <input
                    ref={exactTimeInputRef}
                    className="pj-input time-hidden"
                    type="time"
                    value={exactTime}
                    onChange={(e) => setExactTime(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 6: Address */}
          {step === 5 && (
            <div className="pj-grid">
              <div className="pj-field">
                <label className="pj-label">Address - will be kept hidden untill worker has been selected.</label>
                <input
                  ref={addressInputRef}
                  className="pj-input"
                  value={addressLine}
                  onChange={(e) => {
                    setAddressLine(e.target.value);
                    setLat(null);
                    setLng(null);
                  }}
                  placeholder="Start typing address..."
                />
              </div>
              <p className="pj-note">
                {lat != null && lng != null
                  ? `Pinned: ${lat.toFixed(6)}, ${lng.toFixed(6)}`
                  : "Choose a suggested address so map coordinates are captured."}
              </p>
            </div>
          )}

          {/* Step 7: Review */}
          {step === 6 && (
            <div className="pj-grid">
              <p className="pj-note">Review before posting:</p>

              {files.length > 0 && (
                <div className="img-grid" aria-label="Review images preview">
                  {filePreviews.map((p, idx) => (
                    <div className="img-card" key={`review-${p.name}-${idx}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.url} alt={p.name} />
                      <span className="img-badge">{idx + 1}</span>
                    </div>
                  ))}
                </div>
              )}

              <ul className="pj-list" style={{ marginTop: 10 }}>
                <li><strong>Title:</strong> {title || "—"}</li>
                <li><strong>Description:</strong> {description || "—"}</li>
                <li><strong>Type:</strong> {selectedTypeName || "—"}</li>
                <li><strong>Budget:</strong> {budget ? `$${budget}` : "—"}</li>
                <li><strong>Images:</strong> {files.length}</li>
                <li><strong>Expiry date:</strong> {jobDate ? prettyYMD(jobDate) : "—"} ({dateMode})</li>
                <li>
                  <strong>Est time:</strong> {timeMode}
                  {timeMode === "exact-time" && exactTime ? ` (${exactTime})` : ""}
                </li>
                <li><strong>Address:</strong> {addressLine || "—"}</li>
                <li><strong>Account status:</strong> {readToken() ? "Signed in" : "Sign in required before posting"}</li>
                <li><strong>Saved card on file:</strong> {!readToken() ? "Checked after sign in" : cardCheckLoading ? "Checking…" : hasSavedCard ? "Yes" : "No"}</li>
              </ul>
            </div>
          )}

          <div className="pj-actions">
            <button
              type="button"
              className="pj-btn secondary"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0 || loading}
            >
              Back
            </button>

            {step < steps.length - 1 ? (
              <button
                type="button"
                className="pj-btn primary"
                onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
                disabled={!canProceed() || loading}
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                className="pj-btn primary"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading
                  ? "Posting..."
                  : !readToken()
                    ? "Sign in to post"
                    : !cardCheckLoading && !hasSavedCard
                      ? "Add card to post"
                      : "Post job"}
              </button>
            )}
          </div>
        </section>
      </div>

      {budgetInfoOpen && (
        <div
          className="pj-modal-backdrop"
          role="presentation"
          onClick={() => setBudgetInfoOpen(false)}
        >
          <div
            className="pj-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="budget-info-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="pj-modal-title" id="budget-info-title">Budget info</h2>
            <p className="pj-modal-copy">
              State your Budget for the job, People will send you offers of what they are willing to do it for, so put what you think is fair
            </p>
            <div className="pj-modal-actions">
              <button
                type="button"
                className="pj-btn primary"
                onClick={() => setBudgetInfoOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
