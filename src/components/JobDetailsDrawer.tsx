"use client";

import { useEffect, useMemo, useState } from "react";
import { Job } from "@/lib/jobs";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');

  :root{
    --teal-1:#1c8fb2;
    --teal-2:#2097bd;
    --panel:#f8fbfc;
    --text:#0f172a;
    --muted:#64748b;
    --muted-2:#94a3b8;
    --line:#e2e8f0;
    --chip:#ffffff;
    --chip-hover:#f1f5f9;
  }

  .jdd-root * { box-sizing: border-box; }
  .jdd-root { font-family: 'DM Sans', sans-serif; }

  /* Overlay */
  .jdd-overlay {
    position: fixed;
    inset: 0;
    z-index: 40;
    pointer-events: auto;
    background:
      radial-gradient(900px 500px at 20% 10%, rgba(255,255,255,0.12), rgba(255,255,255,0) 55%),
      rgba(18, 78, 100, 0.45);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    animation: jdd-fade-in 0.2s ease both;
  }
  @keyframes jdd-fade-in { from { opacity: 0; } to { opacity: 1; } }

  /* Mobile bottom sheet */
  .jdd-panel-mobile {
    position: absolute;
    bottom: 0; left: 0; right: 0;
    max-height: 88dvh;
    border-radius: 18px 18px 0 0;
    border: 1px solid rgba(255,255,255,0.20);
    border-bottom: none;
    background: linear-gradient(135deg, var(--teal-1), var(--teal-2));
    display: flex;
    flex-direction: column;
    overflow: hidden;
    animation: jdd-slide-up 0.28s cubic-bezier(0.32, 0.72, 0, 1) both;
    box-shadow: 0 -14px 40px rgba(18,78,100,0.35);
  }
  @keyframes jdd-slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }

  /* Desktop side drawer */
  .jdd-panel-desktop {
    position: absolute;
    right: 0; top: 0;
    height: 100%;
    width: 100%;
    max-width: 440px;
    border-left: 1px solid rgba(255,255,255,0.18);
    background: linear-gradient(135deg, var(--teal-1), var(--teal-2));
    display: flex;
    flex-direction: column;
    overflow: hidden;
    animation: jdd-slide-in 0.28s cubic-bezier(0.32, 0.72, 0, 1) both;
    box-shadow: -10px 0 44px rgba(18, 78, 100, 0.40);
  }
  @keyframes jdd-slide-in { from { transform: translateX(100%); } to { transform: translateX(0); } }

  @media (min-width: 768px) { .jdd-panel-mobile  { display: none; } }
  @media (max-width: 767px) { .jdd-panel-desktop { display: none; } }

  /* Handle */
  .jdd-handle {
    width: 38px;
    height: 4px;
    background: rgba(255,255,255,0.22);
    border-radius: 999px;
    margin: 12px auto 10px;
    flex-shrink: 0;
  }

  /* Header (teal) */
  .jdd-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 18px 18px 14px;
    flex-shrink: 0;
    color: #ffffff;
  }
  .jdd-header-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.55);
  }
  .jdd-close-btn {
    font-size: 16px;
    font-weight: 400;
    color: rgba(255,255,255,0.80);
    background: rgba(255,255,255,0.10);
    border: 1px solid rgba(255,255,255,0.18);
    width: 30px;
    height: 30px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: transform 0.12s, background 0.12s, border-color 0.12s;
    line-height: 1;
    padding: 0;
    font-family: inherit;
  }
  .jdd-close-btn:hover {
    transform: translateY(-1px);
    background: rgba(255,255,255,0.16);
    border-color: rgba(255,255,255,0.30);
  }

  /* Inner readable container (light card) */
  .jdd-surface {
    margin: 0 14px 14px;
    background: var(--panel);
    border: 1px solid rgba(255,255,255,0.40);
    border-radius: 16px;
    box-shadow:
      0 18px 48px rgba(0,0,0,0.10),
      0 8px 20px rgba(0,0,0,0.06);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  /* Scrollable body (inside surface) */
  .jdd-body {
    flex: 1;
    overflow-y: auto;
    padding: 22px 18px;
    scrollbar-width: thin;
    scrollbar-color: rgba(15,23,42,0.18) transparent;
    color: var(--text);
  }
  .jdd-body::-webkit-scrollbar { width: 4px; }
  .jdd-body::-webkit-scrollbar-track { background: transparent; }
  .jdd-body::-webkit-scrollbar-thumb { background: rgba(15,23,42,0.18); border-radius: 2px; }

  /* Title */
  .jdd-title {
    font-family: 'DM Serif Display', serif;
    font-size: 24px;
    font-weight: 400;
    color: var(--text);
    line-height: 1.2;
    margin: 0 0 8px;
  }
  .jdd-hero {
    display: flex;
    align-items: flex-start;
    gap: 14px;
  }
  .jdd-type-badge {
    width: 58px;
    height: 58px;
    border-radius: 16px;
    border: 1px solid var(--line);
    background: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    flex-shrink: 0;
    box-shadow: 0 10px 24px rgba(15,23,42,0.06);
  }
  .jdd-type-badge img {
    width: 34px;
    height: 34px;
    object-fit: contain;
    display: block;
  }
  .jdd-hero-copy {
    min-width: 0;
    flex: 1;
  }
  .jdd-type {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--muted);
    margin: 0 0 10px;
  }
  .jdd-top-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }
  .jdd-top-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    border-radius: 999px;
    padding: 7px 10px;
    border: 1px solid var(--line);
    background: #ffffff;
    font-size: 11px;
    color: rgba(15,23,42,0.72);
  }
  .jdd-top-chip.price {
    color: rgba(15,23,42,0.92);
    font-weight: 800;
    background: rgba(28,143,178,0.08);
    border-color: rgba(28,143,178,0.18);
  }
  .jdd-price {
    font-size: 20px;
    font-weight: 800;
    color: rgba(15,23,42,0.92);
    margin: 0;
  }
  .jdd-price.unknown {
    font-size: 13px;
    color: rgba(15,23,42,0.45);
    font-weight: 400;
    font-style: italic;
  }

  .jdd-divider {
    height: 1px;
    background: var(--line);
    margin: 18px 0;
  }

  /* Section label */
  .jdd-section-label {
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--muted);
    margin: 0 0 10px;
  }

  /* Location card */
  .jdd-location-card {
    border: 1px solid var(--line);
    border-radius: 12px;
    padding: 12px 14px;
    background: #ffffff;
  }
  .jdd-location-city {
    font-size: 13px;
    font-weight: 800;
    color: rgba(15,23,42,0.86);
    margin: 0 0 3px;
  }
  .jdd-location-addr {
    font-size: 12px;
    color: rgba(15,23,42,0.62);
    line-height: 1.5;
    margin: 0;
  }

  /* Schedule */
  .jdd-schedule-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .jdd-schedule-chip {
    font-size: 11px;
    color: rgba(15,23,42,0.74);
    background: var(--chip);
    border: 1px solid var(--line);
    border-radius: 999px;
    padding: 6px 10px;
  }
  .jdd-schedule-sep { color: rgba(15,23,42,0.25); font-size: 10px; }

  /* Description */
  .jdd-description {
    font-size: 13px;
    line-height: 1.8;
    color: rgba(15,23,42,0.72);
    font-weight: 400;
    white-space: pre-line;
    margin: 0;
  }

  /* Images */
  .jdd-images-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .jdd-image-btn{
    border: none;
    padding: 0;
    background: transparent;
    cursor: pointer;
    position: relative;
    border-radius: 12px;
    overflow: hidden;
    outline: none;
  }
  .jdd-image-btn:focus-visible{
    outline: 3px solid rgba(28,143,178,0.35);
    outline-offset: 2px;
  }
  .jdd-image {
    width: 100%;
    height: 118px;
    object-fit: cover;
    border-radius: 12px;
    border: 1px solid var(--line);
    display: block;
    background: #ffffff;
    transition: transform 0.18s ease, filter 0.18s ease;
  }
  .jdd-image-btn:hover .jdd-image{
    transform: scale(1.02);
    filter: saturate(1.05);
  }
  .jdd-image-overlay{
    position:absolute;
    inset:0;
    display:flex;
    align-items:flex-end;
    justify-content:flex-end;
    padding: 8px;
    pointer-events:none;
    opacity:0;
    transition: opacity .18s ease;
  }
  .jdd-image-btn:hover .jdd-image-overlay{ opacity:1; }
  .jdd-image-pill{
    font-size: 10px;
    font-weight: 800;
    letter-spacing: .10em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.92);
    background: rgba(15,23,42,0.45);
    border: 1px solid rgba(255,255,255,0.20);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    padding: 6px 8px;
    border-radius: 999px;
  }

  .jdd-no-images {
    border: 1px solid var(--line);
    border-radius: 12px;
    padding: 14px;
    text-align: center;
    font-size: 12px;
    color: rgba(15,23,42,0.45);
    font-style: italic;
    background: #ffffff;
  }

  /* Rating */
  .jdd-rating-row { display: flex; align-items: center; gap: 10px; }
  .jdd-rating-stars { display: flex; gap: 2px; }
  .jdd-star { font-size: 13px; line-height: 1; }
  .jdd-star.filled { color: rgba(15,23,42,0.86); }
  .jdd-star.empty  { color: rgba(15,23,42,0.18); }
  .jdd-rating-value { font-size: 14px; font-weight: 800; color: rgba(15,23,42,0.92); }
  .jdd-rating-count { font-size: 12px; color: var(--muted-2); }

  /* Footer (inside surface) */
  .jdd-footer {
    padding: 14px 18px 18px;
    border-top: 1px solid var(--line);
    background: rgba(248,251,252,0.92);
    flex-shrink: 0;
  }
  .jdd-apply-btn {
    font-family: 'DM Sans', sans-serif;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.10em;
    text-transform: uppercase;
    width: 100%;
    padding: 14px;
    border-radius: 12px;
    border: none;
    background: linear-gradient(135deg, var(--teal-1), var(--teal-2));
    color: #ffffff;
    cursor: pointer;
    transition: transform 0.10s, filter 0.12s;
  }
  .jdd-apply-btn:hover  { filter: brightness(1.02); }
  .jdd-apply-btn:active { transform: scale(0.99); }

  @media (max-width: 420px) {
    .jdd-surface { margin: 0 10px 10px; border-radius: 14px; }
    .jdd-body { padding: 18px 14px; }
  }

  /* ============================
     Image Viewer (Lightbox)
     ============================ */

  .jiv-overlay{
    position: fixed;
    inset: 0;
    z-index: 80; /* above drawer overlay */
    background: rgba(2,6,23,0.72);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    display:flex;
    align-items:center;
    justify-content:center;
    padding: 18px;
    animation: jiv-fade .16s ease both;
  }
  @keyframes jiv-fade { from{ opacity:0 } to{ opacity:1 } }

  .jiv-card{
    width: min(980px, 100%);
    height: min(720px, 100%);
    border-radius: 18px;
    border: 1px solid rgba(255,255,255,0.14);
    background:
      radial-gradient(900px 520px at 20% 10%, rgba(32,151,189,0.18), rgba(0,0,0,0) 55%),
      rgba(15,23,42,0.35);
    box-shadow: 0 26px 70px rgba(0,0,0,0.55);
    overflow:hidden;
    display:flex;
    flex-direction:column;
  }

  .jiv-topbar{
    display:flex;
    align-items:center;
    justify-content:space-between;
    padding: 12px 12px;
    border-bottom: 1px solid rgba(255,255,255,0.10);
    color: rgba(255,255,255,0.90);
    flex-shrink:0;
  }
  .jiv-title{
    font-size: 11px;
    font-weight: 800;
    letter-spacing: .12em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.70);
    padding-left: 6px;
    white-space: nowrap;
    overflow:hidden;
    text-overflow: ellipsis;
    max-width: 60%;
  }

  .jiv-btn{
    border: 1px solid rgba(255,255,255,0.16);
    background: rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.92);
    width: 36px;
    height: 36px;
    border-radius: 12px;
    cursor: pointer;
    display:flex;
    align-items:center;
    justify-content:center;
    transition: transform .12s ease, background .12s ease, border-color .12s ease;
  }
  .jiv-btn:hover{
    transform: translateY(-1px);
    background: rgba(255,255,255,0.12);
    border-color: rgba(255,255,255,0.24);
  }
  .jiv-btn:active{ transform: translateY(0); }

  .jiv-main{
    flex:1;
    min-height:0;
    display:flex;
    align-items:center;
    justify-content:center;
    position:relative;
    padding: 14px;
  }

  .jiv-img{
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    border-radius: 16px;
    border: 1px solid rgba(255,255,255,0.10);
    background: rgba(255,255,255,0.03);
  }

  .jiv-nav{
    position:absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 44px;
    height: 44px;
    border-radius: 14px;
  }
  .jiv-prev{ left: 12px; }
  .jiv-next{ right: 12px; }

  .jiv-footer{
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap: 10px;
    padding: 12px 14px;
    border-top: 1px solid rgba(255,255,255,0.10);
    color: rgba(255,255,255,0.70);
    flex-shrink:0;
  }
  .jiv-counter{
    font-size: 12px;
    font-weight: 700;
    letter-spacing: .02em;
  }
  .jiv-dots{
    display:flex;
    gap: 6px;
    align-items:center;
    overflow:auto;
    max-width: 65%;
    padding-bottom: 2px;
  }
  .jiv-dot{
    width: 8px;
    height: 8px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.24);
    background: rgba(255,255,255,0.10);
    cursor:pointer;
    flex: 0 0 auto;
  }
  .jiv-dot.active{
    background: rgba(32,151,189,0.85);
    border-color: rgba(32,151,189,0.95);
    box-shadow: 0 0 0 3px rgba(32,151,189,0.20);
  }

  @media (max-width: 520px){
    .jiv-card{ height: min(680px, 100%); }
    .jiv-title{ max-width: 52%; }
    .jiv-nav{ width: 40px; height: 40px; border-radius: 14px; }
  }
`;

function resolveMediaUrl(path: string | undefined, apiOrigin: string): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path.startsWith("/")) return `${apiOrigin}${path}`;
  return `${apiOrigin}/${path}`;
}

function getJobTypeImageUrl(job: Job, apiOrigin: string) {
  return resolveMediaUrl(job.jobTypeIconPath || job.imageUrl || undefined, apiOrigin) || "/globe.svg";
}

function getLocationParts(job: Job) {
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

  return {
    suburb: suburb.trim(),
    city: city.trim(),
  };
}

function getLocationSummary(job: Job) {
  const { suburb, city } = getLocationParts(job);
  if (suburb && city) return `${suburb}, ${city}`;
  if (city) return city;
  if (suburb) return suburb;

  const addressText = (job.addressText ?? "").trim();
  if (!addressText) return "Location pending";
  const parts = addressText
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length >= 3) return `${parts[1]}, ${parts[2]}`;
  if (parts.length >= 2) return `${parts[0]}, ${parts[1]}`;
  return parts[0] || "Location pending";
}

function RatingStars({ value }: { value: number }) {
  const rounded = Math.max(0, Math.min(5, Math.round(value)));
  return (
    <div className="jdd-rating-stars" aria-label={`Rating: ${value.toFixed(1)} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={`jdd-star ${i < rounded ? "filled" : "empty"}`} aria-hidden="true">
          ★
        </span>
      ))}
    </div>
  );
}

function ImageViewer({
  open,
  title,
  images,
  index,
  onIndexChange,
  onClose,
}: {
  open: boolean;
  title: string;
  images: string[];
  index: number;
  onIndexChange: (i: number) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onIndexChange((index - 1 + images.length) % images.length);
      if (e.key === "ArrowRight") onIndexChange((index + 1) % images.length);
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, index, images.length, onClose, onIndexChange]);

  if (!open) return null;

  const canNav = images.length > 1;
  const safeIndex = Math.max(0, Math.min(images.length - 1, index));
  const src = images[safeIndex];

  return (
    <div className="jiv-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Image viewer">
      <div className="jiv-card" onClick={(e) => e.stopPropagation()}>
        <div className="jiv-topbar">
          <div className="jiv-title">{title}</div>
          <button className="jiv-btn" onClick={onClose} aria-label="Close viewer">
            ✕
          </button>
        </div>

        <div className="jiv-main">
          {canNav && (
            <button
              className="jiv-btn jiv-nav jiv-prev"
              onClick={() => onIndexChange((safeIndex - 1 + images.length) % images.length)}
              aria-label="Previous image"
            >
              ‹
            </button>
          )}

          <img className="jiv-img" src={src} alt={`${title} image ${safeIndex + 1}`} />

          {canNav && (
            <button
              className="jiv-btn jiv-nav jiv-next"
              onClick={() => onIndexChange((safeIndex + 1) % images.length)}
              aria-label="Next image"
            >
              ›
            </button>
          )}
        </div>

        <div className="jiv-footer">
          <div className="jiv-counter">
            {safeIndex + 1} / {images.length}
          </div>

          {images.length > 1 && (
            <div className="jiv-dots" aria-label="Image thumbnails">
              {images.map((_, i) => (
                <button
                  key={i}
                  className={`jiv-dot${i === safeIndex ? " active" : ""}`}
                  onClick={() => onIndexChange(i)}
                  aria-label={`Go to image ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DrawerContent({
  job,
  apiOrigin,
  onClose,
  onApply,
  mobile = false,
}: {
  job: Job;
  apiOrigin: string;
  onClose: () => void;
  onApply: (jobId: string) => void;
  mobile?: boolean;
}) {
  const images = useMemo(
    () =>
      (job.imageUrls ?? [])
        .map((url) => resolveMediaUrl(url, apiOrigin))
        .filter((url): url is string => Boolean(url)),
    [job.imageUrls, apiOrigin]
  );

  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const rating = job.userAverageRating ?? 0;
  const ratingCount = job.userRatingCount ?? 0;
  const hasDate = job.date || job.expDate;
  const typeImageUrl = getJobTypeImageUrl(job, apiOrigin);
  const locationSummary = getLocationSummary(job);

  // stop background scroll while viewer open
  useEffect(() => {
    if (!viewerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [viewerOpen]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {mobile && <div className="jdd-handle" />}

      <div className="jdd-header">
        <span className="jdd-header-label">Job details</span>
        <button className="jdd-close-btn" onClick={onClose} aria-label="Close">
          ✕
        </button>
      </div>

      <div className="jdd-surface">
        <div className="jdd-body">
          <div className="jdd-hero">
            <div className="jdd-type-badge" aria-hidden="true">
              <img src={typeImageUrl} alt="" />
            </div>
            <div className="jdd-hero-copy">
              <h2 className="jdd-title">{job.title || "Untitled Job"}</h2>
              <p className="jdd-type">{job.jobTypeName || "General"}</p>
              <div className="jdd-top-meta">
                <span className="jdd-top-chip">{locationSummary}</span>
                <span className={`jdd-top-chip price${job.price == null ? " unknown" : ""}`}>
                  {job.price != null ? `$${job.price}` : "Price not set"}
                </span>
              </div>
            </div>
          </div>

          <div className="jdd-divider" />

          <p className="jdd-section-label">Location</p>
          <div className="jdd-location-card">
            <p className="jdd-location-city">{locationSummary}</p>
          </div>

          {(hasDate || job.shiftTime) && (
            <>
              <div className="jdd-divider" />
              <p className="jdd-section-label">Schedule</p>
              <div className="jdd-schedule-row">
                {hasDate && <span className="jdd-schedule-chip">{job.date || job.expDate}</span>}
                {hasDate && job.shiftTime && <span className="jdd-schedule-sep">·</span>}
                {job.shiftTime && <span className="jdd-schedule-chip">{job.shiftTime}</span>}
              </div>
            </>
          )}

          <div className="jdd-divider" />
          <p className="jdd-section-label">About this job</p>
          <p className="jdd-description">{job.description || "No description provided."}</p>

          <div className="jdd-divider" />
          <p className="jdd-section-label">Photos</p>

          {images.length > 0 ? (
            <div className="jdd-images-grid">
              {images.map((src, i) => (
                <button
                  key={`${job.id}-img-${i}`}
                  className="jdd-image-btn"
                  onClick={() => {
                    setViewerIndex(i);
                    setViewerOpen(true);
                  }}
                  aria-label={`Open photo ${i + 1}`}
                  type="button"
                >
                  <img src={src} alt={`${job.title || "Job"} image ${i + 1}`} className="jdd-image" />
                  <div className="jdd-image-overlay">
                    <span className="jdd-image-pill">View</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="jdd-no-images">No photos available</div>
          )}

          <div className="jdd-divider" />
          <p className="jdd-section-label">Rating</p>
          <div className="jdd-rating-row">
            <RatingStars value={rating} />
            <span className="jdd-rating-value">{rating.toFixed(1)}</span>
            <span className="jdd-rating-count">
              {ratingCount} review{ratingCount !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        <div className="jdd-footer">
          <button className="jdd-apply-btn" onClick={() => onApply(job.id)}>
            Apply for this job
          </button>
        </div>
      </div>

      <ImageViewer
        open={viewerOpen}
        title={job.title || "Job photo"}
        images={images}
        index={viewerIndex}
        onIndexChange={setViewerIndex}
        onClose={() => setViewerOpen(false)}
      />
    </div>
  );
}

export function JobDetailsDrawer({
  open,
  job,
  apiOrigin,
  onClose,
  onApply,
}: {
  open: boolean;
  job: Job | null;
  apiOrigin: string;
  onClose: () => void;
  onApply: (jobId: string) => void;
}) {
  if (!open || !job) return null;

  return (
    <>
      <style>{styles}</style>
      <div className="jdd-root">
        <div className="jdd-overlay" onClick={onClose}>
          <div className="jdd-panel-mobile" onClick={(e) => e.stopPropagation()}>
            <DrawerContent job={job} apiOrigin={apiOrigin} onClose={onClose} onApply={onApply} mobile />
          </div>

          <div className="jdd-panel-desktop" onClick={(e) => e.stopPropagation()}>
            <DrawerContent job={job} apiOrigin={apiOrigin} onClose={onClose} onApply={onApply} />
          </div>
        </div>
      </div>
    </>
  );
}
