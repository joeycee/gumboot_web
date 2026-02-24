"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { ApiEnvelope } from "@/lib/apiTypes";

type JobDetails = any;

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');

  .jdc-root * { box-sizing: border-box; }
  .jdc-root {
    min-height: 100dvh;
    background: #2097bd;
    color: #ffffff;
    font-family: 'DM Sans', sans-serif;
    padding: 48px 24px 80px;
  }
  .jdc-container { max-width: 680px; margin: 0 auto; }

  /* Breadcrumb */
  .jdc-breadcrumb {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: rgba(255,255,255,0.35);
    letter-spacing: 0.04em;
    text-transform: uppercase;
    margin-bottom: 40px;
  }
  .jdc-breadcrumb-sep { color: rgba(255,255,255,0.18); }
  .jdc-breadcrumb-current { color: rgba(255,255,255,0.55); }

  /* Skeleton */
  .skeleton-wrap { display: flex; flex-direction: column; gap: 14px; padding-top: 16px; }
  .skeleton-line {
    border-radius: 4px;
    background: linear-gradient(
      90deg,
      rgba(255,255,255,0.08) 25%,
      rgba(255,255,255,0.16) 50%,
      rgba(255,255,255,0.08) 75%
    );
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }
  @keyframes shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  /* Error */
  .error-box {
    border: 1px solid rgba(255,160,160,0.20);
    background: rgba(255,100,100,0.08);
    border-radius: 12px;
    padding: 32px;
    text-align: center;
  }
  .error-icon { font-size: 28px; margin-bottom: 10px; }
  .error-message { color: rgba(255,200,200,0.80); font-size: 14px; line-height: 1.6; }

  /* Card */
  .jdc-card { animation: fadeUp 0.45s ease both; }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* Title */
  .jdc-title {
    font-family: 'DM Serif Display', serif;
    font-size: 32px;
    font-weight: 400;
    color: #ffffff;
    line-height: 1.2;
    margin: 0 0 10px;
  }
  .jdc-meta-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    margin-bottom: 28px;
  }
  .jdc-meta-tag {
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.50);
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.14);
    border-radius: 5px;
    padding: 4px 10px;
  }
  .jdc-meta-tag.highlight {
    color: rgba(255,255,255,0.90);
    background: rgba(255,255,255,0.15);
    border-color: rgba(255,255,255,0.28);
  }
  .jdc-id { font-size: 11px; color: rgba(255,255,255,0.20); letter-spacing: 0.04em; }

  .divider { height: 1px; background: rgba(255,255,255,0.10); margin: 28px 0; }

  .section-label {
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.35);
    margin-bottom: 12px;
  }

  /* Description */
  .jdc-description {
    font-size: 14px;
    line-height: 1.8;
    color: rgba(255,255,255,0.62);
    font-weight: 300;
    white-space: pre-wrap;
  }

  /* Actions */
  .actions-row { display: flex; gap: 10px; flex-wrap: wrap; }
  .action-btn {
    font-family: 'DM Sans', sans-serif;
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    border-radius: 8px;
    padding: 11px 22px;
    cursor: pointer;
    border: 1px solid transparent;
    transition: all 0.16s;
    flex: 1;
    min-width: 100px;
  }
  .action-btn:disabled { opacity: 0.35; cursor: not-allowed; }

  .btn-apply {
    background: #ffffff;
    color: #1a85a8;
    border-color: #ffffff;
  }
  .btn-apply:hover:not(:disabled) { background: rgba(255,255,255,0.90); }

  .btn-accept {
    background: rgba(255,255,255,0.07);
    color: rgba(200,255,220,0.80);
    border-color: rgba(200,255,220,0.20);
  }
  .btn-accept:hover:not(:disabled) {
    background: rgba(200,255,220,0.10);
    border-color: rgba(200,255,220,0.35);
  }

  .btn-reject {
    background: rgba(255,255,255,0.07);
    color: rgba(255,200,200,0.75);
    border-color: rgba(255,200,200,0.18);
  }
  .btn-reject:hover:not(:disabled) {
    background: rgba(255,200,200,0.10);
    border-color: rgba(255,200,200,0.32);
  }

  /* Raw toggle */
  .raw-toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    background: none;
    border: none;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.22);
    padding: 0;
    transition: color 0.16s;
  }
  .raw-toggle:hover { color: rgba(255,255,255,0.50); }
  .raw-toggle-icon { display: inline-block; transition: transform 0.2s; font-size: 9px; }
  .raw-toggle-icon.open { transform: rotate(90deg); }
  .raw-pre {
    margin-top: 14px;
    font-size: 11px;
    font-family: 'SF Mono', 'Fira Code', monospace;
    background: rgba(0,0,0,0.18);
    border: 1px solid rgba(255,255,255,0.10);
    border-radius: 8px;
    padding: 16px;
    overflow: auto;
    color: rgba(255,255,255,0.40);
    line-height: 1.6;
    max-height: 320px;
  }
`;

export default function JobDetailsClient({ id }: { id: string }) {
  const [job, setJob] = useState<JobDetails | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [rawOpen, setRawOpen] = useState(false);
  const [actionState, setActionState] = useState<"idle" | "applying" | "accepting" | "rejecting">("idle");

  useEffect(() => {
    (async () => {
      try {
        setErr(null);
        const res = await api<ApiEnvelope<JobDetails>>(`/job_details?id=${id}`);
        setJob(res.body ?? (res as any));
      } catch (e: any) {
        setErr(e.message || "Failed to load job details");
      }
    })();
  }, [id]);

  const title = job?.title || job?.job_title || "Untitled Job";
  const description = job?.description || job?.job_description || "No description provided.";
  const company = job?.company || job?.company_name;
  const location = job?.location || job?.job_location;
  const salary = job?.salary || job?.compensation;
  const jobType = job?.type || job?.job_type || job?.employment_type;

  return (
    <>
      <style>{styles}</style>
      <div className="jdc-root">
        <div className="jdc-container">

          <div className="jdc-breadcrumb">
            <span>Jobs</span>
            <span className="jdc-breadcrumb-sep">›</span>
            <span className="jdc-breadcrumb-current">Details</span>
          </div>

          {err && (
            <div className="error-box">
              <div className="error-icon">⚠</div>
              <p className="error-message">{err}</p>
            </div>
          )}

          {!err && !job && (
            <div className="skeleton-wrap">
              <div className="skeleton-line" style={{ width: "55%", height: 34 }} />
              <div className="skeleton-line" style={{ width: "30%", height: 12 }} />
              <div className="skeleton-line" style={{ width: "100%", height: 1, margin: "12px 0" }} />
              <div className="skeleton-line" style={{ width: "100%", height: 12 }} />
              <div className="skeleton-line" style={{ width: "88%",  height: 12 }} />
              <div className="skeleton-line" style={{ width: "72%",  height: 12 }} />
            </div>
          )}

          {job && (
            <div className="jdc-card">
              <h1 className="jdc-title">{title}</h1>
              <div className="jdc-meta-row">
                {company  && <span className="jdc-meta-tag highlight">{company}</span>}
                {location && <span className="jdc-meta-tag">{location}</span>}
                {jobType  && <span className="jdc-meta-tag">{jobType}</span>}
                {salary   && <span className="jdc-meta-tag highlight">{salary}</span>}
                <span className="jdc-id">#{id}</span>
              </div>

              <div className="divider" />

              <p className="section-label">About this role</p>
              <p className="jdc-description">{description}</p>

              <div className="divider" />

              <p className="section-label">Actions</p>
              <div className="actions-row">
                <button className="action-btn btn-apply"
                  disabled={actionState !== "idle"}
                  onClick={() => setActionState("applying")}>Apply</button>
                <button className="action-btn btn-accept"
                  disabled={actionState !== "idle"}
                  onClick={() => setActionState("accepting")}>Accept</button>
                <button className="action-btn btn-reject"
                  disabled={actionState !== "idle"}
                  onClick={() => setActionState("rejecting")}>Decline</button>
              </div>

              <div className="divider" />

              <button className="raw-toggle" onClick={() => setRawOpen((v) => !v)}>
                <span className={`raw-toggle-icon ${rawOpen ? "open" : ""}`}>▶</span>
                Raw payload
              </button>
              {rawOpen && (
                <pre className="raw-pre">{JSON.stringify(job, null, 2)}</pre>
              )}
            </div>
          )}

        </div>
      </div>
    </>
  );
}