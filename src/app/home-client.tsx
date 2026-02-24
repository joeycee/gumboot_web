"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Shell } from "@/components/Shell";
import { MapJobs } from "@/components/MapJobs";
import { JobDetailsDrawer } from "@/components/JobDetailsDrawer";
import { api } from "@/lib/api";
import { Job, normalizeJobs } from "@/lib/jobs";
import { useMe } from "@/lib/useMe";
import { logout } from "@/lib/auth";

type ViewMode = "map" | "list";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');

  .hc-root * { box-sizing: border-box; }
  .hc-root { font-family: 'DM Sans', sans-serif; color: #fff; }

  /* ── Auth area ── */
  .auth-loading {
    font-size: 12px;
    color: rgba(255,255,255,0.35);
    letter-spacing: 0.06em;
  }
  .auth-user {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .auth-name {
    font-size: 13px;
    color: rgba(255,255,255,0.65);
  }
  .auth-btn {
    font-family: 'DM Sans', sans-serif;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    background: rgba(255,255,255,0.07);
    border: 1px solid rgba(255,255,255,0.16);
    color: rgba(255,255,255,0.55);
    padding: 7px 16px;
    border-radius: 7px;
    cursor: pointer;
    transition: all 0.16s;
  }
  .auth-btn:hover {
    background: rgba(255,255,255,0.14);
    border-color: rgba(255,255,255,0.28);
    color: rgba(255,255,255,0.9);
  }
  .auth-btn.primary {
    background: rgba(255,255,255,0.18);
    border-color: rgba(255,255,255,0.38);
    color: #ffffff;
  }
  .auth-btn.primary:hover {
    background: rgba(255,255,255,0.26);
    border-color: rgba(255,255,255,0.52);
  }

  /* ── Left panel ── */
  .lp-root {
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  .lp-header {
    padding: 18px 20px 14px;
    border-bottom: 1px solid rgba(255,255,255,0.10);
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
  }
  .lp-heading {
    font-family: 'DM Serif Display', serif;
    font-size: 20px;
    font-weight: 400;
    color: #ffffff;
    margin: 0;
    line-height: 1;
  }
  .lp-view-toggle {
    font-family: 'DM Sans', sans-serif;
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    background: rgba(255,255,255,0.07);
    border: 1px solid rgba(255,255,255,0.16);
    color: rgba(255,255,255,0.50);
    padding: 6px 12px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.16s;
  }
  .lp-view-toggle:hover {
    background: rgba(255,255,255,0.14);
    border-color: rgba(255,255,255,0.28);
    color: rgba(255,255,255,0.85);
  }

  .lp-status {
    padding: 10px 20px;
    border-bottom: 1px solid rgba(255,255,255,0.07);
    flex-shrink: 0;
    min-height: 36px;
    display: flex;
    align-items: center;
  }
  .lp-status-text {
    font-size: 11px;
    color: rgba(255,255,255,0.30);
    letter-spacing: 0.03em;
  }
  .lp-status-text.error { color: rgba(255,200,200,0.75); }
  .lp-status-count {
    font-size: 11px;
    color: rgba(255,255,255,0.55);
    letter-spacing: 0.04em;
  }

  .lp-jobs {
    flex: 1;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: rgba(255,255,255,0.12) transparent;
  }
  .lp-jobs::-webkit-scrollbar { width: 4px; }
  .lp-jobs::-webkit-scrollbar-track { background: transparent; }
  .lp-jobs::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 2px; }

  .job-row {
    width: 100%;
    text-align: left;
    padding: 14px 20px;
    border: none;
    border-bottom: 1px solid rgba(255,255,255,0.07);
    background: transparent;
    cursor: pointer;
    transition: background 0.14s;
    display: block;
    color: inherit;
  }
  .job-row:hover { background: rgba(255,255,255,0.07); }
  .job-row.selected { background: rgba(255,255,255,0.14); }

  .job-row-title {
    font-size: 13px;
    font-weight: 500;
    color: rgba(255,255,255,0.85);
    margin-bottom: 3px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .job-row.selected .job-row-title { color: #ffffff; }
  .job-row-type {
    font-size: 10px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.30);
    margin-bottom: 4px;
  }
  .job-row-meta {
    font-size: 11px;
    color: rgba(255,255,255,0.40);
    display: flex;
    gap: 6px;
    align-items: center;
  }
  .job-row-price { color: rgba(255,255,255,0.60); }
  .job-row-dot   { color: rgba(255,255,255,0.20); }
  .job-row-coords { color: rgba(255,255,255,0.28); font-variant-numeric: tabular-nums; }

  /* ── Right drawer content ── */
  .rd-root {
    padding: 24px 20px;
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  .rd-section-label {
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.32);
    margin-bottom: 10px;
  }
  .rd-hint {
    font-size: 13px;
    color: rgba(255,255,255,0.55);
    line-height: 1.65;
    font-weight: 300;
    font-style: italic;
  }
  .rd-profile-btn {
    font-family: 'DM Sans', sans-serif;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    width: 100%;
    text-align: left;
    background: rgba(255,255,255,0.09);
    border: 1px solid rgba(255,255,255,0.18);
    color: rgba(255,255,255,0.70);
    padding: 12px 16px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.16s;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .rd-profile-btn:hover {
    background: rgba(255,255,255,0.16);
    border-color: rgba(255,255,255,0.32);
    color: #ffffff;
  }
  .rd-profile-btn-arrow { color: rgba(255,255,255,0.30); font-size: 12px; }

  .rd-links-card {
    border: 1px solid rgba(255,255,255,0.10);
    border-radius: 10px;
    padding: 16px;
    background: rgba(255,255,255,0.05);
  }
  .rd-links-title {
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.28);
    margin-bottom: 12px;
  }
  .rd-link-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 0;
    border-bottom: 1px solid rgba(255,255,255,0.07);
    font-size: 12px;
    color: rgba(255,255,255,0.40);
  }
  .rd-link-item:last-child { border-bottom: none; }
  .rd-link-dot {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: rgba(255,255,255,0.22);
    flex-shrink: 0;
  }

  /* ── List view ── */
  .list-view-root {
    padding: 32px 28px;
    min-height: 100%;
    background: #2097bd;
  }
  .list-view-heading {
    font-family: 'DM Serif Display', serif;
    font-size: 26px;
    font-weight: 400;
    color: #ffffff;
    margin: 0 0 28px;
  }
  .list-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 12px;
  }
  .list-card {
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 10px;
    padding: 18px;
    cursor: pointer;
    transition: all 0.16s;
    background: rgba(255,255,255,0.07);
  }
  .list-card:hover {
    background: rgba(255,255,255,0.14);
    border-color: rgba(255,255,255,0.24);
  }
  .list-card-title {
    font-size: 14px;
    font-weight: 500;
    color: rgba(255,255,255,0.90);
    margin-bottom: 5px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .list-card-type {
    font-size: 10px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.30);
    margin-bottom: 10px;
  }
  .list-card-price {
    font-size: 13px;
    font-weight: 500;
    color: #ffffff;
  }
  .list-card-price.unknown {
    color: rgba(255,255,255,0.30);
    font-weight: 300;
    font-style: italic;
  }

  /* Skeleton shimmer */
  @keyframes shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  .skeleton-row {
    padding: 14px 20px;
    border-bottom: 1px solid rgba(255,255,255,0.07);
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .skeleton-line {
    border-radius: 3px;
    background: linear-gradient(
      90deg,
      rgba(255,255,255,0.08) 25%,
      rgba(255,255,255,0.14) 50%,
      rgba(255,255,255,0.08) 75%
    );
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }
`;

export default function HomeClient() {
  const router = useRouter();
  const { user, loading: meLoading, refresh } = useMe();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [mode, setMode] = useState<ViewMode>("map");
  const [error, setError] = useState<string | null>(null);
  const [loadingJobs, setLoadingJobs] = useState(false);

  const apiOrigin = useMemo(
    () => (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/api\/?$/, ""),
    []
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingJobs(true);
        setError(null);
        const data = await api<unknown>("/jobs_public_listing", { method: "GET", auth: false });
        const normalized = normalizeJobs(data);
        if (mounted) setJobs(normalized);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Failed to load jobs";
        if (mounted) setError(message);
      } finally {
        if (mounted) setLoadingJobs(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const openJobDrawer = useCallback((job: Job) => {
    setSelectedJob(job);
    setIsDrawerOpen(true);
  }, []);

  const closeJobDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    setSelectedJob(null);
  }, []);

  const onApply = useCallback(
    (jobId: string) => {
      if (!user) {
        router.push(`/auth/login?next=${encodeURIComponent(`/?jobId=${jobId}`)}`);
        return;
      }
      console.log("onApply(jobId):", jobId);
    },
    [router, user]
  );

  const handleLogout = useCallback(async () => {
    try { await logout(); } finally { await refresh(); }
  }, [refresh]);

  const topRight = useMemo(() => {
    if (meLoading) return <span className="auth-loading">···</span>;
    if (user) {
      return (
        <div className="auth-user">
          <span className="auth-name">{user?.firstname || user?.name || "Account"}</span>
          <button className="auth-btn" onClick={handleLogout}>Sign out</button>
        </div>
      );
    }
    return (
      <button className="auth-btn primary" onClick={() => router.push("/auth/login")}>
        Sign in
      </button>
    );
  }, [meLoading, user, router, handleLogout]);

  const leftPanel = useMemo(() => (
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
        {!error && !loadingJobs && jobs.length === 0 && <span className="lp-status-text">No jobs found.</span>}
        {!error && !loadingJobs && jobs.length > 0 && <span className="lp-status-count">{jobs.length} jobs</span>}
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
          : jobs.map((j) => (
              <button
                key={j.id}
                onClick={() => openJobDrawer(j)}
                className={`job-row${selectedJob?.id === j.id ? " selected" : ""}`}
              >
                <div className="job-row-title">{j.title}</div>
                <div className="job-row-type">{j.jobTypeName || "General"}</div>
                <div className="job-row-meta">
                  <span className="job-row-price">{j.price != null ? `$${j.price}` : "—"}</span>
                  <span className="job-row-dot">·</span>
                  <span className="job-row-coords">{j.lat.toFixed(3)}, {j.lng.toFixed(3)}</span>
                </div>
              </button>
            ))}
      </div>
    </div>
  ), [jobs, selectedJob, mode, error, loadingJobs, openJobDrawer]);

  const rightDrawer = (
    <div className="rd-root">
      <div>
        <p className="rd-section-label">Account</p>
        <p className="rd-hint">
          {user
            ? `Signed in as ${user?.firstname || user?.name || "you"}.`
            : "Sign in to apply for jobs and manage your profile."}
        </p>
      </div>

      <button className="rd-profile-btn" onClick={() => router.push("/profile")}>
        <span>View profile</span>
        <span className="rd-profile-btn-arrow">→</span>
      </button>

      <div className="rd-links-card">
        <p className="rd-links-title">Coming soon</p>
        {["Edit profile", "My jobs / My work", "Transactions & Withdrawals", "Reviews"].map((label) => (
          <div key={label} className="rd-link-item">
            <span className="rd-link-dot" />
            {label}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <style>{styles}</style>
      <div className="hc-root">
        <Shell left={leftPanel} right={rightDrawer} topRight={topRight}>
          {mode === "map" ? (
            <MapJobs jobs={jobs} onSelect={openJobDrawer} />
          ) : (
            <div className="list-view-root">
              <h1 className="list-view-heading">All Jobs</h1>
              <div className="list-grid">
                {jobs.map((j) => (
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
    </>
  );
}