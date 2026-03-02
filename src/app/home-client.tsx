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
    gap: 6px;
    align-items: center;
  }
  .job-row-price { color: #26A69A; font-weight: 500; }
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
`;

export default function HomeClient() {
  const router = useRouter();
  const { user } = useMe();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [mode, setMode] = useState<ViewMode>("map");
  const [error, setError] = useState<string | null>(null);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [selectedJobType, setSelectedJobType] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

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
    return () => {
      mounted = false;
    };
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
                  <div className="job-row-title">{j.title}</div>
                  <div className="job-row-type">{j.jobTypeName || "General"}</div>
                  <div className="job-row-meta">
                    <span className="job-row-price">{j.price != null ? `$${j.price}` : "—"}</span>
                    <span className="job-row-dot">·</span>
                    <span className="job-row-coords">
                      {j.lat.toFixed(3)}, {j.lng.toFixed(3)}
                    </span>
                  </div>
                </button>
              ))}
        </div>
      </div>
    ),
    [filteredJobs, selectedJob, mode, error, loadingJobs, openJobDrawer]
  );

  return (
    <>
      <style>{styles}</style>

      <div className="hc-root">
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