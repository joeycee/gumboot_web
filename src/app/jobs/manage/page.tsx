"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import {
  cancelJob,
  deleteJob,
  deleteJobImage,
  editJob,
  getJobCancellationCharges,
  getUserJobs,
  type ManagedJob,
} from "@/lib/jobManagement";
import { getStatusLabel } from "@/lib/calendar";
import { getJobTypes, type JobType } from "@/lib/postJob";
import { resolveChatMediaUrl } from "@/lib/messages";

const styles = `
  .jm-root * { box-sizing: border-box; }
  .jm-root {
    min-height: calc(100vh - 56px);
    padding: 28px 16px 72px;
    background:
      radial-gradient(880px 520px at 10% 0%, rgba(91,110,127,0.18), rgba(0,0,0,0) 58%),
      linear-gradient(180deg, #2A3439, #20282c);
    color: #E5E5E5;
    font-family: 'DM Sans', sans-serif;
  }
  .jm-shell {
    max-width: 1100px;
    margin: 0 auto;
    display: grid;
    gap: 18px;
  }
  .jm-card {
    border: 1px solid rgba(229,229,229,0.10);
    border-radius: 22px;
    background: rgba(62,74,81,0.82);
    box-shadow: 0 18px 50px rgba(0,0,0,0.28);
    backdrop-filter: blur(10px);
    padding: 22px;
  }
  .jm-title {
    margin: 0;
    font-family: 'DM Serif Display', serif;
    font-size: 34px;
    font-weight: 400;
  }
  .jm-sub {
    margin: 10px 0 0;
    color: rgba(229,229,229,0.62);
    line-height: 1.6;
  }
  .jm-banner {
    border-radius: 14px;
    border: 1px solid rgba(229,229,229,0.10);
    background: rgba(42,52,57,0.52);
    padding: 14px 16px;
    line-height: 1.6;
  }
  .jm-status {
    border-radius: 14px;
    padding: 12px 14px;
    font-size: 13px;
    line-height: 1.6;
  }
  .jm-status.error {
    border: 1px solid rgba(183,91,91,0.38);
    background: rgba(183,91,91,0.14);
    color: rgba(255,220,220,0.92);
  }
  .jm-status.success {
    border: 1px solid rgba(38,166,154,0.34);
    background: rgba(38,166,154,0.12);
    color: rgba(229,245,242,0.94);
  }
  .jm-section-head {
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 14px;
    margin-bottom: 16px;
  }
  .jm-section-title {
    margin: 0;
    font-size: 22px;
    font-weight: 700;
    color: #F4F4F4;
  }
  .jm-section-sub {
    margin: 6px 0 0;
    font-size: 13px;
    color: rgba(229,229,229,0.58);
  }
  .jm-count {
    font-size: 11px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: rgba(229,229,229,0.46);
  }
  .jm-list {
    display: grid;
    gap: 14px;
  }
  .jm-job {
    display: grid;
    grid-template-columns: 104px minmax(0, 1fr);
    gap: 16px;
    border: 1px solid rgba(229,229,229,0.10);
    border-radius: 18px;
    background:
      linear-gradient(180deg, rgba(86,100,108,0.18), rgba(44,54,59,0.28)),
      rgba(42,52,57,0.52);
    padding: 14px;
  }
  .jm-job-media {
    width: 104px;
    aspect-ratio: 1;
    border-radius: 18px;
    overflow: hidden;
    border: 1px solid rgba(229,229,229,0.12);
    background:
      radial-gradient(circle at top left, rgba(38,166,154,0.32), rgba(0,0,0,0) 65%),
      linear-gradient(145deg, rgba(229,229,229,0.08), rgba(229,229,229,0.03));
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.05);
  }
  .jm-job-media img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .jm-job-copy {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .jm-job-top {
    display: flex;
    align-items: start;
    justify-content: space-between;
    gap: 12px;
  }
  .jm-job-title {
    font-size: 18px;
    font-weight: 700;
    color: #F7F7F7;
    line-height: 1.3;
  }
  .jm-job-status {
    display: inline-flex;
    align-items: center;
    min-height: 30px;
    padding: 0 12px;
    border-radius: 999px;
    border: 1px solid rgba(229,229,229,0.12);
    background: rgba(229,229,229,0.06);
    color: rgba(229,229,229,0.86);
    font-size: 11px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    white-space: nowrap;
  }
  .jm-job-status.accepted,
  .jm-job-status.progress,
  .jm-job-status.completed {
    background: rgba(38,166,154,0.16);
    border-color: rgba(38,166,154,0.30);
    color: #d9fffa;
  }
  .jm-job-meta {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    font-size: 13px;
    color: rgba(229,229,229,0.62);
  }
  .jm-job-dot { color: rgba(229,229,229,0.22); }
  .jm-job-summary {
    font-size: 14px;
    color: rgba(229,229,229,0.72);
    line-height: 1.6;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .jm-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .jm-btn, .jm-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    padding: 10px 12px;
    font: inherit;
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    cursor: pointer;
    text-decoration: none;
    border: 1px solid rgba(229,229,229,0.12);
    background: rgba(229,229,229,0.08);
    color: #E5E5E5;
  }
  .jm-btn.primary { background: #26A69A; color: white; border-color: transparent; }
  .jm-btn.danger {
    background: rgba(183,91,91,0.16);
    color: #ffe0e0;
    border-color: rgba(183,91,91,0.34);
  }
  .jm-empty {
    border: 1px dashed rgba(229,229,229,0.14);
    border-radius: 18px;
    padding: 20px;
    color: rgba(229,229,229,0.60);
    background: rgba(42,52,57,0.36);
  }
  .jm-modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 80;
    display: grid;
    place-items: center;
    padding: 20px;
    background: rgba(10,14,16,0.62);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }
  .jm-modal {
    width: min(760px, 100%);
    max-height: calc(100vh - 40px);
    overflow: auto;
    border-radius: 24px;
    border: 1px solid rgba(229,229,229,0.10);
    background: linear-gradient(180deg, rgba(66,79,86,0.96), rgba(37,46,50,0.98));
    box-shadow: 0 24px 80px rgba(0,0,0,0.45);
    padding: 22px;
  }
  .jm-modal-head {
    display: flex;
    align-items: start;
    justify-content: space-between;
    gap: 14px;
    margin-bottom: 18px;
  }
  .jm-modal-title {
    margin: 0;
    font-size: 24px;
    font-weight: 700;
    color: #F6F6F6;
  }
  .jm-modal-sub {
    margin: 6px 0 0;
    color: rgba(229,229,229,0.62);
    line-height: 1.6;
  }
  .jm-close {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    border: 1px solid rgba(229,229,229,0.10);
    background: rgba(229,229,229,0.06);
    color: #E5E5E5;
    cursor: pointer;
    font-size: 18px;
  }
  .jm-field { margin-bottom: 14px; }
  .jm-label {
    display: block;
    font-size: 10px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(229,229,229,0.42);
    margin-bottom: 6px;
  }
  .jm-input, .jm-textarea, .jm-select {
    width: 100%;
    border-radius: 12px;
    border: 1px solid rgba(229,229,229,0.12);
    background: #2A3439;
    color: #E5E5E5;
    padding: 12px 13px;
    font: inherit;
    outline: none;
  }
  .jm-textarea { min-height: 120px; resize: vertical; }
  .jm-fields {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }
  .jm-images {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    margin-top: 10px;
  }
  .jm-thumb {
    position: relative;
    width: 86px;
    height: 86px;
    border-radius: 16px;
    overflow: hidden;
    border: 1px solid rgba(229,229,229,0.12);
    background: rgba(229,229,229,0.04);
  }
  .jm-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .jm-thumb button {
    position: absolute;
    inset: auto 6px 6px auto;
    border: none;
    border-radius: 999px;
    padding: 5px 8px;
    cursor: pointer;
    background: rgba(0,0,0,0.68);
    color: #fff;
    font-size: 10px;
  }
  .jm-locked-note {
    margin: 0 0 14px;
    border-radius: 14px;
    border: 1px solid rgba(183,91,91,0.34);
    background: rgba(183,91,91,0.12);
    color: rgba(255,230,230,0.92);
    padding: 12px 14px;
    line-height: 1.6;
  }
  @media (max-width: 760px) {
    .jm-root { padding: 20px 12px 56px; }
    .jm-card { padding: 18px; border-radius: 18px; }
    .jm-title { font-size: 28px; }
    .jm-job {
      grid-template-columns: 1fr;
      gap: 12px;
    }
    .jm-job-media {
      width: 100%;
      max-width: 100%;
      aspect-ratio: 16 / 9;
    }
    .jm-job-top {
      flex-direction: column;
      align-items: start;
    }
    .jm-fields {
      grid-template-columns: 1fr;
      gap: 0;
    }
    .jm-modal {
      padding: 18px;
      border-radius: 18px;
    }
  }
`;

const ACCEPTED_JOB_STATUSES = new Set(["2", "3", "6", "7", "8", "9"]);
const LOCKED_JOB_STATUSES = new Set(["2", "3", "6", "7", "8", "9"]);

type RequestedJobEnvelope = {
  body?: {
    requestedJobs?: ManagedJob[];
  };
};

function stringifyAddress(address: unknown) {
  if (!address) return "Address unavailable";
  if (typeof address === "string") return address;
  if (typeof address === "object") {
    const row = address as Record<string, unknown>;
    const parts = [row.address, row.city, row.state, row.country]
      .filter((value) => typeof value === "string" && String(value).trim())
      .map((value) => String(value).trim());
    if (parts.length) return parts.join(", ");
    return String(row.name ?? row._id ?? "Address unavailable");
  }
  return "Address unavailable";
}

function isJobLockedAfterAcceptance(status: string | number | undefined) {
  return LOCKED_JOB_STATUSES.has(String(status ?? ""));
}

function getJobImageUrl(job: ManagedJob) {
  const firstImage = Array.isArray(job.image) ? job.image.find((item) => item?.url)?.url : null;
  return firstImage ? resolveChatMediaUrl(firstImage) : "/globe.svg";
}

function getStatusTone(status: string | number | undefined) {
  const normalized = String(status ?? "");
  if (normalized === "2") return "accepted";
  if (normalized === "3" || normalized === "8" || normalized === "9") return "progress";
  if (normalized === "6" || normalized === "7") return "completed";
  return "";
}

export default function ManageJobsPage() {
  const searchParams = useSearchParams();
  const [postedJobs, setPostedJobs] = useState<ManagedJob[]>([]);
  const [acceptedJobs, setAcceptedJobs] = useState<ManagedJob[]>([]);
  const [jobTypes, setJobTypes] = useState<JobType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [chargesMessage, setChargesMessage] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [expDate, setExpDate] = useState("");
  const [estTime, setEstTime] = useState("");
  const [newImages, setNewImages] = useState<File[]>([]);

  const selectedJob = useMemo(
    () => postedJobs.find((job) => String(job._id ?? "") === selectedJobId) ?? null,
    [postedJobs, selectedJobId]
  );
  const selectedJobLocked = useMemo(
    () => isJobLockedAfterAcceptance(selectedJob?.job_status),
    [selectedJob?.job_status]
  );
  const requestedJobId = searchParams.get("jobId") ?? "";

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const [jobsRes, requestedRes, chargesRes, typesRes] = await Promise.all([
        getUserJobs(),
        api<RequestedJobEnvelope>("/my_requested_jobs", {
          method: "POST",
          body: { page: 1, perPage: 200, search: "" },
        }),
        getJobCancellationCharges(),
        getJobTypes(),
      ]);

      const nextPostedJobs = Array.isArray(jobsRes.body?.jobs) ? jobsRes.body.jobs : [];
      const nextRequestedJobs = Array.isArray(requestedRes.body?.requestedJobs) ? requestedRes.body.requestedJobs : [];
      const nextAcceptedJobs = nextRequestedJobs.filter((job) =>
        ACCEPTED_JOB_STATUSES.has(String(job.job_status ?? ""))
      );

      setPostedJobs(nextPostedJobs);
      setAcceptedJobs(nextAcceptedJobs);
      setChargesMessage(chargesRes.message ?? null);
      setJobTypes(typesRes);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to load job management data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (!selectedJob) return;
    setJobTitle(selectedJob.job_title ?? "");
    setDescription(selectedJob.description ?? "");
    setPrice(String(selectedJob.price ?? ""));
    setExpDate(selectedJob.exp_date ? String(selectedJob.exp_date).slice(0, 10) : "");
    setEstTime(selectedJob.est_time ?? "");
    setNewImages([]);
  }, [selectedJob]);

  useEffect(() => {
    if (!requestedJobId || !postedJobs.length) return;
    const exists = postedJobs.some((job) => String(job._id ?? "") === requestedJobId);
    if (exists) {
      setSelectedJobId(requestedJobId);
    }
  }, [postedJobs, requestedJobId]);

  async function handleSaveJob() {
    if (!selectedJobId) return;
    if (selectedJobLocked) {
      setError("This job can no longer be edited because an offer has already been accepted.");
      return;
    }
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      await editJob({
        jobId: selectedJobId,
        job_title: jobTitle,
        description,
        price,
        exp_date: expDate,
        est_time: estTime,
        images: newImages,
      });
      setSuccess("Job updated.");
      setSelectedJobId("");
      setNewImages([]);
      await load();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to update job.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteJob(jobId: string) {
    const targetJob = postedJobs.find((job) => String(job._id ?? "") === jobId);
    if (isJobLockedAfterAcceptance(targetJob?.job_status)) {
      setError("This job can no longer be deleted because an offer has already been accepted.");
      return;
    }
    if (!window.confirm("Delete this job?")) return;
    try {
      setError(null);
      setSuccess(null);
      await deleteJob(jobId);
      if (selectedJobId === jobId) setSelectedJobId("");
      setSuccess("Job deleted.");
      await load();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to delete job.");
    }
  }

  async function handleCancelJob(jobId: string) {
    try {
      setError(null);
      setSuccess(null);
      await cancelJob(jobId);
      setSuccess("Job cancelled.");
      await load();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to cancel job.");
    }
  }

  async function handleDeleteImage(jobId: string, imageId: string) {
    const targetJob = postedJobs.find((job) => String(job._id ?? "") === jobId);
    if (isJobLockedAfterAcceptance(targetJob?.job_status)) {
      setError("This job can no longer be edited because an offer has already been accepted.");
      return;
    }
    const imageCount = Array.isArray(targetJob?.image) ? targetJob.image.length : 0;
    if (imageCount <= 1) {
      setError("Each job must keep at least one image. Add a replacement image before removing the last one.");
      return;
    }
    try {
      setError(null);
      setSuccess(null);
      await deleteJobImage(jobId, imageId);
      setSuccess("Image removed.");
      await load();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to delete image.");
    }
  }

  const showPostedSection = postedJobs.length > 0;
  const showAcceptedSection = acceptedJobs.length > 0;
  const showEmptyState = !loading && !showPostedSection && !showAcceptedSection;

  return (
    <>
      <style>{styles}</style>
      <div className="jm-root">
        <div className="jm-shell">
          <section className="jm-card">
            <h1 className="jm-title">Manage jobs</h1>
            <p className="jm-sub">
              Keep things simple here: see the jobs you posted, see the jobs you have been accepted for,
              and open a popup to edit your own listings.
            </p>
          </section>

          {chargesMessage ? <div className="jm-banner">{chargesMessage}</div> : null}
          {error ? <div className="jm-status error">{error}</div> : null}
          {success ? <div className="jm-status success">{success}</div> : null}

          {loading ? (
            <section className="jm-card">
              <div className="jm-empty">Loading jobs…</div>
            </section>
          ) : null}

          {showPostedSection ? (
            <section className="jm-card">
              <div className="jm-section-head">
                <div>
                  <h2 className="jm-section-title">Jobs I posted</h2>
                  <p className="jm-section-sub">Your own listings with their current status and quick actions.</p>
                </div>
                <div className="jm-count">{postedJobs.length} total</div>
              </div>
              <div className="jm-list">
                {postedJobs.map((job) => {
                  const jobId = String(job._id ?? "");
                  const locked = isJobLockedAfterAcceptance(job.job_status);
                  const statusTone = getStatusTone(job.job_status);

                  return (
                    <article className="jm-job" key={jobId}>
                      <div className="jm-job-media" aria-hidden="true">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={getJobImageUrl(job)} alt="" />
                      </div>
                      <div className="jm-job-copy">
                        <div className="jm-job-top">
                          <div className="jm-job-title">{job.job_title || "Untitled job"}</div>
                          <div className={`jm-job-status ${statusTone}`.trim()}>
                            {getStatusLabel(job.job_status)}
                          </div>
                        </div>
                        <div className="jm-job-meta">
                          <span>{stringifyAddress(job.address)}</span>
                          <span className="jm-job-dot">•</span>
                          <span>{job.price ? `$${job.price}` : "No price set"}</span>
                          {job.job_type ? (
                            <>
                              <span className="jm-job-dot">•</span>
                              <span>
                                {typeof job.job_type === "object" ? job.job_type.name || "General" : String(job.job_type)}
                              </span>
                            </>
                          ) : null}
                        </div>
                        {job.description ? <div className="jm-job-summary">{job.description}</div> : null}
                        <div className="jm-actions">
                          <button className="jm-btn" onClick={() => setSelectedJobId(jobId)} type="button">
                            Edit
                          </button>
                          {job._id ? (
                            <Link className="jm-link" href={`/jobs/${job._id}`}>
                              Open
                            </Link>
                          ) : null}
                          <button className="jm-btn" onClick={() => handleCancelJob(jobId)} type="button">
                            Cancel
                          </button>
                          <button
                            className="jm-btn danger"
                            onClick={() => handleDeleteJob(jobId)}
                            type="button"
                            disabled={locked}
                            title={locked ? "Accepted jobs cannot be deleted." : undefined}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ) : null}

          {showAcceptedSection ? (
            <section className="jm-card">
              <div className="jm-section-head">
                <div>
                  <h2 className="jm-section-title">Jobs I&apos;ve been accepted for</h2>
                  <p className="jm-section-sub">Only jobs where your application has moved into an accepted or active state.</p>
                </div>
                <div className="jm-count">{acceptedJobs.length} active</div>
              </div>
              <div className="jm-list">
                {acceptedJobs.map((job) => {
                  const jobId = String(job._id ?? "");
                  const statusTone = getStatusTone(job.job_status);

                  return (
                    <article className="jm-job" key={`accepted-${jobId}`}>
                      <div className="jm-job-media" aria-hidden="true">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={getJobImageUrl(job)} alt="" />
                      </div>
                      <div className="jm-job-copy">
                        <div className="jm-job-top">
                          <div className="jm-job-title">{job.job_title || "Accepted job"}</div>
                          <div className={`jm-job-status ${statusTone}`.trim()}>
                            {getStatusLabel(job.job_status)}
                          </div>
                        </div>
                        <div className="jm-job-meta">
                          <span>{stringifyAddress(job.address)}</span>
                          <span className="jm-job-dot">•</span>
                          <span>{job.price ? `$${job.price}` : "Price not shown"}</span>
                        </div>
                        {job.description ? <div className="jm-job-summary">{job.description}</div> : null}
                        <div className="jm-actions">
                          {job._id ? (
                            <Link className="jm-link" href={`/jobs/${job._id}`}>
                              Open job
                            </Link>
                          ) : null}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ) : null}

          {showEmptyState ? (
            <section className="jm-card">
              <div className="jm-empty">
                No jobs to show yet. This page will only show sections when you have posted jobs or jobs you have
                been accepted for.
              </div>
            </section>
          ) : null}
        </div>

        {selectedJob ? (
          <div className="jm-modal-backdrop" role="dialog" aria-modal="true" aria-label="Edit job">
            <div className="jm-modal">
              <div className="jm-modal-head">
                <div>
                  <h2 className="jm-modal-title">Edit job</h2>
                  <p className="jm-modal-sub">
                    Update the job details here, then click save to keep the changes.
                  </p>
                </div>
                <button className="jm-close" type="button" onClick={() => setSelectedJobId("")} aria-label="Close edit popup">
                  ×
                </button>
              </div>

              {selectedJobLocked ? (
                <div className="jm-locked-note">
                  This job is locked. Once an offer has been accepted, the listing can no longer be edited or deleted.
                </div>
              ) : null}

              <div className="jm-field">
                <label className="jm-label">Title</label>
                <input
                  className="jm-input"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  disabled={selectedJobLocked}
                />
              </div>

              <div className="jm-field">
                <label className="jm-label">Description</label>
                <textarea
                  className="jm-textarea"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={selectedJobLocked}
                />
              </div>

              <div className="jm-fields">
                <div className="jm-field">
                  <label className="jm-label">Price</label>
                  <input
                    className="jm-input"
                    inputMode="decimal"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    disabled={selectedJobLocked}
                  />
                </div>

                <div className="jm-field">
                  <label className="jm-label">Expected date</label>
                  <input
                    className="jm-input"
                    type="date"
                    value={expDate}
                    onChange={(e) => setExpDate(e.target.value)}
                    disabled={selectedJobLocked}
                  />
                </div>
              </div>

              <div className="jm-fields">
                <div className="jm-field">
                  <label className="jm-label">Estimated time</label>
                  <input
                    className="jm-input"
                    value={estTime}
                    onChange={(e) => setEstTime(e.target.value)}
                    disabled={selectedJobLocked}
                  />
                </div>

                <div className="jm-field">
                  <label className="jm-label">Job type</label>
                  <select
                    className="jm-select"
                    disabled
                    value={String(
                      (selectedJob.job_type && typeof selectedJob.job_type === "object"
                        ? selectedJob.job_type._id
                        : selectedJob.job_type) ?? ""
                    )}
                  >
                    <option value="">Current job type</option>
                    {jobTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="jm-field">
                <label className="jm-label">Add images</label>
                <input
                  className="jm-input"
                  multiple
                  type="file"
                  accept="image/*"
                  onChange={(e) => setNewImages(Array.from(e.target.files ?? []))}
                  disabled={selectedJobLocked}
                />
              </div>

              {(selectedJob.image ?? []).length <= 1 ? (
                <div className="jm-locked-note" style={{ marginTop: 0 }}>
                  This job must always have at least one image. Add another image before removing the current one.
                </div>
              ) : null}

              {(selectedJob.image ?? []).length > 0 ? (
                <div className="jm-images">
                  {(selectedJob.image ?? []).map((image) => (
                    <div className="jm-thumb" key={image._id ?? image.url}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {image.url ? <img alt="" src={resolveChatMediaUrl(image.url)} /> : null}
                      {selectedJob._id && image._id && !selectedJobLocked ? (
                        <button
                          onClick={() => handleDeleteImage(String(selectedJob._id), String(image._id))}
                          type="button"
                          disabled={(selectedJob.image ?? []).length <= 1}
                          title={(selectedJob.image ?? []).length <= 1 ? "Add another image before removing the last one." : undefined}
                        >
                          Remove
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="jm-actions" style={{ marginTop: 18 }}>
                <button className="jm-btn" type="button" onClick={() => setSelectedJobId("")}>
                  Close
                </button>
                <button
                  className="jm-btn primary"
                  disabled={saving || selectedJobLocked}
                  onClick={handleSaveJob}
                  type="button"
                >
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
