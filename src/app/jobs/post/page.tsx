"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getJobTypes, JobType } from "@/lib/postJob";

type DateMode = "urgent" | "exact" | "before" | "after";
type TimeMode = "morning" | "afternoon" | "exact-time" | "anytime";

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
  .pj-row { display: flex; gap: 8px; flex-wrap: wrap; }
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

const steps = ["Basics", "Job Type & Budget", "Images", "Date & Time", "Address", "Review"] as const;

function readToken() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem("gumboot_token") || window.localStorage.getItem("token") || "";
}

function ymdFromDate(d: Date) {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function isoFromYMD(dateYYYYMMDD: string) {
  if (!dateYYYYMMDD) return "";
  return new Date(`${dateYYYYMMDD}T00:00:00.000Z`).toISOString();
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
function resolveJobTypeImage(t: any, apiOrigin: string) {
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
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
  const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // IMPORTANT: apiOrigin strips trailing /api like your MapJobs does
  const apiOrigin = useMemo(() => (API_BASE ?? "").replace(/\/api\/?$/, ""), [API_BASE]);

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [jobTypes, setJobTypes] = useState<JobType[]>([]);
  const [jobTypesLoading, setJobTypesLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [jobTypeId, setJobTypeId] = useState("");
  const [budget, setBudget] = useState("");

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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = readToken();
    if (!token) router.push(`/auth/login?next=${encodeURIComponent("/jobs/post")}`);
  }, [router]);

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
    if (step !== 4) return;
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
    const found = (jobTypes as any[]).find((t) => String(t.id ?? t._id) === String(jobTypeId));
    return found?.name || "";
  }, [jobTypeId, jobTypes]);

  function canProceed() {
    if (step === 0) return title.trim().length >= 3 && description.trim().length >= 10;
    if (step === 1) return Boolean(jobTypeId) && Number(budget) > 0;
    if (step === 2) return true;
    if (step === 3) return Boolean(jobDate) && (timeMode !== "exact-time" || Boolean(exactTime));
    if (step === 4) return Boolean(addressLine.trim()) && lat != null && lng != null;
    return true;
  }

  async function handleSubmit() {
    try {
      setError(null);

      if (!title.trim()) return setError("Job title is required.");
      if (!description.trim()) return setError("Description is required.");
      if (!jobTypeId) return setError("Job type is required.");
      if (!(Number(budget) > 0)) return setError("Price is required.");
      if (!jobDate) return setError("Expiry date is required.");
      if (!addressLine.trim()) return setError("Address is required.");
      if (lat == null || lng == null) return setError("Pick an address suggestion so lat/lng are captured.");

      setLoading(true);

      const token = readToken();
      if (!token) {
        setError("Not logged in (missing token). Please log in again.");
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
      let addressJson: any = {};
      try {
        addressJson = JSON.parse(addressText);
      } catch {
        addressJson = { message: addressText };
      }

      if (!addressRes.ok) throw new Error(addressJson?.message || `add_address failed (${addressRes.status})`);

      const addressBody = addressJson?.body ?? addressJson?.data ?? addressJson;
      const addressId = addressBody?._id || addressBody?.id || addressBody?.address?._id || "";
      if (!addressId) throw new Error("add_address succeeded but no addressId returned");

      // 2) create job
      const fd = new FormData();
      fd.append("job_title", title.trim());
      fd.append("job_type", String(jobTypeId));
      fd.append("description", description.trim());
      fd.append("price", String(Number(budget)));
      fd.append("exp_date", isoFromYMD(jobDate));
      fd.append("est_time", timeMode === "exact-time" ? exactTime : timeMode);
      fd.append("address", String(addressId));
      fd.append("latitude", String(lat));
      fd.append("longitude", String(lng));
      for (const f of files) fd.append("image", f);

      const jobRes = await fetch(`${API_BASE}/add_job`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
        cache: "no-store",
      });

      const jobText = await jobRes.text();
      let jobJson: any = {};
      try {
        jobJson = JSON.parse(jobText);
      } catch {
        jobJson = { message: jobText };
      }

      if (!jobRes.ok) throw new Error(jobJson?.message || jobJson?.error || `add_job failed (${jobRes.status})`);

      router.push("/?posted=1");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to post job");
    } finally {
      setLoading(false);
    }
  }

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

  return (
    <>
      <style>{styles}</style>

      <div className="pj-root">
        <section className="pj-wrap">
          <p className="pj-step">
            Step {step + 1} of {steps.length} • {steps[step]}
          </p>
          <h1 className="pj-title">Post a job</h1>

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

          {/* Step 2: Job Type & Budget */}
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
                    {(jobTypes as any[]).map((t) => {
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
                          aria-pressed={isActive}
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

              <div className="pj-field" style={{ marginTop: 6 }}>
                <label className="pj-label">Budget (single price)</label>
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

          {/* Step 3: Images */}
          {step === 2 && (
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

          {/* Step 4: Date & Time */}
          {step === 3 && (
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
                  <input
                    className="pj-input"
                    type="time"
                    value={exactTime}
                    onChange={(e) => setExactTime(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 5: Address */}
          {step === 4 && (
            <div className="pj-grid">
              <div className="pj-field">
                <label className="pj-label">Address (Google autocomplete)</label>
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

          {/* Step 6: Review */}
          {step === 5 && (
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
              <button type="button" className="pj-btn primary" onClick={handleSubmit} disabled={loading}>
                {loading ? "Posting..." : "Post job"}
              </button>
            )}
          </div>
        </section>
      </div>
    </>
  );
}