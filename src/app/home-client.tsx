"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Shell } from "@/components/Shell";
import { MapJobs } from "@/components/MapJobs";
import { JobDetailsDrawer } from "@/components/JobDetailsDrawer";
import { api } from "@/lib/api";
import { Job, normalizeJobs } from "@/lib/jobs";
import { useMe } from "@/lib/useMe";

type ViewMode = "map" | "list";
type MobileDeviceKind = "ios" | "android" | "other";

const MOBILE_APP_PROMPT_STORAGE_KEY = "gumboot_mobile_app_prompt_dismissed";
const MOBILE_DEVICE_STORAGE_KEY = "gumboot_mobile_device_info";
const MOBILE_APP_PROMPT_ENABLED = process.env.NEXT_PUBLIC_ENABLE_MOBILE_APP_PROMPT === "true";
const MOBILE_APP_URL = process.env.NEXT_PUBLIC_GUMBOOT_APP_URL ?? "";
const IOS_APP_URL = process.env.NEXT_PUBLIC_GUMBOOT_IOS_APP_URL ?? MOBILE_APP_URL;
const ANDROID_APP_URL = process.env.NEXT_PUBLIC_GUMBOOT_ANDROID_APP_URL ?? MOBILE_APP_URL;

const styles = `
  .hc-root * { box-sizing: border-box; }
  .hc-root {
    height: 100dvh;            /* ✅ lock page to viewport */
    width: 100%;
    overflow: hidden;          /* ✅ prevent popover/select reflow affecting layout */
    display: flex;
    flex-direction: column;
    font-family: 'DM Sans', sans-serif;
    color: #E5E5E5;
  }

  .hc-shell-wrap {
    flex: 1;
    min-height: 0;             /* ✅ critical for flex + map */
    overflow: hidden;
  }

  .hc-footer {
    flex-shrink: 0;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 14px;
    border-top: 1px solid rgba(229,229,229,0.10);
    background: rgba(30,37,41,0.55);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    color: rgba(229,229,229,0.45);
    font-size: 12px;
  }
  .hc-footer strong { color: rgba(229,229,229,0.78); font-weight: 700; }
  .hc-mobile-prompt {
    position: fixed;
    left: 14px;
    right: 14px;
    bottom: calc(16px + env(safe-area-inset-bottom, 0px));
    z-index: 45;
    border: 1px solid rgba(229,229,229,0.12);
    border-radius: 20px;
    background:
      radial-gradient(circle at top right, rgba(38,166,154,0.20), rgba(0,0,0,0) 52%),
      rgba(42,52,57,0.96);
    box-shadow: 0 18px 50px rgba(0,0,0,0.35);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    overflow: hidden;
  }
  .hc-mobile-prompt-inner {
    display: grid;
    gap: 12px;
    padding: 16px;
  }
  .hc-mobile-prompt-top {
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }
  .hc-mobile-prompt-icon {
    width: 46px;
    height: 46px;
    border-radius: 14px;
    border: 1px solid rgba(229,229,229,0.12);
    background: rgba(229,229,229,0.06);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: #E5E5E5;
  }
  .hc-mobile-prompt-copy {
    min-width: 0;
    flex: 1;
  }
  .hc-mobile-prompt-eyebrow {
    font-size: 10px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgba(229,229,229,0.38);
    margin: 0 0 6px;
  }
  .hc-mobile-prompt-title {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    color: #E5E5E5;
  }
  .hc-mobile-prompt-sub {
    margin: 6px 0 0;
    font-size: 12px;
    line-height: 1.55;
    color: rgba(229,229,229,0.60);
  }
  .hc-mobile-prompt-close {
    width: 34px;
    height: 34px;
    border: 1px solid rgba(229,229,229,0.10);
    border-radius: 12px;
    background: rgba(229,229,229,0.04);
    color: rgba(229,229,229,0.76);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    flex-shrink: 0;
  }
  .hc-mobile-prompt-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .hc-mobile-chip {
    display: inline-flex;
    align-items: center;
    min-height: 26px;
    padding: 0 10px;
    border-radius: 999px;
    border: 1px solid rgba(229,229,229,0.10);
    background: rgba(229,229,229,0.05);
    color: rgba(229,229,229,0.72);
    font-size: 11px;
  }
  .hc-mobile-prompt-actions {
    display: grid;
    gap: 10px;
    grid-template-columns: 1fr auto;
  }
  .hc-mobile-prompt-link,
  .hc-mobile-prompt-dismiss {
    min-height: 46px;
    border-radius: 14px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    text-decoration: none;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.10em;
    text-transform: uppercase;
    border: 1px solid rgba(229,229,229,0.10);
  }
  .hc-mobile-prompt-link {
    background: #26A69A;
    border-color: transparent;
    color: #fff;
    box-shadow: 0 10px 22px rgba(38,166,154,0.28);
  }
  .hc-mobile-prompt-dismiss {
    padding: 0 14px;
    background: rgba(229,229,229,0.05);
    color: rgba(229,229,229,0.82);
    cursor: pointer;
  }

  /* ── Left panel ── */
  .lp-root {
    height: 100%;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }
  .lp-header {
    padding: 18px 20px 14px;
    border-bottom: 1px solid rgba(229,229,229,0.10);
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
  }
  .lp-heading {
    font-family: 'DM Serif Display', serif;
    font-size: 20px;
    font-weight: 400;
    color: #E5E5E5;
    margin: 0;
    line-height: 1;
  }
  .lp-view-toggle {
    font-family: 'DM Sans', sans-serif;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    background: rgba(229,229,229,0.06);
    border: 1px solid rgba(229,229,229,0.14);
    color: rgba(229,229,229,0.50);
    padding: 6px 12px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.15s;
  }
  .lp-view-toggle:hover {
    background: rgba(229,229,229,0.12);
    border-color: rgba(229,229,229,0.24);
    color: rgba(229,229,229,0.88);
    transform: translateY(-1px);
  }

  .lp-status {
    padding: 10px 20px;
    border-bottom: 1px solid rgba(229,229,229,0.07);
    flex-shrink: 0;
    min-height: 36px;
    display: flex;
    align-items: center;
  }
  .lp-status-text {
    font-size: 11px;
    color: rgba(229,229,229,0.28);
    letter-spacing: 0.03em;
  }
  .lp-status-text.error { color: rgba(183,91,91,0.85); }
  .lp-status-count {
    font-size: 11px;
    color: rgba(38,166,154,0.80);
    letter-spacing: 0.04em;
    font-weight: 500;
  }

  .lp-jobs {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: rgba(229,229,229,0.10) transparent;
  }
  .lp-jobs::-webkit-scrollbar { width: 4px; }
  .lp-jobs::-webkit-scrollbar-track { background: transparent; }
  .lp-jobs::-webkit-scrollbar-thumb { background: rgba(229,229,229,0.10); border-radius: 2px; }

  .job-row {
    width: 100%;
    text-align: left;
    padding: 14px 20px;
    border: none;
    border-bottom: 1px solid rgba(229,229,229,0.06);
    background: transparent;
    cursor: pointer;
    transition: background 0.14s;
    display: block;
    color: inherit;
  }
  .job-row-inner {
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }
  .job-row-badge {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    border: 1px solid rgba(229,229,229,0.10);
    background: rgba(229,229,229,0.08);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    flex-shrink: 0;
  }
  .job-row-badge img {
    width: 28px;
    height: 28px;
    object-fit: contain;
    display: block;
  }
  .job-row-copy {
    min-width: 0;
    flex: 1;
  }
  .job-row:hover { background: rgba(229,229,229,0.05); }
  .job-row.selected {
    background: rgba(38,166,154,0.10);
    border-left: 2px solid #26A69A;
    padding-left: 18px;
  }

  .job-row-title {
    font-size: 13px;
    font-weight: 500;
    color: rgba(229,229,229,0.82);
    margin-bottom: 3px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .job-row.selected .job-row-title { color: #E5E5E5; }
  .job-row-type {
    font-size: 10px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgba(229,229,229,0.28);
    margin-bottom: 4px;
  }
  .job-row-meta {
    font-size: 11px;
    color: rgba(229,229,229,0.38);
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
  }
  .job-row-price { color: #26A69A; font-weight: 500; }
  .job-row-location { color: rgba(229,229,229,0.52); }
  .job-row-dot   { color: rgba(229,229,229,0.18); }
  .job-row-coords { color: rgba(229,229,229,0.26); font-variant-numeric: tabular-nums; }

  /* ── List view ── */
  .list-view-root {
    padding: 28px;
    min-height: 100%;
    width: 100%;
    background: transparent;
  }
  .list-view-heading {
    font-family: 'DM Serif Display', serif;
    font-size: 26px;
    font-weight: 400;
    color: #E5E5E5;
    margin: 0 0 24px;
  }
  .list-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 12px;
  }
  .list-card {
    border: 1px solid rgba(229,229,229,0.10);
    border-radius: 14px;
    padding: 18px;
    cursor: pointer;
    transition: all 0.15s;
    background: rgba(62,74,81,0.50);
  }
  .list-card:hover {
    background: rgba(62,74,81,0.80);
    border-color: rgba(229,229,229,0.18);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.25);
  }
  .list-card-title {
    font-size: 14px;
    font-weight: 500;
    color: rgba(229,229,229,0.88);
    margin-bottom: 5px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .list-card-type {
    font-size: 10px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgba(229,229,229,0.28);
    margin-bottom: 12px;
  }
  .list-card-price { font-size: 15px; font-weight: 600; color: #26A69A; }
  .list-card-price.unknown {
    font-size: 12px;
    color: rgba(229,229,229,0.28);
    font-weight: 300;
    font-style: italic;
  }

  /* Skeleton */
  @keyframes shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  .skeleton-row {
    padding: 14px 20px;
    border-bottom: 1px solid rgba(229,229,229,0.06);
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .skeleton-line {
    border-radius: 3px;
    background: linear-gradient(
      90deg,
      rgba(229,229,229,0.06) 25%,
      rgba(229,229,229,0.10) 50%,
      rgba(229,229,229,0.06) 75%
    );
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }
  @media (max-width: 760px) {
    .hc-footer {
      height: auto;
      min-height: 44px;
      padding: 10px 12px calc(10px + env(safe-area-inset-bottom, 0px));
      align-items: flex-start;
      flex-direction: column;
      gap: 4px;
    }
    .lp-header {
      padding: 16px 16px 12px;
    }
    .lp-heading {
      font-size: 18px;
    }
    .lp-status {
      padding: 10px 16px;
    }
    .job-row,
    .skeleton-row {
      padding-left: 16px;
      padding-right: 16px;
    }
    .job-row.selected {
      padding-left: 14px;
    }
    .job-row-badge {
      width: 44px;
      height: 44px;
      border-radius: 12px;
    }
    .list-view-root {
      padding: 88px 14px 18px;
    }
    .list-view-heading {
      font-size: 22px;
      margin-bottom: 18px;
    }
    .list-grid {
      grid-template-columns: 1fr;
      gap: 10px;
    }
    .list-card {
      padding: 16px;
      border-radius: 16px;
    }
    .hc-mobile-prompt-actions {
      grid-template-columns: 1fr;
    }
    .hc-mobile-prompt-dismiss {
      width: 100%;
    }
  }
`;

function detectMobileDevice(userAgent: string): MobileDeviceKind {
  const ua = userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  return "other";
}

function getMobilePromptConfig(deviceKind: MobileDeviceKind) {
  if (deviceKind === "ios") {
    return {
      title: "Take Gumboot with you",
      subtitle: "Install the iPhone app for a smoother sign-up and faster job browsing on the go.",
      ctaLabel: "Open App Store",
      href: IOS_APP_URL,
    };
  }
  if (deviceKind === "android") {
    return {
      title: "Get the Gumboot app",
      subtitle: "Use the Android app for a cleaner mobile flow, quicker job posting, and secure payments.",
      ctaLabel: "Open Google Play",
      href: ANDROID_APP_URL,
    };
  }
  return {
    title: "Prefer the app?",
    subtitle: "You are browsing on a mobile device. Install Gumboot for the most polished phone experience.",
    ctaLabel: "Open App Link",
    href: MOBILE_APP_URL,
  };
}

function resolveMediaUrl(path: string | undefined, apiOrigin: string): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path.startsWith("/")) return `${apiOrigin}${path}`;
  return `${apiOrigin}/${path}`;
}

function getJobTypeImageUrl(job: Job, apiOrigin: string) {
  return resolveMediaUrl(job.jobTypeIconPath || job.imageUrl || undefined, apiOrigin) || "/globe.svg";
}

function getLocationSummary(job: Job) {
  const raw = (job.raw ?? {}) as {
    suburb?: unknown;
    city?: unknown;
    address?: { suburb?: unknown; city?: unknown } | string | null;
  };
  const addressObject =
    raw.address && typeof raw.address === "object" && !Array.isArray(raw.address)
      ? raw.address
      : null;
  const suburb =
    typeof addressObject?.suburb === "string"
      ? addressObject.suburb
      : typeof raw.suburb === "string"
        ? raw.suburb
        : "";
  const city =
    typeof addressObject?.city === "string"
      ? addressObject.city
      : typeof raw.city === "string"
        ? raw.city
        : job.city || "";

  const cleanSuburb = suburb.trim();
  const cleanCity = city.trim();
  if (cleanSuburb && cleanCity) return `${cleanSuburb}, ${cleanCity}`;
  if (cleanCity) return cleanCity;
  if (cleanSuburb) return cleanSuburb;

  const addressText = (job.addressText ?? "").trim();
  if (!addressText) return "Location pending";
  const parts = addressText
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  return parts[0] || addressText;
}

export default function HomeClient() {
  const router = useRouter();
  useMe();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [mode, setMode] = useState<ViewMode>("map");
  const [error, setError] = useState<string | null>(null);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [selectedJobType, setSelectedJobType] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [mobileDeviceKind, setMobileDeviceKind] = useState<MobileDeviceKind>("other");
  const [showMobileAppPrompt, setShowMobileAppPrompt] = useState(false);

  const apiOrigin = useMemo(
    () => (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/api\/?$/, ""),
    []
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(max-width: 760px)");
    const sync = () => {
      const isMobile = media.matches;
      setIsMobileViewport(isMobile);
      setMode((current) => {
        if (isMobile && current === "map") return "list";
        return current;
      });
    };
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const deviceKind = detectMobileDevice(window.navigator.userAgent);
    setMobileDeviceKind(deviceKind);
    try {
      window.localStorage.setItem(
        MOBILE_DEVICE_STORAGE_KEY,
        JSON.stringify({
          deviceKind,
          userAgent: window.navigator.userAgent,
          screenWidth: window.innerWidth,
          screenHeight: window.innerHeight,
          recordedAt: new Date().toISOString(),
        })
      );
    } catch {
      // Ignore local storage failures in private mode or restricted browsers.
    }
  }, []);

  useEffect(() => {
    if (!MOBILE_APP_PROMPT_ENABLED || !isMobileViewport) {
      setShowMobileAppPrompt(false);
      return;
    }
    if (!(IOS_APP_URL || ANDROID_APP_URL || MOBILE_APP_URL)) {
      setShowMobileAppPrompt(false);
      return;
    }
    if (typeof window === "undefined") return;
    try {
      const dismissed = window.localStorage.getItem(MOBILE_APP_PROMPT_STORAGE_KEY) === "1";
      setShowMobileAppPrompt(!dismissed);
    } catch {
      setShowMobileAppPrompt(true);
    }
  }, [isMobileViewport]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingJobs(true);
        setError(null);
        const data = await api<unknown>("/home_job_listing", { method: "GET", auth: false });
        const normalized = normalizeJobs(data);
        if (mounted) setJobs(normalized);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Failed to load jobs";
        if (mounted) setError(message);
      } finally {
        if (mounted) setLoadingJobs(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const openJobDrawer = useCallback(
    (job: Job) => {
      if (isMobileViewport) {
        router.push(`/jobs/${job.id}`);
        return;
      }
      setSelectedJob(job);
      setIsDrawerOpen(true);
    },
    [isMobileViewport, router]
  );

  const closeJobDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    setSelectedJob(null);
  }, []);

  const onApply = useCallback(
    (jobId: string) => {
      router.push(`/jobs/${jobId}`);
    },
    [router]
  );

  const jobTypes = useMemo(() => {
    return Array.from(new Set(jobs.map((j) => j.jobTypeName || "General").filter(Boolean))).sort(
      (a, b) => a.localeCompare(b)
    );
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    const min = minPrice ? Number(minPrice) : null;
    const max = maxPrice ? Number(maxPrice) : null;

    return jobs.filter((job) => {
      const type = job.jobTypeName || "General";
      const matchesType = !selectedJobType || type === selectedJobType;

      const price = typeof job.price === "number" ? job.price : null;
      const matchesMin = min == null || (price != null && price >= min);
      const matchesMax = max == null || (price != null && price <= max);

      return matchesType && matchesMin && matchesMax;
    });
  }, [jobs, selectedJobType, minPrice, maxPrice]);

  const mobilePrompt = useMemo(() => getMobilePromptConfig(mobileDeviceKind), [mobileDeviceKind]);

  const dismissMobilePrompt = useCallback(() => {
    setShowMobileAppPrompt(false);
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(MOBILE_APP_PROMPT_STORAGE_KEY, "1");
    } catch {
      // Ignore local storage failures.
    }
  }, []);

  const leftPanel = useMemo(
    () => (
      <div className="lp-root">
        <div className="lp-header">
          <h2 className="lp-heading">Jobs</h2>
          <button className="lp-view-toggle" onClick={() => setMode((m) => (m === "map" ? "list" : "map"))}>
            {mode === "map" ? "List" : "Map"}
          </button>
        </div>

        <div className="lp-status">
          {error && <span className="lp-status-text error">{error}</span>}
          {!error && loadingJobs && <span className="lp-status-text">Loading…</span>}
          {!error && !loadingJobs && filteredJobs.length === 0 && (
            <span className="lp-status-text">No jobs found.</span>
          )}
          {!error && !loadingJobs && filteredJobs.length > 0 && (
            <span className="lp-status-count">{filteredJobs.length} jobs available</span>
          )}
        </div>

        <div className="lp-jobs">
          {loadingJobs
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton-row">
                  <div className="skeleton-line" style={{ width: `${55 + (i % 3) * 15}%`, height: 12 }} />
                  <div className="skeleton-line" style={{ width: "30%", height: 9 }} />
                  <div className="skeleton-line" style={{ width: "45%", height: 9 }} />
                </div>
              ))
            : filteredJobs.map((j) => (
                <button
                  key={j.id}
                  onClick={() => openJobDrawer(j)}
                  className={`job-row${selectedJob?.id === j.id ? " selected" : ""}`}
                >
                  <div className="job-row-inner">
                    <div className="job-row-badge" aria-hidden="true">
                      <img src={getJobTypeImageUrl(j, apiOrigin)} alt="" />
                    </div>
                    <div className="job-row-copy">
                      <div className="job-row-title">{j.title}</div>
                      <div className="job-row-type">{j.jobTypeName || "General"}</div>
                      <div className="job-row-meta">
                        <span className="job-row-location">{getLocationSummary(j)}</span>
                        <span className="job-row-dot">·</span>
                        <span className="job-row-price">{j.price != null ? `$${j.price}` : "—"}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
        </div>
      </div>
    ),
    [filteredJobs, selectedJob, mode, error, loadingJobs, openJobDrawer, apiOrigin]
  );

  return (
    <>
      <style>{styles}</style>

      <div className="hc-root">
        {showMobileAppPrompt && mobilePrompt.href ? (
          <div className="hc-mobile-prompt" role="dialog" aria-label="Download the Gumboot app">
            <div className="hc-mobile-prompt-inner">
              <div className="hc-mobile-prompt-top">
                <div className="hc-mobile-prompt-icon" aria-hidden="true">
                  {mobileDeviceKind === "ios" ? (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M15.2 4.1c.8-.9 1.2-2 1.1-3.1-1.1.1-2.3.7-3 1.6-.7.8-1.3 2-1.1 3 .5 0 1.1-.1 1.6-.3.5-.2 1-.6 1.4-1.2Zm2.8 8.1c0-2.1 1.7-3.1 1.8-3.2-1-1.4-2.5-1.6-3-1.6-1.3-.1-2.5.8-3.1.8-.6 0-1.6-.8-2.7-.8-1.4 0-2.7.8-3.4 2-.7 1.2-.9 3.2 0 5.1.8 1.7 1.8 3.6 3.1 3.6.6 0 .9-.2 1.4-.4.5-.2 1-.4 1.8-.4.7 0 1.2.2 1.7.4.5.2.9.4 1.5.4 1.3 0 2.2-1.8 2.9-3.5.4-1 .6-1.5.9-2.6-.1 0-2.9-1.1-2.9-3.8Z"
                        fill="currentColor"
                      />
                    </svg>
                  ) : (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M7.2 6.3 9 9.4l3-5.1a.8.8 0 0 1 1.4 0l3 5.1 1.8-3.1a.8.8 0 0 1 1.4.8l-2.2 3.8 2.2 3.8a.8.8 0 1 1-1.4.8l-1.8-3.1-3 5.1a.8.8 0 0 1-1.4 0l-3-5.1-1.8 3.1a.8.8 0 1 1-1.4-.8L8.1 11 5.8 7.1a.8.8 0 0 1 1.4-.8Zm4 4.7-2.2 3.8h6L12.8 11l-.8-1.4-.8 1.4Z"
                        fill="currentColor"
                      />
                    </svg>
                  )}
                </div>
                <div className="hc-mobile-prompt-copy">
                  <p className="hc-mobile-prompt-eyebrow">Mobile download</p>
                  <h2 className="hc-mobile-prompt-title">{mobilePrompt.title}</h2>
                  <p className="hc-mobile-prompt-sub">{mobilePrompt.subtitle}</p>
                </div>
                <button
                  type="button"
                  className="hc-mobile-prompt-close"
                  aria-label="Close app download prompt"
                  onClick={dismissMobilePrompt}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <div className="hc-mobile-prompt-meta">
                <span className="hc-mobile-chip">
                  Device: {mobileDeviceKind === "ios" ? "iPhone / iPad" : mobileDeviceKind === "android" ? "Android" : "Mobile browser"}
                </span>
                <span className="hc-mobile-chip">Better on phones</span>
              </div>
              <div className="hc-mobile-prompt-actions">
                <a className="hc-mobile-prompt-link" href={mobilePrompt.href} target="_blank" rel="noreferrer">
                  <span>{mobilePrompt.ctaLabel}</span>
                </a>
                <button type="button" className="hc-mobile-prompt-dismiss" onClick={dismissMobilePrompt}>
                  Not now
                </button>
              </div>
            </div>
          </div>
        ) : null}
        <div className="hc-shell-wrap">
          <Shell
            left={leftPanel}
            jobTypes={jobTypes}
            selectedJobType={selectedJobType}
            onSelectedJobTypeChange={setSelectedJobType}
            minPrice={minPrice}
            maxPrice={maxPrice}
            onMinPriceChange={setMinPrice}
            onMaxPriceChange={setMaxPrice}
            onClearFilters={() => {
              setSelectedJobType("");
              setMinPrice("");
              setMaxPrice("");
            }}
          >
            {mode === "map" ? (
              <MapJobs jobs={filteredJobs} onSelect={openJobDrawer} />
            ) : (
              <div className="list-view-root">
                <h1 className="list-view-heading">All Jobs</h1>
                <div className="list-grid">
                  {filteredJobs.map((j) => (
                    <div key={j.id} className="list-card" onClick={() => openJobDrawer(j)}>
                      <div className="list-card-title">{j.title}</div>
                      <div className="list-card-type">{j.jobTypeName || "General"}</div>
                      <div className={`list-card-price${j.price == null ? " unknown" : ""}`}>
                        {j.price != null ? `$${j.price}` : "Price unknown"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <JobDetailsDrawer
              open={isDrawerOpen}
              job={selectedJob}
              apiOrigin={apiOrigin}
              onClose={closeJobDrawer}
              onApply={onApply}
            />
          </Shell>
        </div>

        <footer className="hc-footer">
          <div>
            <strong>Gumboot</strong> · browse jobs
          </div>
          <div>{filteredJobs.length} showing</div>
        </footer>
      </div>
    </>
  );
}
