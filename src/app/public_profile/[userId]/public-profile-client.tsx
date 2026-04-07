"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createJobInterest } from "@/lib/interests";
import { resolveUserImageUrl } from "@/lib/messages";
import {
  fetchPublicProfile,
  fetchPublicReviews,
  fetchWorkerCompletedJobs,
  fetchWorkerPublicProfile,
  type PublicProfileJob,
  type PublicProfileReview,
  type PublicProfileUser,
  type ResolvedPublicProfile,
  type WorkerPublicProfileBody,
  type WorkerCompletedJob,
} from "@/lib/publicProfiles";

type MobileDeviceKind = "ios" | "android" | "other";

const MOBILE_PROFILE_PROMPT_STORAGE_KEY = "gumboot_public_profile_mobile_prompt_dismissed";
const MOBILE_APP_URL = process.env.NEXT_PUBLIC_GUMBOOT_APP_URL ?? "";
const IOS_APP_URL = process.env.NEXT_PUBLIC_GUMBOOT_IOS_APP_URL ?? MOBILE_APP_URL;
const ANDROID_APP_URL = process.env.NEXT_PUBLIC_GUMBOOT_ANDROID_APP_URL ?? MOBILE_APP_URL;

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Manrope:wght@400;500;600;700;800&display=swap');

  .pubp-root * { box-sizing: border-box; }
  .pubp-root {
    min-height: calc(100dvh - 56px);
    padding: 20px 14px 72px;
    color: #E5E5E5;
    font-family: 'Manrope', sans-serif;
    background:
      radial-gradient(900px 540px at 8% 0%, rgba(91,110,127,0.18), transparent 60%),
      linear-gradient(180deg, #2A3439 0%, #243036 100%);
  }

  .pubp-shell {
    max-width: 1120px;
    margin: 0 auto;
    display: grid;
    gap: 18px;
  }

  .pubp-profile-layout {
    display: grid;
    gap: 18px;
  }

  @media (min-width: 980px) {
    .pubp-profile-layout {
      grid-template-columns: minmax(0, 1fr) 320px;
      align-items: start;
    }
  }

  .pubp-back-link {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    width: fit-content;
    color: rgba(229,229,229,0.65);
    text-decoration: none;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  .pubp-back-link:hover { color: #E5E5E5; }

  .pubp-status,
  .pubp-panel {
    border: 1px solid rgba(229,229,229,0.10);
    border-radius: 28px;
    background: rgba(62,74,81,0.82);
    box-shadow: 0 18px 50px rgba(0,0,0,0.28);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }

  .pubp-status {
    padding: 22px;
    text-align: center;
  }

  .pubp-status p {
    margin: 0;
    font-size: 14px;
    line-height: 1.7;
    color: rgba(229,229,229,0.52);
  }

  .pubp-status.error p { color: #9d3b24; }

  .pubp-hero {
    overflow: hidden;
  }

  .pubp-hero-top {
    min-height: 220px;
    padding: 24px;
    background:
      linear-gradient(135deg, rgba(255, 184, 107, 0.16), transparent 30%),
      radial-gradient(circle at top right, rgba(120, 141, 157, 0.22), transparent 34%),
      linear-gradient(135deg, rgba(80, 95, 104, 0.92) 0%, rgba(58, 70, 77, 0.92) 100%);
    border-bottom: 1px solid rgba(229,229,229,0.08);
  }

  .pubp-kicker {
    margin: 0 0 10px;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: rgba(229,229,229,0.40);
  }

  .pubp-headline {
    display: grid;
    gap: 18px;
    height: 100%;
    align-content: space-between;
  }

  @media (min-width: 900px) {
    .pubp-headline {
      grid-template-columns: minmax(0, 1.2fr) 260px;
      align-items: start;
    }
  }

  .pubp-title {
    margin: 0;
    font-family: 'Fraunces', serif;
    font-size: clamp(2.1rem, 5vw, 3.6rem);
    font-weight: 600;
    line-height: 0.96;
    letter-spacing: -0.03em;
  }

  .pubp-subtitle {
    margin: 12px 0 0;
    max-width: 620px;
    font-size: 15px;
    line-height: 1.75;
    color: rgba(229,229,229,0.58);
  }

  .pubp-stat-band {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
    max-width: 340px;
  }

  .pubp-stat {
    border-radius: 22px;
    padding: 16px;
    background: rgba(229,229,229,0.06);
    border: 1px solid rgba(229,229,229,0.08);
  }

  .pubp-stat-label {
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: rgba(229,229,229,0.34);
  }

  .pubp-stat-value {
    margin-top: 8px;
    font-size: 27px;
    font-weight: 800;
    line-height: 1;
    color: #E5E5E5;
  }

  .pubp-stat-helper {
    margin-top: 6px;
    font-size: 12px;
    color: rgba(229,229,229,0.48);
  }

  .pubp-hero-body {
    padding: 0 24px 24px;
    display: grid;
    gap: 20px;
  }

  .pubp-profile-main {
    display: grid;
    gap: 20px;
  }

  .pubp-identity {
    display: flex;
    align-items: flex-start;
    gap: 18px;
    margin-top: -52px;
    position: relative;
    z-index: 1;
  }

  .pubp-avatar {
    width: 144px;
    height: 144px;
    border-radius: 50%;
    overflow: hidden;
    flex-shrink: 0;
    border: 5px solid #2A3439;
    background: linear-gradient(135deg, #3E4A51, #5B6E7F);
    display: grid;
    place-items: center;
    box-shadow: 0 20px 38px rgba(0,0,0,0.3);
  }

  .pubp-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .pubp-avatar-fallback {
    font-size: 42px;
    font-weight: 800;
    letter-spacing: 0.02em;
    color: rgba(229,229,229,0.78);
  }

  .pubp-identity-copy {
    min-width: 0;
    padding-top: 68px;
  }

  .pubp-name {
    margin: 0;
    font-family: 'Fraunces', serif;
    font-size: clamp(2rem, 4vw, 2.8rem);
    font-weight: 600;
    line-height: 1;
    letter-spacing: -0.03em;
  }

  .pubp-label-row {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 8px;
  }

  .pubp-pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 34px;
    border-radius: 999px;
    padding: 0 14px;
    background: rgba(229,229,229,0.06);
    border: 1px solid rgba(229,229,229,0.10);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: rgba(229,229,229,0.65);
  }

  .pubp-bio {
    margin: 0;
    font-size: 15px;
    line-height: 1.8;
    color: rgba(229,229,229,0.72);
    white-space: pre-wrap;
  }

  .pubp-intro-card,
  .pubp-side-card {
    border-radius: 24px;
    background: rgba(229,229,229,0.04);
    border: 1px solid rgba(229,229,229,0.10);
    padding: 18px;
  }

  .pubp-side-card {
    display: grid;
    gap: 14px;
  }

  @media (min-width: 980px) {
    .pubp-side-card {
      position: sticky;
      top: 76px;
    }
  }

  .pubp-side-title {
    margin: 0;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgba(229,229,229,0.40);
  }

  .pubp-side-stat {
    border-radius: 18px;
    background: rgba(229,229,229,0.04);
    border: 1px solid rgba(229,229,229,0.08);
    padding: 14px;
  }

  .pubp-side-stat-value {
    margin-top: 6px;
    font-size: 24px;
    font-weight: 800;
    color: #E5E5E5;
  }

  .pubp-side-stat-copy {
    margin-top: 6px;
    font-size: 13px;
    line-height: 1.7;
    color: rgba(229,229,229,0.56);
    word-break: break-word;
  }

  .pubp-action-row {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  .pubp-action-btn,
  .pubp-route-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 46px;
    border-radius: 999px;
    padding: 0 18px;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    text-decoration: none;
  }

  .pubp-action-btn {
    border: none;
    background: linear-gradient(135deg, #f97316 0%, #fb923c 100%);
    color: #fff;
    cursor: pointer;
    box-shadow: 0 16px 28px rgba(249, 115, 22, 0.24);
  }

  .pubp-route-link {
    color: #E5E5E5;
    border: 1px solid rgba(229,229,229,0.12);
    background: rgba(229,229,229,0.08);
  }

  .pubp-feedback {
    margin: 0;
    font-size: 13px;
    color: #2b7f68;
  }

  .pubp-feed {
    display: grid;
    gap: 18px;
  }

  .pubp-section {
    padding: 22px;
  }

  .pubp-section-head {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 18px;
  }

  .pubp-section-title {
    margin: 0;
    font-family: 'Fraunces', serif;
    font-size: 24px;
    font-weight: 600;
    line-height: 1;
    letter-spacing: -0.02em;
  }

  .pubp-section-note {
    font-size: 12px;
    font-weight: 700;
    color: rgba(229,229,229,0.38);
  }

  .pubp-chip-wrap {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .pubp-chip {
    display: inline-flex;
    align-items: center;
    min-height: 38px;
    border-radius: 999px;
    padding: 0 14px;
    background: rgba(229,229,229,0.06);
    border: 1px solid rgba(229,229,229,0.10);
    font-size: 13px;
    font-weight: 600;
    color: rgba(229,229,229,0.82);
  }

  .pubp-list {
    display: grid;
    gap: 14px;
  }

  .pubp-review,
  .pubp-job {
    border-radius: 24px;
    background: rgba(229,229,229,0.04);
    border: 1px solid rgba(229,229,229,0.10);
    padding: 16px;
  }

  .pubp-review-head,
  .pubp-job-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }

  .pubp-review-author {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
  }

  .pubp-review-avatar {
    width: 46px;
    height: 46px;
    border-radius: 16px;
    overflow: hidden;
    border: 1px solid rgba(229,229,229,0.10);
    background: linear-gradient(135deg, #3E4A51, #5B6E7F);
    display: grid;
    place-items: center;
    flex-shrink: 0;
  }

  .pubp-review-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .pubp-review-name {
    font-size: 15px;
    font-weight: 800;
    color: #E5E5E5;
  }

  .pubp-review-role {
    margin-top: 3px;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgba(229,229,229,0.36);
  }

  .pubp-time {
    font-size: 12px;
    font-weight: 700;
    color: rgba(229,229,229,0.38);
    white-space: nowrap;
  }

  .pubp-stars {
    display: flex;
    gap: 4px;
    margin-top: 12px;
  }

  .pubp-star {
    font-size: 14px;
    line-height: 1;
    color: rgba(229,229,229,0.16);
  }

  .pubp-star.filled { color: #f59e0b; }

  .pubp-review-body,
  .pubp-job-copy {
    margin: 12px 0 0;
    font-size: 14px;
    line-height: 1.75;
    color: rgba(229,229,229,0.72);
    white-space: pre-wrap;
  }

  .pubp-job {
    display: grid;
    grid-template-columns: 88px minmax(0, 1fr);
    gap: 14px;
    align-items: start;
  }

  .pubp-job-media {
    width: 88px;
    height: 88px;
    border-radius: 22px;
    overflow: hidden;
    border: 1px solid rgba(229,229,229,0.10);
    background: rgba(229,229,229,0.05);
    display: grid;
    place-items: center;
  }

  .pubp-job-media img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .pubp-job-fallback {
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: rgba(229,229,229,0.28);
  }

  .pubp-job-title {
    margin: 0;
    font-size: 17px;
    font-weight: 800;
    color: #E5E5E5;
  }

  .pubp-job-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 10px;
  }

  .pubp-job-pill {
    display: inline-flex;
    align-items: center;
    min-height: 30px;
    border-radius: 999px;
    padding: 0 12px;
    font-size: 11px;
    font-weight: 700;
    color: rgba(229,229,229,0.68);
    background: rgba(229,229,229,0.04);
    border: 1px solid rgba(229,229,229,0.08);
  }

  .pubp-empty {
    border-radius: 22px;
    padding: 20px;
    background: rgba(229,229,229,0.04);
    border: 1px dashed rgba(229,229,229,0.14);
  }

  .pubp-empty p {
    margin: 0;
    font-size: 14px;
    line-height: 1.7;
    color: rgba(229,229,229,0.52);
  }

  .pubp-mobile-prompt {
    position: fixed;
    left: 14px;
    right: 14px;
    bottom: calc(16px + env(safe-area-inset-bottom, 0px));
    z-index: 70;
    border: 1px solid rgba(229,229,229,0.12);
    border-radius: 22px;
    background:
      radial-gradient(circle at top right, rgba(249,115,22,0.18), rgba(0,0,0,0) 48%),
      rgba(42,52,57,0.96);
    box-shadow: 0 22px 52px rgba(0,0,0,0.38);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    overflow: hidden;
  }

  .pubp-mobile-prompt-inner {
    display: grid;
    gap: 14px;
    padding: 16px;
  }

  .pubp-mobile-prompt-top {
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }

  .pubp-mobile-prompt-icon {
    width: 44px;
    height: 44px;
    border-radius: 14px;
    flex-shrink: 0;
    display: grid;
    place-items: center;
    background: rgba(249,115,22,0.16);
    color: #ffd7b4;
  }

  .pubp-mobile-prompt-copy {
    min-width: 0;
    flex: 1;
  }

  .pubp-mobile-prompt-eyebrow {
    margin: 0 0 6px;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: rgba(229,229,229,0.42);
  }

  .pubp-mobile-prompt-title {
    margin: 0;
    font-size: 20px;
    font-weight: 800;
    line-height: 1.1;
    color: #fff;
  }

  .pubp-mobile-prompt-sub {
    margin: 8px 0 0;
    font-size: 13px;
    line-height: 1.7;
    color: rgba(229,229,229,0.64);
  }

  .pubp-mobile-prompt-close {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    border: 1px solid rgba(229,229,229,0.12);
    background: rgba(229,229,229,0.06);
    color: rgba(229,229,229,0.76);
    display: grid;
    place-items: center;
    flex-shrink: 0;
    cursor: pointer;
  }

  .pubp-mobile-prompt-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .pubp-mobile-chip {
    display: inline-flex;
    align-items: center;
    min-height: 30px;
    border-radius: 999px;
    padding: 0 12px;
    font-size: 11px;
    font-weight: 700;
    color: rgba(229,229,229,0.74);
    border: 1px solid rgba(229,229,229,0.1);
    background: rgba(229,229,229,0.05);
  }

  .pubp-mobile-prompt-actions {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 10px;
  }

  .pubp-mobile-prompt-link,
  .pubp-mobile-prompt-dismiss {
    min-height: 48px;
    border-radius: 14px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .pubp-mobile-prompt-link {
    color: #fff;
    background: linear-gradient(135deg, #f97316 0%, #fb923c 100%);
    box-shadow: 0 16px 28px rgba(249, 115, 22, 0.24);
  }

  .pubp-mobile-prompt-dismiss {
    border: 1px solid rgba(229,229,229,0.12);
    background: rgba(229,229,229,0.06);
    color: rgba(229,229,229,0.84);
    padding: 0 16px;
    cursor: pointer;
  }

  @media (max-width: 760px) {
    .pubp-root {
      padding-bottom: 132px;
    }

    .pubp-mobile-prompt-actions {
      grid-template-columns: 1fr;
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
      title: "Download the app",
      subtitle: "Gumboot works better on iPhone for browsing profiles, messaging, and managing jobs on the go.",
      ctaLabel: "Open App Store",
      href: IOS_APP_URL,
    };
  }
  if (deviceKind === "android") {
    return {
      title: "Download the app",
      subtitle: "Gumboot is smoother on Android for profile viewing, chat, and faster mobile job flow.",
      ctaLabel: "Open Google Play",
      href: ANDROID_APP_URL,
    };
  }
  return {
    title: "Download the app",
    subtitle: "You are on a mobile device and the app gives a better experience for profiles, chat, and job actions.",
    ctaLabel: "Open App Link",
    href: MOBILE_APP_URL,
  };
}

function formatDate(value?: string) {
  if (!value) return "Recently";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatTimeAgo(value?: string) {
  if (!value) return "Recently";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";

  const diffMs = Date.now() - date.getTime();
  if (diffMs <= 0) return "Just now";

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;
  const month = 30 * day;
  const year = 365 * day;
  const formatUnit = (count: number, unit: string) => `${count} ${unit}${count === 1 ? "" : "s"} ago`;

  if (diffMs < hour) return formatUnit(Math.max(1, Math.floor(diffMs / minute)), "minute");
  if (diffMs < day) return formatUnit(Math.floor(diffMs / hour), "hour");
  if (diffMs < week) return formatUnit(Math.floor(diffMs / day), "day");
  if (diffMs < month) return formatUnit(Math.floor(diffMs / week), "week");
  if (diffMs < year) return formatUnit(Math.floor(diffMs / month), "month");
  return formatUnit(Math.floor(diffMs / year), "year");
}

function getInitials(user?: PublicProfileUser | null) {
  const first = user?.firstname?.trim() ?? "";
  const last = user?.lastname?.trim() ?? "";
  return `${first[0] ?? ""}${last[0] ?? ""}`.trim().toUpperCase() || "GB";
}

function getFullName(user?: PublicProfileUser | null) {
  return [user?.firstname, user?.lastname].filter(Boolean).join(" ").trim() || "Unknown user";
}

function normalizeTools(user?: PublicProfileUser | null) {
  if (!Array.isArray(user?.tools)) return [];
  return user.tools
    .map((tool) => {
      if (typeof tool === "string") return tool.trim();
      return tool?.tool_name?.trim() || tool?.name?.trim() || "";
    })
    .filter(Boolean);
}

function getRatingValue(value?: string | number) {
  const parsed = typeof value === "string" ? Number(value) : value ?? 0;
  return Number.isFinite(parsed) ? parsed : 0;
}

function getReviewSummary(reviews: PublicProfileReview[]) {
  if (!reviews.length) return { count: 0, averageRating: 0 };
  const count = reviews.length;
  const total = reviews.reduce((sum, review) => sum + getRatingValue(review.rating), 0);
  return { count, averageRating: count > 0 ? total / count : 0 };
}

function getJobImage(job?: PublicProfileJob | null) {
  const path = Array.isArray(job?.image) ? job.image[0]?.url : "";
  return resolveUserImageUrl(path);
}

function getJobTypeName(job?: PublicProfileJob | null) {
  if (!job?.job_type) return "";
  return typeof job.job_type === "string" ? job.job_type : job.job_type?.name ?? "";
}

function getJobPrice(job?: PublicProfileJob | null) {
  const value = job?.offered_price ?? job?.price;
  if (value == null || value === "") return "Price unavailable";
  return `$${value}`;
}

function extractCompletedJob(item?: PublicProfileJob | WorkerCompletedJob | null) {
  if (!item) return null;
  if ("jobId" in item) {
    return item.jobId ?? null;
  }
  return item;
}

function normalizeCompletedJobs(
  profile: ResolvedPublicProfile | null,
  workerProfileBody: WorkerPublicProfileBody | null,
  workerJobs: WorkerCompletedJob[]
) {
  if (!profile) return [];

  const workerProfileCompletedJobs = (workerProfileBody?.completedJobs ?? [])
    .map((item) => item?.jobId)
    .filter((job): job is PublicProfileJob => Boolean(job));

  if (workerProfileCompletedJobs.length > 0) {
    return workerProfileCompletedJobs;
  }

  if (profile.source === "worker") {
    const directJobs = workerJobs
      .map(extractCompletedJob)
      .filter((job): job is PublicProfileJob => Boolean(job));

    if (directJobs.length > 0) return directJobs;

    return (profile.body.completedJobs ?? [])
      .map(extractCompletedJob)
      .filter((job): job is PublicProfileJob => Boolean(job));
  }

  return profile.body.completedJobs ?? [];
}

function normalizeRoleLabel(role?: string | number) {
  if (role == null || role === "") return "Review";
  if (String(role) === "1") return "Client review";
  if (String(role) === "2") return "Worker review";
  return "Review";
}

export default function PublicProfileClient({ userId }: { userId: string }) {
  const searchParams = useSearchParams();
  const jobId = searchParams.get("jobId") ?? "";

  const [profile, setProfile] = useState<ResolvedPublicProfile | null>(null);
  const [reviews, setReviews] = useState<PublicProfileReview[]>([]);
  const [reviewsTotalCount, setReviewsTotalCount] = useState(0);
  const [completedJobs, setCompletedJobs] = useState<PublicProfileJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [interestMessage, setInterestMessage] = useState<string | null>(null);
  const [mobileDeviceKind, setMobileDeviceKind] = useState<MobileDeviceKind>("other");
  const [showMobilePrompt, setShowMobilePrompt] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const loadedProfile = await fetchPublicProfile(userId, jobId);
        const targetUserId = loadedProfile.user?._id ?? userId;

        const [reviewsResponse, workerProfileResponse, workerJobsResponse] = await Promise.all([
          fetchPublicReviews(targetUserId).catch((reviewsError) => {
            console.warn("[public-profile] review_listing request failed", {
              userId: targetUserId,
              error: reviewsError,
            });
            return null;
          }),
          fetchWorkerPublicProfile(targetUserId, jobId).catch(() => null),
          loadedProfile.source === "worker"
            ? fetchWorkerCompletedJobs(targetUserId).catch(() => null)
            : Promise.resolve(null),
        ]);

        if (cancelled) return;

        setProfile(loadedProfile);
        setReviews(reviewsResponse?.body?.reviewData ?? []);
        setReviewsTotalCount(reviewsResponse?.body?.totalCount ?? reviewsResponse?.body?.reviewData?.length ?? 0);
        setCompletedJobs(
          normalizeCompletedJobs(
            loadedProfile,
            workerProfileResponse?.body ?? null,
            workerJobsResponse?.body?.findcompletedjob ?? []
          )
        );
      } catch (loadError) {
        if (cancelled) return;
        setError(loadError instanceof Error ? loadError.message : "Failed to load this profile.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [jobId, userId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (process.env.NODE_ENV !== "production") return;

    const media = window.matchMedia("(max-width: 760px)");
    const deviceKind = detectMobileDevice(window.navigator.userAgent);
    setMobileDeviceKind(deviceKind);

    const syncPrompt = () => {
      const hasMobileLink = Boolean(IOS_APP_URL || ANDROID_APP_URL || MOBILE_APP_URL);
      if (!media.matches || !hasMobileLink) {
        setShowMobilePrompt(false);
        return;
      }

      try {
        const dismissed = window.localStorage.getItem(MOBILE_PROFILE_PROMPT_STORAGE_KEY) === "1";
        setShowMobilePrompt(!dismissed);
      } catch {
        setShowMobilePrompt(true);
      }
    };

    syncPrompt();
    media.addEventListener("change", syncPrompt);
    return () => media.removeEventListener("change", syncPrompt);
  }, []);

  const person = profile?.user ?? null;
  const fullName = useMemo(() => getFullName(person), [person]);
  const avatarSrc = useMemo(() => resolveUserImageUrl(person?.image), [person?.image]);
  const skills = useMemo(
    () => (Array.isArray(person?.skill) ? person.skill.map((entry) => entry.name?.trim() ?? "").filter(Boolean) : []),
    [person?.skill]
  );
  const tools = useMemo(() => normalizeTools(person), [person]);
  const rating = profile?.body.ratingdata;
  const derivedReviewSummary = useMemo(() => getReviewSummary(reviews), [reviews]);
  const displayedReviewCount = reviewsTotalCount || reviews.length;
  const ratingAverage = reviews.length > 0
    ? derivedReviewSummary.averageRating
    : getRatingValue(rating?.averageRating);
  const ratingCount = reviews.length > 0
    ? displayedReviewCount
    : getRatingValue(rating?.count);
  const mobilePrompt = useMemo(() => getMobilePromptConfig(mobileDeviceKind), [mobileDeviceKind]);

  function dismissMobilePrompt() {
    setShowMobilePrompt(false);
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(MOBILE_PROFILE_PROMPT_STORAGE_KEY, "1");
    } catch {
      // Ignore localStorage failures in restricted browsers.
    }
  }

  async function saveReconnect() {
    try {
      setInterestMessage(null);
      await createJobInterest({
        workerId: userId,
        status: 1,
        type: 1,
      });
      setInterestMessage("Saved to your reconnect list.");
    } catch (nextError) {
      setInterestMessage(nextError instanceof Error ? nextError.message : "Unable to save reconnect preference.");
    }
  }

  return (
    <>
      <style>{styles}</style>
      <div className="pubp-root">
        {showMobilePrompt && mobilePrompt.href ? (
          <div className="pubp-mobile-prompt" role="dialog" aria-label="Download the Gumboot app">
            <div className="pubp-mobile-prompt-inner">
              <div className="pubp-mobile-prompt-top">
                <div className="pubp-mobile-prompt-icon" aria-hidden="true">
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
                <div className="pubp-mobile-prompt-copy">
                  <p className="pubp-mobile-prompt-eyebrow">Better on mobile</p>
                  <h2 className="pubp-mobile-prompt-title">{mobilePrompt.title}</h2>
                  <p className="pubp-mobile-prompt-sub">{mobilePrompt.subtitle}</p>
                </div>
                <button
                  type="button"
                  className="pubp-mobile-prompt-close"
                  aria-label="Close app download prompt"
                  onClick={dismissMobilePrompt}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <div className="pubp-mobile-prompt-meta">
                <span className="pubp-mobile-chip">
                  Device: {mobileDeviceKind === "ios" ? "iPhone / iPad" : mobileDeviceKind === "android" ? "Android" : "Mobile browser"}
                </span>
                <span className="pubp-mobile-chip">App-first experience</span>
              </div>
              <div className="pubp-mobile-prompt-actions">
                <a className="pubp-mobile-prompt-link" href={mobilePrompt.href} target="_blank" rel="noreferrer">
                  {mobilePrompt.ctaLabel}
                </a>
                <button type="button" className="pubp-mobile-prompt-dismiss" onClick={dismissMobilePrompt}>
                  Not now
                </button>
              </div>
            </div>
          </div>
        ) : null}
        <div className="pubp-shell">
          <Link className="pubp-back-link" href="/">
            <span>‹</span>
            <span>Back to app</span>
          </Link>

          {loading ? (
            <div className="pubp-status">
              <p>Loading profile details, reviews, and recent work…</p>
            </div>
          ) : null}

          {!loading && error ? (
            <div className="pubp-status error">
              <p>{error}</p>
            </div>
          ) : null}

          {!loading && !error && profile ? (
            <>
              <section className="pubp-panel pubp-hero">
                <div className="pubp-hero-top">
                  <div className="pubp-headline">
                    <div>
                      <p className="pubp-kicker">Public profile</p>
                      <h1 className="pubp-title">{fullName}</h1>
                      <p className="pubp-subtitle">
                        Reviews, completed jobs, and profile details are pulled from the latest public-facing
                        endpoints so this page matches the current app data more closely.
                      </p>
                    </div>
                    <div className="pubp-stat-band">
                      <div className="pubp-stat">
                        <div className="pubp-stat-label">Rating</div>
                        <div className="pubp-stat-value">{ratingAverage > 0 ? ratingAverage.toFixed(1) : "0.0"}</div>
                        <div className="pubp-stat-helper">
                          {ratingCount > 0 ? `${ratingCount} public review${ratingCount === 1 ? "" : "s"}` : "No reviews yet"}
                        </div>
                      </div>
                      <div className="pubp-stat">
                        <div className="pubp-stat-label">Completed jobs</div>
                        <div className="pubp-stat-value">{completedJobs.length}</div>
                        <div className="pubp-stat-helper">
                          {completedJobs.length > 0 ? "Visible work history" : "No completed jobs yet"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pubp-hero-body">
                  <div className="pubp-profile-main">
                    <div className="pubp-identity">
                      <div className="pubp-avatar" aria-hidden="true">
                        {avatarSrc ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={avatarSrc} alt={fullName} />
                        ) : (
                          <span className="pubp-avatar-fallback">{getInitials(person)}</span>
                        )}
                      </div>
                      <div className="pubp-identity-copy">
                        <h2 className="pubp-name">{fullName}</h2>
                        <div className="pubp-label-row">
                          <span className="pubp-pill">Profile</span>
                          <span className="pubp-pill">
                            <span>★</span>
                            <span>{ratingAverage > 0 ? ratingAverage.toFixed(1) : "0.0"}</span>
                          </span>
                          <span className="pubp-pill">
                            <span>{ratingCount}</span>
                            <span>reviews</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pubp-intro-card">
                      <div className="pubp-section-head">
                        <h2 className="pubp-section-title">Intro</h2>
                        <span className="pubp-section-note">Public details</span>
                      </div>
                      <p className="pubp-bio">{person?.bio?.trim() || "No bio added yet."}</p>
                    </div>

                    <div className="pubp-action-row">
                      {profile.canSaveReconnect ? (
                        <button className="pubp-action-btn" onClick={saveReconnect} type="button">
                          Save reconnect
                        </button>
                      ) : null}
                    </div>
                    {interestMessage ? <p className="pubp-feedback">{interestMessage}</p> : null}
                  </div>
                </div>
              </section>

              <div className="pubp-profile-layout">
                <div className="pubp-feed">
                  {skills.length > 0 ? (
                    <section className="pubp-panel pubp-section">
                      <div className="pubp-section-head">
                        <h2 className="pubp-section-title">Skills</h2>
                        <span className="pubp-section-note">Listed on this profile</span>
                      </div>
                      <div className="pubp-chip-wrap">
                        {skills.map((skill) => (
                          <span className="pubp-chip" key={skill}>{skill}</span>
                        ))}
                      </div>
                    </section>
                  ) : null}

                  {tools.length > 0 ? (
                    <section className="pubp-panel pubp-section">
                      <div className="pubp-section-head">
                        <h2 className="pubp-section-title">Tools</h2>
                        <span className="pubp-section-note">What they can bring</span>
                      </div>
                      <div className="pubp-chip-wrap">
                        {tools.map((tool) => (
                          <span className="pubp-chip" key={tool}>{tool}</span>
                        ))}
                      </div>
                    </section>
                  ) : null}

                  <section className="pubp-panel pubp-section">
                    <div className="pubp-section-head">
                      <h2 className="pubp-section-title">Reviews</h2>
                      <span className="pubp-section-note">
                        {ratingCount > 0 ? `${ratingCount} total` : "Public review feed"}
                      </span>
                    </div>

                    {reviews.length === 0 ? (
                      <div className="pubp-empty">
                        <p>No public reviews are available for this profile yet.</p>
                      </div>
                    ) : (
                      <div className="pubp-list">
                        {reviews.map((review) => {
                          const author = review.userId ?? null;
                          const reviewName = getFullName(author);
                          const reviewAvatar = resolveUserImageUrl(author?.image);
                          const reviewRating = getRatingValue(review.rating);

                          return (
                            <article className="pubp-review" key={review._id ?? `${reviewName}-${review.createdAt ?? ""}`}>
                              <div className="pubp-review-head">
                                <div className="pubp-review-author">
                                  <div className="pubp-review-avatar" aria-hidden="true">
                                    {reviewAvatar ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img src={reviewAvatar} alt={reviewName} />
                                    ) : (
                                      <span className="pubp-avatar-fallback" style={{ fontSize: "16px" }}>
                                        {getInitials(author)}
                                      </span>
                                    )}
                                  </div>
                                  <div>
                                    <div className="pubp-review-name">{reviewName}</div>
                                    <div className="pubp-review-role">{normalizeRoleLabel(review.rater_role)}</div>
                                  </div>
                                </div>
                                <div className="pubp-time">{formatTimeAgo(review.createdAt)}</div>
                              </div>

                              <div className="pubp-stars" aria-label={`${reviewRating} star rating`}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <span className={`pubp-star ${star <= Math.round(reviewRating) ? "filled" : ""}`} key={star}>★</span>
                                ))}
                              </div>

                              <p className="pubp-review-body">{review.comment?.trim() || "No written comment."}</p>
                            </article>
                          );
                        })}
                      </div>
                    )}
                  </section>

                  <section className="pubp-panel pubp-section">
                    <div className="pubp-section-head">
                      <h2 className="pubp-section-title">Completed jobs</h2>
                      <span className="pubp-section-note">
                        {completedJobs.length > 0 ? `${completedJobs.length} visible` : "Work history feed"}
                      </span>
                    </div>

                    {completedJobs.length === 0 ? (
                      <div className="pubp-empty">
                        <p>No completed jobs are available for this profile yet.</p>
                      </div>
                    ) : (
                      <div className="pubp-list">
                        {completedJobs.map((job, index) => {
                          const imageSrc = getJobImage(job);
                          const jobTitle = job?.job_title?.trim() || "Untitled job";
                          const jobTypeName = getJobTypeName(job);
                          const priceLabel = getJobPrice(job);

                          return (
                            <article className="pubp-job" key={job?._id ?? `${jobTitle}-${index}`}>
                              <div className="pubp-job-media" aria-hidden="true">
                                {imageSrc ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={imageSrc} alt={jobTitle} />
                                ) : (
                                  <span className="pubp-job-fallback">Job</span>
                                )}
                              </div>

                              <div>
                                <div className="pubp-job-head">
                                  <h3 className="pubp-job-title">{jobTitle}</h3>
                                  <div className="pubp-time">{formatDate(job?.createdAt)}</div>
                                </div>

                                <div className="pubp-job-meta">
                                  <span className="pubp-job-pill">{priceLabel}</span>
                                  {jobTypeName ? <span className="pubp-job-pill">{jobTypeName}</span> : null}
                                  {job?.job_status != null ? <span className="pubp-job-pill">Status {job.job_status}</span> : null}
                                </div>

                                {job?.description?.trim() ? (
                                  <p className="pubp-job-copy">{job.description}</p>
                                ) : null}
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    )}
                  </section>
                </div>

                <aside className="pubp-side-card">
                  <div className="pubp-section-head">
                    <h2 className="pubp-section-title">About</h2>
                    <span className="pubp-section-note">Quick summary</span>
                  </div>
                  <div className="pubp-side-stat">
                    <div className="pubp-side-title">Rating</div>
                    <div className="pubp-side-stat-value">{ratingAverage > 0 ? ratingAverage.toFixed(1) : "0.0"}</div>
                    <div className="pubp-side-stat-copy">
                      {ratingCount > 0 ? `${ratingCount} review${ratingCount === 1 ? "" : "s"} visible publicly.` : "No public reviews yet."}
                    </div>
                  </div>
                  <div className="pubp-side-stat">
                    <div className="pubp-side-title">Completed jobs</div>
                    <div className="pubp-side-stat-value">{completedJobs.length}</div>
                    <div className="pubp-side-stat-copy">
                      {completedJobs.length > 0 ? "Visible work history on this profile." : "No completed jobs visible yet."}
                    </div>
                  </div>
                  
                </aside>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}
