"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { ApiEnvelope } from "@/lib/apiTypes";
import { ApiError } from "@/lib/api";
import {
  fetchJobApplications,
  getApplicationJobId,
  getApplicationWorker,
  normalizeApplicationsResponse,
  updateJobApplicationStatus,
  type JobApplication,
} from "@/lib/applications";
import { resolveChatMediaUrl, resolveUserImageUrl } from "@/lib/messages";
import { extractCardsFromResponse, getSavedCards, recordJobPayment } from "@/lib/payments";
import { buildPublicProfileHref } from "@/lib/publicProfiles";
import { useMe } from "@/lib/useMe";

type JobTypeValue = string | { _id?: string; name?: string } | null | undefined;
type AddressValue =
  | string
  | { _id?: string; address?: string; city?: string; state?: string; country?: string; location?: { coordinates?: [number, number] } }
  | null | undefined;
type UserValue =
  | { _id?: string; firstname?: string; lastname?: string; image?: string; bio?: string; rating?: number; reviews?: number }
  | null | undefined;
type MeUser = { _id?: string; firstname?: string; lastname?: string; role?: string | number };

type JobDetails = {
  _id?: string; id?: string;
  title?: string; job_title?: string;
  description?: string; job_description?: string;
  exp_date?: string; date?: string;
  exact_time?: string; shift_time?: string; est_time?: string;
  job_status?: string | number;
  offered_price?: string | number;
  job_type?: JobTypeValue;
  address?: AddressValue;
  location?: string | { coordinates?: [number, number] } | null;
  userId?: UserValue;
  image?: Array<{ url?: string }> | null;
  raw?: unknown;
};

type JobDetailsEnvelope = ApiEnvelope<JobDetails | { getdetails?: JobDetails; offered_price?: string | number }>;

const STATUS_LABELS: Record<string, string> = {
  "0": "Open", "1": "Applied", "2": "Accepted", "3": "In Progress",
  "4": "Rejected", "5": "Cancelled", "6": "Completed",
  "7": "Ended", "8": "Tracking Started", "9": "Reached Location",
};
const STATUS_HUE: Record<string, string> = {
  "0": "#4ADE80", "1": "#60A5FA", "2": "#A78BFA", "3": "#FBBF24",
  "4": "#F87171", "5": "#94A3B8", "6": "#4ADE80",
  "7": "#94A3B8", "8": "#FB923C", "9": "#FB923C",
};

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600&display=swap');

  :root {
    --bg:        #10161C;
    --card:      #161E26;
    --border:    rgba(255,255,255,0.08);
    --border-hi: rgba(255,255,255,0.14);
    --text:      #EAEAEA;
    --sub:       rgba(234,234,234,0.50);
    --faint:     rgba(234,234,234,0.22);
    --accent:    #2097BD;
    --r-card:    18px;
    --r-sm:      10px;
  }

  .jdc * { box-sizing: border-box; margin: 0; padding: 0; }

  .jdc {
    min-height: calc(100dvh - 56px);
    background:
      radial-gradient(ellipse 700px 400px at 50% -60px, rgba(32,151,189,0.09), transparent 65%),
      var(--bg);
    font-family: 'Geist', sans-serif;
    color: var(--text);
    overflow-x: hidden;
  }

  /* ── NAV ── */
  .jdc-nav {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 18px 24px 0;
    font-size: 11px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--faint);
    max-width: 680px;
    margin: 0 auto;
    width: 100%;
  }
  .jdc-nav-sep { color: rgba(255,255,255,0.14); }
  .jdc-nav-cur { color: var(--sub); }

  /* ── SHELL ── */
  .jdc-shell {
    max-width: 680px;
    margin: 0 auto;
    padding: 24px 24px 72px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    animation: jdc-in 0.38s ease both;
  }

  @keyframes jdc-in {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ── POSTED BY (inline, inside job card) ── */
  .jdc-posted-by {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    border-radius: 12px;
    border: 1px solid var(--border);
    background: rgba(255,255,255,0.03);
    margin-bottom: 20px;
    width: fit-content;
  }
  .jdc-posted-by-link {
    text-decoration: none;
    color: inherit;
    transition: transform 0.16s ease;
  }
  .jdc-posted-by-link:hover {
    transform: translateY(-1px);
  }
  .jdc-posted-by-link:hover .jdc-posted-by {
    border-color: var(--border-hi);
    background: rgba(255,255,255,0.05);
  }

  .jdc-pb-avatar {
    width: 34px; height: 34px;
    border-radius: 50%;
    overflow: hidden;
    background: linear-gradient(135deg, rgba(32,151,189,0.36), rgba(32,151,189,0.10));
    border: 1px solid var(--border-hi);
    display: grid; place-items: center;
    flex-shrink: 0;
  }
  .jdc-pb-avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .jdc-pb-fallback {
    font-size: 12px; font-weight: 600;
    color: rgba(255,255,255,0.80);
    letter-spacing: 0.04em;
  }

  .jdc-pb-text {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
  }

  .jdc-pb-label {
    font-size: 9px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--faint);
    line-height: 1;
  }

  .jdc-pb-name {
    font-size: 13px;
    font-weight: 600;
    color: rgba(234,234,234,0.88);
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .jdc-pb-stars {
    display: flex; align-items: center; gap: 2px;
    margin-left: auto; flex-shrink: 0;
  }
  .jdc-pb-star { font-size: 11px; color: #FBBF24; line-height: 1; }
  .jdc-pb-star.empty { color: rgba(255,255,255,0.12); }
  .jdc-pb-rating { font-size: 11px; color: var(--sub); margin-left: 3px; }

  /* ── JOB CARD ── */
  .jdc-job {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--r-card);
    overflow: hidden;
  }

  /* ── COMPACT GALLERY ── */
  .jdc-gallery-label {
    font-size: 9px; font-weight: 600;
    letter-spacing: 0.16em; text-transform: uppercase;
    color: var(--faint); margin-bottom: 10px; margin-top: 20px;
  }

  .jdc-gallery {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
  }

  .jdc-gthumb {
    aspect-ratio: 1 / 1;
    border-radius: 10px;
    overflow: hidden;
    border: 1px solid var(--border);
    background: rgba(255,255,255,0.03);
    cursor: pointer;
    position: relative;
    transition: transform 0.16s ease, border-color 0.16s ease;
  }

  .jdc-gthumb:hover {
    transform: translateY(-2px);
    border-color: var(--border-hi);
  }

  .jdc-gthumb img {
    width: 100%; height: 100%; object-fit: cover; display: block;
    transition: transform 0.3s ease;
  }

  .jdc-gthumb:hover img { transform: scale(1.06); }

  .jdc-gthumb-overlay {
    position: absolute; inset: 0;
    background: rgba(0,0,0,0);
    display: flex; align-items: center; justify-content: center;
    transition: background 0.16s ease;
  }

  .jdc-gthumb:hover .jdc-gthumb-overlay { background: rgba(0,0,0,0.28); }

  .jdc-gthumb-icon {
    font-size: 16px; opacity: 0;
    transition: opacity 0.16s ease;
    color: #fff;
  }

  .jdc-gthumb:hover .jdc-gthumb-icon { opacity: 1; }

  /* +N more tile */
  .jdc-gthumb-more {
    aspect-ratio: 1 / 1;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: rgba(255,255,255,0.04);
    display: flex; align-items: center; justify-content: center;
    flex-direction: column; gap: 3px;
    cursor: pointer;
    transition: background 0.16s, border-color 0.16s, transform 0.16s;
    color: var(--sub);
    font-size: 13px; font-weight: 600;
  }

  .jdc-gthumb-more:hover {
    background: rgba(255,255,255,0.08);
    border-color: var(--border-hi);
    transform: translateY(-2px);
  }

  .jdc-gthumb-more-label {
    font-size: 9px; letter-spacing: 0.10em;
    text-transform: uppercase; color: var(--faint);
  }

  /* ── LIGHTBOX ── */
  .jdc-lightbox {
    position: fixed; inset: 0; z-index: 9999;
    background: rgba(0,0,0,0.88);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    display: flex; align-items: center; justify-content: center;
    padding: 24px;
    animation: lb-in 0.18s ease both;
  }

  @keyframes lb-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  .jdc-lb-inner {
    position: relative;
    max-width: min(900px, 100%);
    max-height: 90dvh;
    display: flex; flex-direction: column;
    align-items: center; gap: 14px;
  }

  .jdc-lb-img {
    max-width: 100%; max-height: 75dvh;
    border-radius: 14px;
    object-fit: contain;
    display: block;
    box-shadow: 0 32px 80px rgba(0,0,0,0.60);
  }

  .jdc-lb-close {
    position: absolute; top: -14px; right: -14px;
    width: 36px; height: 36px;
    border-radius: 50%;
    border: 1px solid rgba(255,255,255,0.14);
    background: rgba(30,38,46,0.92);
    color: rgba(255,255,255,0.70);
    font-size: 16px;
    display: grid; place-items: center;
    cursor: pointer;
    transition: background 0.14s, color 0.14s;
  }

  .jdc-lb-close:hover { background: rgba(60,70,80,0.96); color: #fff; }

  .jdc-lb-nav {
    display: flex; gap: 10px; align-items: center;
  }

  .jdc-lb-btn {
    width: 40px; height: 40px;
    border-radius: 50%;
    border: 1px solid rgba(255,255,255,0.14);
    background: rgba(30,38,46,0.80);
    color: rgba(255,255,255,0.70);
    font-size: 18px;
    display: grid; place-items: center;
    cursor: pointer;
    transition: background 0.14s, color 0.14s, transform 0.14s;
  }

  .jdc-lb-btn:hover { background: rgba(255,255,255,0.12); color: #fff; transform: scale(1.06); }
  .jdc-lb-btn:disabled { opacity: 0.24; cursor: default; transform: none; }

  .jdc-lb-counter {
    font-size: 12px; color: rgba(255,255,255,0.44);
    letter-spacing: 0.06em; min-width: 52px; text-align: center;
  }

  .jdc-lb-strip {
    display: flex; gap: 7px; flex-wrap: wrap; justify-content: center;
  }

  .jdc-lb-sthumb {
    width: 44px; height: 44px;
    border-radius: 8px; overflow: hidden;
    border: 2px solid transparent;
    cursor: pointer; background: rgba(255,255,255,0.04);
    transition: border-color 0.14s, transform 0.14s;
    flex-shrink: 0;
  }

  .jdc-lb-sthumb:hover { transform: translateY(-1px); }
  .jdc-lb-sthumb.active { border-color: var(--accent); }
  .jdc-lb-sthumb img { width: 100%; height: 100%; object-fit: cover; display: block; }

  /* Job body */
  .jdc-job-body { padding: 20px 22px 22px; }

  .jdc-tags {
    display: flex; flex-wrap: wrap;
    gap: 6px; margin-bottom: 12px;
  }
  .jdc-tag {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 4px 9px;
    border-radius: 6px;
    border: 1px solid var(--border);
    background: rgba(255,255,255,0.04);
    font-size: 10px; font-weight: 500;
    letter-spacing: 0.08em; text-transform: uppercase;
    color: var(--sub);
  }
  .jdc-tag-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }

  .jdc-title {
    font-family: 'Instrument Serif', serif;
    font-size: 27px; font-weight: 400;
    line-height: 1.22; color: var(--text);
    margin-bottom: 16px;
  }

  /* Meta grid */
  .jdc-meta {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1px;
    background: var(--border);
    border: 1px solid var(--border);
    border-radius: var(--r-sm);
    overflow: hidden;
    margin-bottom: 20px;
  }
  .jdc-meta-cell {
    background: rgba(18,26,34,0.94);
    padding: 11px 14px;
  }
  .jdc-meta-cell.wide { grid-column: 1 / -1; }
  .jdc-meta-label {
    font-size: 9px; font-weight: 600;
    letter-spacing: 0.16em; text-transform: uppercase;
    color: var(--faint); margin-bottom: 3px;
  }
  .jdc-meta-value {
    font-size: 13px;
    color: rgba(234,234,234,0.80);
    line-height: 1.45;
  }

  /* Description */
  .jdc-desc-label {
    font-size: 9px; font-weight: 600;
    letter-spacing: 0.16em; text-transform: uppercase;
    color: var(--faint); margin-bottom: 10px;
  }
  .jdc-desc {
    font-size: 14px; font-weight: 300;
    line-height: 1.82; color: rgba(234,234,234,0.60);
    white-space: pre-wrap;
  }

  .jdc-job-id {
    margin-top: 16px; font-size: 10px;
    color: var(--faint); letter-spacing: 0.06em;
  }

  /* Raw */
  .raw-toggle {
    display: flex; align-items: center; gap: 6px;
    background: none; border: none; cursor: pointer;
    font-family: 'Geist', sans-serif;
    font-size: 10px; font-weight: 500;
    letter-spacing: 0.10em; text-transform: uppercase;
    color: var(--faint); padding: 0;
    transition: color 0.14s; margin-top: 12px;
  }
  .raw-toggle:hover { color: var(--sub); }
  .raw-icon { display: inline-block; transition: transform 0.18s; font-size: 8px; }
  .raw-icon.open { transform: rotate(90deg); }
  .raw-pre {
    margin-top: 10px; font-size: 10px;
    font-family: 'SF Mono', 'Fira Code', monospace;
    background: rgba(0,0,0,0.24); border: 1px solid var(--border);
    border-radius: var(--r-sm); padding: 14px;
    overflow: auto; color: rgba(255,255,255,0.30);
    line-height: 1.6; max-height: 260px;
  }

  /* ── APPLY CARD ── */
  .jdc-apply {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--r-card);
    padding: 18px 20px 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .jdc-price-row {
    display: flex; align-items: baseline;
    justify-content: space-between; flex-wrap: wrap; gap: 6px;
  }
  .jdc-price {
    font-family: 'Instrument Serif', serif;
    font-size: 28px; color: var(--text);
  }
  .jdc-price-label {
    font-size: 10px; color: var(--faint);
    letter-spacing: 0.08em; text-transform: uppercase;
  }
  .jdc-apply-btn {
    width: 100%; border: none;
    border-radius: 13px; padding: 16px;
    font-family: 'Geist', sans-serif;
    font-size: 13px; font-weight: 600;
    letter-spacing: 0.08em; text-transform: uppercase;
    color: #fff;
    background: linear-gradient(135deg, #2097BD 0%, #136e8a 100%);
    box-shadow: 0 10px 30px rgba(32,151,189,0.26);
    cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }
  .jdc-apply-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 14px 36px rgba(32,151,189,0.36);
  }
  .jdc-apply-note {
    font-size: 11px; color: var(--faint);
    text-align: center; line-height: 1.6;
  }

  /* ── SKELETON ── */
  .sk {
    border-radius: 6px;
    background: linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.09) 50%, rgba(255,255,255,0.05) 75%);
    background-size: 200% 100%;
    animation: sk-shine 1.6s infinite;
  }
  @keyframes sk-shine {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  /* ── ERROR ── */
  .jdc-error {
    background: rgba(248,113,113,0.07);
    border: 1px solid rgba(248,113,113,0.20);
    border-radius: var(--r-card);
    padding: 36px; text-align: center;
  }
  .jdc-error-icon { font-size: 22px; opacity: 0.60; margin-bottom: 10px; }
  .jdc-error-msg { font-size: 13px; color: rgba(255,200,200,0.70); line-height: 1.7; }

  /* ── RESPONSIVE ── */
  @media (max-width: 520px) {
    .jdc-shell { padding: 18px 14px 60px; }
    .jdc-title { font-size: 24px; }
    .jdc-meta { grid-template-columns: 1fr; }
    .jdc-meta-cell.wide { grid-column: 1; }
  }
`;

/* ─── helpers ────────────────────────────────────────── */

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function normalizeJobDetails(payload: JobDetailsEnvelope): JobDetails | null {
  const body = payload.body;
  if (!body || !isObject(body)) return null;
  const details = isObject(body.getdetails) ? (body.getdetails as JobDetails) : (body as JobDetails);
  const rawPrice =
    typeof body.offered_price === "string" || typeof body.offered_price === "number"
      ? body.offered_price : undefined;
  return { ...details, offered_price: details.offered_price ?? rawPrice, raw: body };
}

function formatDate(v?: string | null) {
  if (!v) return "No date set";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

function getTimeLabel(job?: JobDetails | null) {
  if (!job) return "No time set";
  if (job.exact_time) return job.exact_time;
  if (job.shift_time) {
    if (job.shift_time.toLowerCase() === "am") return "Morning shift";
    if (job.shift_time.toLowerCase() === "pm") return "Afternoon shift";
    return job.shift_time;
  }
  return "No time set";
}

function getJobTypeName(t?: JobTypeValue) {
  if (!t) return null;
  return typeof t === "string" ? t : t.name || null;
}

function getAddressText(a?: AddressValue) {
  if (!a) return null;
  if (typeof a === "string") {
    const parts = a
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    if (parts.length >= 3) return `${parts[1]}, ${parts[2]}`;
    if (parts.length >= 2) return `${parts[0]}, ${parts[1]}`;
    return parts[0] || null;
  }

  const suburb =
    typeof (a as { suburb?: unknown }).suburb === "string"
      ? String((a as { suburb?: unknown }).suburb).trim()
      : "";
  const city = typeof a.city === "string" ? a.city.trim() : "";
  const state = typeof a.state === "string" ? a.state.trim() : "";
  if (suburb && city) return `${suburb}, ${city}`;
  if (city && state) return `${city}, ${state}`;
  if (city) return city;
  if (suburb) return suburb;

  const rawAddress = typeof a.address === "string" ? a.address.trim() : "";
  if (!rawAddress) return null;
  const parts = rawAddress
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length >= 3) return `${parts[1]}, ${parts[2]}`;
  if (parts.length >= 2) return `${parts[0]}, ${parts[1]}`;
  return parts[0] || null;
}

function getPosterName(u?: UserValue) {
  if (!u || !isObject(u)) return null;
  return [u.firstname, u.lastname].filter(Boolean).join(" ").trim() || null;
}

function getPosterInitials(u?: UserValue) {
  if (!u || !isObject(u)) return "JB";
  return [u.firstname, u.lastname]
    .filter((v): v is string => typeof v === "string" && v.length > 0)
    .map((v) => v[0]?.toUpperCase()).join("") || "JB";
}

function getGalleryImages(job?: JobDetails | null) {
  if (!job || !Array.isArray(job.image)) return [];
  return job.image.map((i) => resolveChatMediaUrl(i?.url)).filter((v): v is string => Boolean(v));
}

function getLocationDisplay(job?: JobDetails | null) {
  const a = getAddressText(job?.address);
  if (a) return a;
  const loc = job?.location;
  if (typeof loc === "string" && loc.trim()) return loc.trim();
  if (isObject(loc) && Array.isArray(loc.coordinates) && loc.coordinates.length >= 2) {
    const [lng, lat] = loc.coordinates;
    return `${lat}, ${lng}`;
  }
  return "No address provided";
}

function isWorkerRole(role: unknown) {
  const value = String(role ?? "").trim().toLowerCase();
  return value === "2" || value === "worker";
}

function getJobOwnerId(job?: JobDetails | null) {
  return job?.userId?._id ?? "";
}

function formatDateTime(value?: string) {
  if (!value) return "Recently";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function PostedBy({ name, initials, src, rating, reviews, href }: {
  name: string | null; initials: string; src: string | null;
  rating?: number; reviews?: number;
  href?: string | null;
}) {
  const content = (
    <div className="jdc-posted-by">
      <div className="jdc-pb-avatar">
        {src
          ? <img src={src} alt={name ?? "Poster"} />
          : <span className="jdc-pb-fallback">{initials}</span>}
      </div>
      <div className="jdc-pb-text">
        <span className="jdc-pb-label">Posted by</span>
        <span className="jdc-pb-name">{name ?? "Unknown"}</span>
      </div>
      {(rating != null && rating > 0) && (
        <div className="jdc-pb-stars">
          {[1,2,3,4,5].map((s) => (
            <span key={s} className={`jdc-pb-star ${s <= Math.round(rating) ? "" : "empty"}`}>★</span>
          ))}
          <span className="jdc-pb-rating">
            {rating.toFixed(1)}{reviews ? ` (${reviews})` : ""}
          </span>
        </div>
      )}
    </div>
  );

  if (!href) return content;

  return (
    <Link className="jdc-posted-by-link" href={href}>
      {content}
    </Link>
  );
}

/* ─── component ──────────────────────────────────────── */

export default function JobDetailsClient({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: meUser } = useMe();
  const me = (meUser ?? null) as MeUser | null;
  const [job, setJob] = useState<JobDetails | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [rawOpen, setRawOpen] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [hasSavedCard, setHasSavedCard] = useState(false);
  const [paymentBusy, setPaymentBusy] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [applicationsError, setApplicationsError] = useState<string | null>(null);
  const [applicationAction, setApplicationAction] = useState<string | null>(null);
  const [applicationMessage, setApplicationMessage] = useState<string | null>(
    searchParams.get("applied") === "1" ? "Application sent successfully." : null
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setErr(null); setJob(null);
        const res = await fetch(`/api/jobs/${id}`, { method: "GET", cache: "no-store" });
        const data = (await res.json()) as JobDetailsEnvelope;
        if (!res.ok || data.success === false) throw new Error(data.message || `HTTP ${res.status}`);
        const normalized = normalizeJobDetails(data);
        if (!cancelled) {
          if (!normalized) { setErr("Job details were not available."); return; }
          setJob(normalized);
        }
      } catch (e: unknown) {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Failed to load job details");
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    const token =
      typeof window === "undefined"
        ? ""
        : window.localStorage.getItem("gumboot_token") || window.localStorage.getItem("token") || "";

    if (!token) {
      setHasSavedCard(false);
      return;
    }

    (async () => {
      try {
        const response = await getSavedCards();
        if (!cancelled) setHasSavedCard(extractCardsFromResponse(response).length > 0);
      } catch {
        if (!cancelled) setHasSavedCard(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const isPoster = me?._id != null && me._id === getJobOwnerId(job);
  const canApply = Boolean(me?._id) && isWorkerRole(me?.role) && !isPoster;

  const loadApplications = useCallback(async () => {
    if (!job?._id || !isPoster) return;
    setApplicationsLoading(true);
    setApplicationsError(null);
    try {
      const response = await fetchJobApplications(job._id);
      setApplications(normalizeApplicationsResponse(response));
    } catch (nextError) {
      if (nextError instanceof ApiError && (nextError.status === 401 || nextError.status === 403)) {
        router.replace("/auth/login");
        return;
      }
      setApplicationsError(nextError instanceof Error ? nextError.message : "Failed to load applications.");
    } finally {
      setApplicationsLoading(false);
    }
  }, [isPoster, job?._id, router]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const title        = job?.job_title || job?.title || "Untitled Job";
  const description  = job?.job_description || job?.description || "No description provided.";
  const dateLabel    = formatDate(job?.exp_date || job?.date || null);
  const timeLabel    = getTimeLabel(job);
  const status       = job?.job_status != null ? String(job.job_status) : "";
  const statusLabel  = STATUS_LABELS[status] || (status ? `Status ${status}` : "Unknown");
  const statusColor  = STATUS_HUE[status] || "rgba(255,255,255,0.40)";
  const jobTypeName  = getJobTypeName(job?.job_type);
  const locationText = getLocationDisplay(job);
  const posterName   = getPosterName(job?.userId);
  const posterInitials = getPosterInitials(job?.userId);
  const posterSrc    = resolveUserImageUrl(job?.userId?.image);
  const posterHref   = job?.userId?._id
    ? buildPublicProfileHref({
        userId: job.userId._id,
        kind: "employer",
      })
    : null;
  const galleryImages = useMemo(() => getGalleryImages(job), [job]);
  const priceLabel   = useMemo(() => {
    if (job?.offered_price == null || job?.offered_price === "") return null;
    return `$${job.offered_price}`;
  }, [job?.offered_price]);
  const numericPrice = useMemo(() => {
    const parsed = Number.parseFloat(String(job?.offered_price ?? ""));
    return Number.isFinite(parsed) ? parsed : null;
  }, [job?.offered_price]);

  const posterRating  = job?.userId?.rating;
  const posterReviews = job?.userId?.reviews;

  async function handlePayNow() {
    if (!job?._id && !id) {
      setPaymentError("Job id is missing.");
      return;
    }
    if (!numericPrice || numericPrice <= 0) {
      setPaymentError("This job does not have a payable amount yet.");
      return;
    }
    if (!hasSavedCard) {
      setPaymentError("Add a saved card before making a payment.");
      return;
    }

    setPaymentBusy(true);
    setPaymentError(null);
    setPaymentMessage(null);
    try {
      const transactionId =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? `web-${crypto.randomUUID()}`
          : `web-${Date.now()}-${id}`;

      await recordJobPayment({
        transactionId,
        jobId: job?._id || id,
        transaction_status: 1,
        amount: numericPrice,
        cancellation_charges: 0,
      });
      setPaymentMessage("Payment recorded successfully.");
    } catch (nextError) {
      setPaymentError(nextError instanceof Error ? nextError.message : "Payment failed.");
    } finally {
      setPaymentBusy(false);
    }
  }

  async function handleApplicationStatus(application: JobApplication, status: 2 | 4) {
    const applicationId = application._id ?? "";
    const jobId = getApplicationJobId(application) || job?._id || id;
    if (!applicationId || !jobId) return;

    setApplicationAction(`${status}-${applicationId}`);
    setApplicationsError(null);
    setApplicationMessage(null);
    try {
      await updateJobApplicationStatus({
        jobRequested_id: applicationId,
        job_id: jobId,
        job_status: status,
      });
      setApplicationMessage(status === 2 ? "Application accepted." : "Application declined.");
      await loadApplications();
    } catch (nextError) {
      if (nextError instanceof ApiError && (nextError.status === 401 || nextError.status === 403)) {
        router.replace("/auth/login");
        return;
      }
      setApplicationsError(nextError instanceof Error ? nextError.message : "Failed to update application.");
    } finally {
      setApplicationAction(null);
    }
  }

  return (
    <>
      <style>{styles}</style>
      <div className="jdc">

        <div className="jdc-nav">
          <span>Jobs</span>
          <span className="jdc-nav-sep">›</span>
          <span className="jdc-nav-cur">Details</span>
        </div>

        <div className="jdc-shell">

          {/* ERROR */}
          {err && (
            <div className="jdc-error">
              <div className="jdc-error-icon">⚠</div>
              <p className="jdc-error-msg">{err}</p>
            </div>
          )}

          {/* SKELETON */}
          {!err && !job && (
            <>
              <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 18, padding: 28, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                <div className="sk" style={{ width: 68, height: 68, borderRadius: "50%" }} />
                <div className="sk" style={{ width: 130, height: 16 }} />
                <div className="sk" style={{ width: 90, height: 12 }} />
              </div>
              <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 18, overflow: "hidden" }}>
                <div className="sk" style={{ width: "100%", height: 200 }} />
                <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 12 }}>
                  <div className="sk" style={{ width: "60%", height: 30 }} />
                  <div className="sk" style={{ width: "100%", height: 56, borderRadius: 10 }} />
                  <div className="sk" style={{ width: "85%", height: 14 }} />
                  <div className="sk" style={{ width: "70%", height: 14 }} />
                </div>
              </div>
            </>
          )}

          {job && (
            <>
              {/* ── JOB ── */}
              <div className="jdc-job">
                <div className="jdc-job-body">
                  <div className="jdc-tags">
                    {jobTypeName && <span className="jdc-tag">{jobTypeName}</span>}
                    <span className="jdc-tag">
                      <span className="jdc-tag-dot" style={{ background: statusColor }} />
                      {statusLabel}
                    </span>
                  </div>

                  <h1 className="jdc-title">{title}</h1>

                  <PostedBy
                    name={posterName}
                    initials={posterInitials}
                    src={posterSrc}
                    rating={posterRating}
                    reviews={posterReviews}
                    href={posterHref}
                  />

                  <div className="jdc-meta">
                    <div className="jdc-meta-cell">
                      <div className="jdc-meta-label">Date</div>
                      <div className="jdc-meta-value">{dateLabel}</div>
                    </div>
                    <div className="jdc-meta-cell">
                      <div className="jdc-meta-label">Time</div>
                      <div className="jdc-meta-value">{timeLabel}</div>
                    </div>
                    <div className="jdc-meta-cell wide">
                      <div className="jdc-meta-label">Location</div>
                      <div className="jdc-meta-value">{locationText}</div>
                    </div>
                  </div>

                  <div className="jdc-desc-label">About this job</div>
                  <p className="jdc-desc">{description}</p>

                  {/* ── Compact image gallery ── */}
                  {galleryImages.length > 0 && (
                    <>
                      <div className="jdc-gallery-label">Photos</div>
                      <div className="jdc-gallery">
                        {galleryImages.slice(0, 3).map((src, i) => (
                          <button
                            key={src} type="button"
                            className="jdc-gthumb"
                            onClick={() => setLightboxIdx(i)}
                            aria-label={`View photo ${i + 1}`}
                          >
                            <img src={src} alt={`Job photo ${i + 1}`} />
                            <div className="jdc-gthumb-overlay">
                              <span className="jdc-gthumb-icon">⤢</span>
                            </div>
                          </button>
                        ))}
                        {galleryImages.length > 3 && (
                          <button
                            type="button"
                            className="jdc-gthumb-more"
                            onClick={() => setLightboxIdx(3)}
                            aria-label={`View all ${galleryImages.length} photos`}
                          >
                            <span>+{galleryImages.length - 3}</span>
                            <span className="jdc-gthumb-more-label">more</span>
                          </button>
                        )}
                      </div>
                    </>
                  )}

                  <div className="jdc-job-id">Job #{id}</div>

                  <button className="raw-toggle" onClick={() => setRawOpen((v) => !v)}>
                    <span className={`raw-icon ${rawOpen ? "open" : ""}`}>▶</span>
                    Raw payload
                  </button>
                  {rawOpen && <pre className="raw-pre">{JSON.stringify(job, null, 2)}</pre>}
                </div>
              </div>

              {/* ── LIGHTBOX ── */}
              {lightboxIdx !== null && (
                <div
                  className="jdc-lightbox"
                  onClick={() => setLightboxIdx(null)}
                  role="dialog"
                  aria-modal="true"
                  aria-label="Image viewer"
                >
                  <div className="jdc-lb-inner" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button" className="jdc-lb-close"
                      onClick={() => setLightboxIdx(null)}
                      aria-label="Close"
                    >✕</button>

                    <img
                      className="jdc-lb-img"
                      src={galleryImages[lightboxIdx]}
                      alt={`Job photo ${lightboxIdx + 1}`}
                    />

                    {galleryImages.length > 1 && (
                      <div className="jdc-lb-nav">
                        <button
                          type="button" className="jdc-lb-btn"
                          disabled={lightboxIdx === 0}
                          onClick={() => setLightboxIdx((i) => Math.max(0, (i ?? 0) - 1))}
                          aria-label="Previous"
                        >‹</button>
                        <span className="jdc-lb-counter">{lightboxIdx + 1} / {galleryImages.length}</span>
                        <button
                          type="button" className="jdc-lb-btn"
                          disabled={lightboxIdx === galleryImages.length - 1}
                          onClick={() => setLightboxIdx((i) => Math.min(galleryImages.length - 1, (i ?? 0) + 1))}
                          aria-label="Next"
                        >›</button>
                      </div>
                    )}

                    {galleryImages.length > 1 && (
                      <div className="jdc-lb-strip">
                        {galleryImages.map((src, i) => (
                          <button
                            key={src} type="button"
                            className={`jdc-lb-sthumb ${i === lightboxIdx ? "active" : ""}`}
                            onClick={() => setLightboxIdx(i)}
                            aria-label={`Photo ${i + 1}`}
                          >
                            <img src={src} alt="" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── APPLY ── */}
              <div className="jdc-apply">
                {priceLabel && (
                  <div className="jdc-price-row">
                    <span className="jdc-price">{priceLabel}</span>
                    <span className="jdc-price-label">Offered price</span>
                  </div>
                )}
                {priceLabel && (
                  <div style={{ marginBottom: 14, display: "grid", gap: 10 }}>
                    {!hasSavedCard ? (
                      <div style={{ border: "1px solid rgba(255,255,255,0.10)", borderRadius: 14, background: "rgba(255,255,255,0.04)", padding: 14, fontSize: 13, color: "var(--sub)", lineHeight: 1.6 }}>
                        Add a saved card before paying for this job.
                        {" "}
                        <Link href="/profile/payments" style={{ color: "#EAEAEA", fontWeight: 600 }}>
                          Open wallet & payments
                        </Link>
                      </div>
                    ) : (
                      <div style={{ border: "1px solid rgba(255,255,255,0.10)", borderRadius: 14, background: "rgba(255,255,255,0.04)", padding: 14, display: "grid", gap: 10 }}>
                        <div style={{ fontSize: 13, color: "var(--sub)", lineHeight: 1.6 }}>
                          Use your saved card to record payment for this job. This web flow currently records the backend payment directly.
                        </div>
                        <button
                          type="button"
                          className="jdc-apply-btn"
                          disabled={paymentBusy}
                          onClick={handlePayNow}
                        >
                          {paymentBusy ? "Processing payment..." : `Pay now${priceLabel ? ` • ${priceLabel}` : ""}`}
                        </button>
                      </div>
                    )}
                    {paymentError && <div style={{ color: "#fecaca", fontSize: 13 }}>{paymentError}</div>}
                    {paymentMessage && <div style={{ color: "#a7f3d0", fontSize: 13 }}>{paymentMessage}</div>}
                  </div>
                )}

                {canApply ? (
                  <>
                    <button type="button" className="jdc-apply-btn" onClick={() => router.push(`/jobs/${id}/apply`)}>
                      Apply for this job
                    </button>
                    <p className="jdc-apply-note">Send your offer amount and message on the next screen.</p>
                  </>
                ) : !me?._id ? (
                  <>
                    <button type="button" className="jdc-apply-btn" onClick={() => router.push(`/auth/login?next=${encodeURIComponent(`/jobs/${id}/apply`)}`)}>
                      Sign in to apply
                    </button>
                    <p className="jdc-apply-note">Workers need to be signed in before sending an offer.</p>
                  </>
                ) : isPoster ? (
                  <>
                    <div className="jdc-apply-note" style={{ marginBottom: 14 }}>Incoming applications for this job</div>
                    {applicationMessage ? <div style={{ color: "#a7f3d0", fontSize: 13, marginBottom: 12 }}>{applicationMessage}</div> : null}
                    {applicationsError ? <div style={{ color: "#fecaca", fontSize: 13, marginBottom: 12 }}>{applicationsError}</div> : null}
                    {applicationsLoading ? (
                      <div className="jdc-apply-note">Loading applications…</div>
                    ) : applications.length === 0 ? (
                      <div className="jdc-apply-note">No applications have arrived yet.</div>
                    ) : (
                      <div style={{ display: "grid", gap: 12 }}>
                        {applications.map((application) => {
                          const worker = getApplicationWorker(application);
                          const workerName =
                            [worker?.firstname, worker?.lastname].filter(Boolean).join(" ").trim() || "Worker";
                          const workerImage = resolveUserImageUrl(worker?.image);
                          const profileHref = worker?._id
                            ? buildPublicProfileHref({
                                userId: worker._id,
                                kind: "worker",
                                jobId: application._id ?? "",
                              })
                            : null;
                          const currentStatus = String(application.job_status ?? "1");

                          return (
                            <div
                              key={application._id ?? `${worker?._id}-${application.createdAt ?? ""}`}
                              style={{
                                border: "1px solid rgba(255,255,255,0.10)",
                                borderRadius: 14,
                                background: "rgba(255,255,255,0.04)",
                                padding: 14,
                                display: "grid",
                                gap: 10,
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                                  <div
                                    style={{
                                      width: 42,
                                      height: 42,
                                      borderRadius: "50%",
                                      overflow: "hidden",
                                      border: "1px solid rgba(255,255,255,0.10)",
                                      background: "rgba(255,255,255,0.06)",
                                      display: "grid",
                                      placeItems: "center",
                                      flexShrink: 0,
                                    }}
                                  >
                                    {workerImage ? (
                                      <img src={workerImage} alt={workerName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    ) : (
                                      <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.72)" }}>
                                        {workerName.slice(0, 2).toUpperCase()}
                                      </span>
                                    )}
                                  </div>
                                  <div style={{ minWidth: 0 }}>
                                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{workerName}</div>
                                    <div style={{ fontSize: 11, color: "var(--sub)" }}>{formatDateTime(application.createdAt)}</div>
                                  </div>
                                </div>
                                <div style={{ fontSize: 16, fontWeight: 700, color: "#26A69A", whiteSpace: "nowrap" }}>
                                  {application.offered_price != null && application.offered_price !== "" ? `$${application.offered_price}` : "No offer"}
                                </div>
                              </div>

                              <div style={{ fontSize: 13, lineHeight: 1.7, color: "var(--sub)" }}>
                                {application.message?.trim() || "No message provided."}
                              </div>

                              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                                {profileHref ? (
                                  <Link
                                    href={profileHref}
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      minHeight: 34,
                                      padding: "0 12px",
                                      borderRadius: 999,
                                      border: "1px solid rgba(255,255,255,0.10)",
                                      background: "rgba(255,255,255,0.06)",
                                      color: "rgba(234,234,234,0.78)",
                                      textDecoration: "none",
                                      fontSize: 11,
                                      textTransform: "uppercase",
                                      letterSpacing: "0.10em",
                                    }}
                                  >
                                    View profile
                                  </Link>
                                ) : null}
                                <button
                                  type="button"
                                  className="jdc-apply-btn"
                                  style={{ width: "auto", padding: "11px 14px", fontSize: 11 }}
                                  disabled={currentStatus === "2" || applicationAction === `2-${application._id}`}
                                  onClick={() => handleApplicationStatus(application, 2)}
                                >
                                  {currentStatus === "2" ? "Accepted" : "Accept"}
                                </button>
                                <button
                                  type="button"
                                  className="jdc-apply-btn"
                                  style={{ width: "auto", padding: "11px 14px", fontSize: 11, background: "rgba(248,113,113,0.18)", color: "#fecaca" }}
                                  disabled={currentStatus === "4" || applicationAction === `4-${application._id}`}
                                  onClick={() => handleApplicationStatus(application, 4)}
                                >
                                  {currentStatus === "4" ? "Declined" : "Decline"}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="jdc-apply-note">This account can view the job details, but applying is reserved for worker accounts.</p>
                )}
              </div>
            </>
          )}

        </div>
      </div>
    </>
  );
}
