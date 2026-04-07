"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { addReview } from "@/lib/reviews";
import { deleteJobImage, cancelJob, deleteJob, editJob, getCompletedJobs, getJobCancellationCharges, getUserJobs, type ManagedJob } from "@/lib/jobManagement";
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
  .jm-shell { max-width: 1100px; margin: 0 auto; display: grid; gap: 16px; }
  .jm-card {
    border: 1px solid rgba(229,229,229,0.10);
    border-radius: 18px;
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
    margin-top: 10px;
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
  .jm-grid {
    display: grid;
    gap: 16px;
    grid-template-columns: 1fr;
  }
  @media (min-width: 980px) {
    .jm-grid { grid-template-columns: 1.15fr 0.85fr; }
  }
  .jm-list { display: grid; gap: 12px; }
  .jm-item {
    border: 1px solid rgba(229,229,229,0.10);
    border-radius: 14px;
    background: rgba(42,52,57,0.52);
    padding: 14px;
  }
  .jm-item-title {
    font-size: 15px;
    font-weight: 600;
    color: #F0F0F0;
  }
  .jm-item-copy {
    margin-top: 6px;
    color: rgba(229,229,229,0.62);
    line-height: 1.6;
    font-size: 13px;
  }
  .jm-label {
    display: block;
    font-size: 10px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(229,229,229,0.42);
    margin-bottom: 6px;
  }
  .jm-field { margin-bottom: 12px; }
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
  .jm-textarea { min-height: 110px; resize: vertical; }
  .jm-actions { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
  .jm-btn, .jm-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
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
  .jm-status {
    border-radius: 12px;
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
  .jm-images { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
  .jm-thumb {
    position: relative;
    width: 72px;
    height: 72px;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid rgba(229,229,229,0.12);
  }
  .jm-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .jm-thumb button {
    position: absolute;
    inset: auto 4px 4px auto;
    border: none;
    border-radius: 999px;
    padding: 4px 6px;
    cursor: pointer;
    background: rgba(0,0,0,0.65);
    color: #fff;
    font-size: 10px;
  }
`;

type ReviewFormState = {
  jobId: string;
  reciver_userId: string;
  rating: string;
  comment: string;
};

const LOCKED_JOB_STATUSES = new Set(["2", "3", "6", "7", "8", "9"]);

function emptyReviewState(): ReviewFormState {
  return { jobId: "", reciver_userId: "", rating: "5", comment: "" };
}

function stringifyAddress(address: unknown) {
  if (!address) return "Address unavailable";
  if (typeof address === "string") return address;
  if (typeof address === "object") {
    const row = address as Record<string, unknown>;
    return String(row.address ?? row.name ?? row._id ?? "Address unavailable");
  }
  return "Address unavailable";
}

function isJobLockedAfterAcceptance(status: string | number | undefined) {
  return LOCKED_JOB_STATUSES.has(String(status ?? ""));
}

export default function ManageJobsPage() {
  const searchParams = useSearchParams();
  const [jobs, setJobs] = useState<ManagedJob[]>([]);
  const [completedJobs, setCompletedJobs] = useState<ManagedJob[]>([]);
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
  const [reviewForm, setReviewForm] = useState<ReviewFormState>(emptyReviewState());

  const selectedJob = useMemo(
    () => jobs.find((job) => String(job._id ?? "") === selectedJobId) ?? null,
    [jobs, selectedJobId]
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
      const [jobsRes, completedRes, chargesRes, typesRes] = await Promise.all([
        getUserJobs(),
        getCompletedJobs(),
        getJobCancellationCharges(),
        getJobTypes(),
      ]);
      setJobs(Array.isArray(jobsRes.body?.jobs) ? jobsRes.body.jobs : []);
      setCompletedJobs(Array.isArray(completedRes.body?.completedJobsWithReviews) ? completedRes.body.completedJobsWithReviews : []);
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
  }, [selectedJob]);

  useEffect(() => {
    if (!requestedJobId || !jobs.length) return;
    const exists = jobs.some((job) => String(job._id ?? "") === requestedJobId);
    if (exists) {
      setSelectedJobId(requestedJobId);
    }
  }, [jobs, requestedJobId]);

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
      setNewImages([]);
      await load();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to update job.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteJob(jobId: string) {
    const targetJob = jobs.find((job) => String(job._id ?? "") === jobId);
    if (isJobLockedAfterAcceptance(targetJob?.job_status)) {
      setError("This job can no longer be deleted because an offer has already been accepted.");
      return;
    }
    if (!window.confirm("Delete this job?")) return;
    try {
      await deleteJob(jobId);
      await load();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to delete job.");
    }
  }

  async function handleCancelJob(jobId: string) {
    try {
      await cancelJob(jobId);
      await load();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to cancel job.");
    }
  }

  async function handleDeleteImage(jobId: string, imageId: string) {
    const targetJob = jobs.find((job) => String(job._id ?? "") === jobId);
    if (isJobLockedAfterAcceptance(targetJob?.job_status)) {
      setError("This job can no longer be edited because an offer has already been accepted.");
      return;
    }
    try {
      await deleteJobImage(jobId, imageId);
      await load();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to delete image.");
    }
  }

  async function handleReviewSubmit() {
    if (!reviewForm.jobId || !reviewForm.reciver_userId || !reviewForm.comment.trim()) {
      setError("Review requires a completed job, a receiver, and a comment.");
      return;
    }
    try {
      setSaving(true);
      setError(null);
      await addReview({
        jobId: reviewForm.jobId,
        reciver_userId: reviewForm.reciver_userId,
        rating: Number(reviewForm.rating),
        comment: reviewForm.comment.trim(),
      });
      setSuccess("Review submitted.");
      setReviewForm(emptyReviewState());
      await load();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to submit review.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <style>{styles}</style>
      <div className="jm-root">
        <div className="jm-shell">
          <section className="jm-card">
            <h1 className="jm-title">Manage jobs</h1>
            <p className="jm-sub">Edit active jobs, remove uploaded photos, cancel or delete old listings, and rate completed work from the same place.</p>
          </section>

          {chargesMessage ? <div className="jm-banner">{chargesMessage}</div> : null}
          {error ? <div className="jm-status error">{error}</div> : null}
          {success ? <div className="jm-status success">{success}</div> : null}

          <div className="jm-grid">
            <section className="jm-card">
              <h2 style={{ marginTop: 0 }}>Your posted jobs</h2>
              <div className="jm-list" style={{ marginTop: 14 }}>
                {loading ? <div>Loading jobs…</div> : null}
                {!loading && jobs.length === 0 ? <div>No posted jobs found.</div> : null}
                {jobs.map((job) => (
                  <article className="jm-item" key={job._id}>
                    <div className="jm-item-title">{job.job_title || "Untitled job"}</div>
                    <div className="jm-item-copy">
                      {stringifyAddress(job.address)} • {job.price ? `$${job.price}` : "No price"} • Status {job.job_status ?? "0"}
                    </div>
                    {isJobLockedAfterAcceptance(job.job_status) ? (
                      <div className="jm-item-copy">
                        This job is locked because an offer has already been accepted.
                      </div>
                    ) : null}
                    <div className="jm-actions">
                      <button className="jm-btn" onClick={() => setSelectedJobId(String(job._id ?? ""))} type="button">
                        Edit
                      </button>
                      {job._id ? <Link className="jm-link" href={`/jobs/${job._id}`}>Open</Link> : null}
                      <button className="jm-btn" onClick={() => handleCancelJob(String(job._id ?? ""))} type="button">
                        Cancel
                      </button>
                      <button
                        className="jm-btn danger"
                        onClick={() => handleDeleteJob(String(job._id ?? ""))}
                        type="button"
                        disabled={isJobLockedAfterAcceptance(job.job_status)}
                        title={isJobLockedAfterAcceptance(job.job_status) ? "Accepted jobs cannot be deleted." : undefined}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="jm-card">
              <h2 style={{ marginTop: 0 }}>Edit selected job</h2>
              {!selectedJob ? (
                <div className="jm-item-copy" style={{ marginTop: 12 }}>Choose a posted job on the left to edit its details.</div>
              ) : (
                <>
                  {selectedJobLocked ? (
                    <div className="jm-status error" style={{ marginTop: 14 }}>
                      This job is locked. Once an offer has been accepted, the listing can no longer be edited or deleted.
                    </div>
                  ) : null}
                  <div className="jm-field" style={{ marginTop: 14 }}>
                    <label className="jm-label">Title</label>
                    <input className="jm-input" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} disabled={selectedJobLocked} />
                  </div>
                  <div className="jm-field">
                    <label className="jm-label">Description</label>
                    <textarea className="jm-textarea" value={description} onChange={(e) => setDescription(e.target.value)} disabled={selectedJobLocked} />
                  </div>
                  <div className="jm-field">
                    <label className="jm-label">Price</label>
                    <input className="jm-input" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} disabled={selectedJobLocked} />
                  </div>
                  <div className="jm-field">
                    <label className="jm-label">Expected date</label>
                    <input className="jm-input" type="date" value={expDate} onChange={(e) => setExpDate(e.target.value)} disabled={selectedJobLocked} />
                  </div>
                  <div className="jm-field">
                    <label className="jm-label">Estimated time</label>
                    <input className="jm-input" value={estTime} onChange={(e) => setEstTime(e.target.value)} disabled={selectedJobLocked} />
                  </div>
                  <div className="jm-field">
                    <label className="jm-label">Job type</label>
                    <select className="jm-select" disabled value={String((selectedJob.job_type && typeof selectedJob.job_type === "object" ? selectedJob.job_type._id : selectedJob.job_type) ?? "")}>
                      <option value="">Current job type</option>
                      {jobTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="jm-field">
                    <label className="jm-label">Add images</label>
                    <input className="jm-input" multiple type="file" accept="image/*" onChange={(e) => setNewImages(Array.from(e.target.files ?? []))} disabled={selectedJobLocked} />
                  </div>
                  <div className="jm-images">
                    {(selectedJob.image ?? []).map((image) => (
                      <div className="jm-thumb" key={image._id ?? image.url}>
                        {image.url ? <img alt="" src={resolveChatMediaUrl(image.url)} /> : null}
                        {selectedJob._id && image._id && !selectedJobLocked ? (
                          <button onClick={() => handleDeleteImage(String(selectedJob._id), String(image._id))} type="button">
                            Remove
                          </button>
                        ) : null}
                      </div>
                    ))}
                  </div>
                  <div className="jm-actions">
                    <button className="jm-btn primary" disabled={saving || selectedJobLocked} onClick={handleSaveJob} type="button">
                      {saving ? "Saving…" : "Save changes"}
                    </button>
                  </div>
                </>
              )}
            </section>
          </div>

          <div className="jm-grid">
            <section className="jm-card">
              <h2 style={{ marginTop: 0 }}>Completed jobs</h2>
              <div className="jm-list" style={{ marginTop: 14 }}>
                {completedJobs.length === 0 ? <div>No completed jobs yet.</div> : null}
                {completedJobs.map((job) => (
                  <article className="jm-item" key={job._id}>
                    <div className="jm-item-title">{job.job_title || "Completed job"}</div>
                    <div className="jm-item-copy">
                      Worker: {typeof job.workerId === "object" ? [job.workerId.firstname, job.workerId.lastname].filter(Boolean).join(" ") : String(job.workerId ?? "Unknown")}
                    </div>
                    <div className="jm-actions">
                      {job._id ? <Link className="jm-link" href={`/jobs/${job._id}`}>Open</Link> : null}
                      <button
                        className="jm-btn"
                        onClick={() =>
                          setReviewForm({
                            jobId: String(job._id ?? ""),
                            reciver_userId: typeof job.workerId === "object" ? String(job.workerId._id ?? "") : "",
                            rating: "5",
                            comment: "",
                          })
                        }
                        type="button"
                      >
                        Rate worker
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="jm-card">
              <h2 style={{ marginTop: 0 }}>Submit review</h2>
              <div className="jm-field" style={{ marginTop: 14 }}>
                <label className="jm-label">Completed job</label>
                <select className="jm-select" value={reviewForm.jobId} onChange={(e) => setReviewForm((current) => ({ ...current, jobId: e.target.value }))}>
                  <option value="">Select a completed job</option>
                  {completedJobs.map((job) => (
                    <option key={job._id} value={job._id}>
                      {job.job_title || "Completed job"}
                    </option>
                  ))}
                </select>
              </div>
              <div className="jm-field">
                <label className="jm-label">Worker ID</label>
                <input className="jm-input" value={reviewForm.reciver_userId} onChange={(e) => setReviewForm((current) => ({ ...current, reciver_userId: e.target.value }))} />
              </div>
              <div className="jm-field">
                <label className="jm-label">Rating</label>
                <select className="jm-select" value={reviewForm.rating} onChange={(e) => setReviewForm((current) => ({ ...current, rating: e.target.value }))}>
                  <option value="5">5</option>
                  <option value="4">4</option>
                  <option value="3">3</option>
                  <option value="2">2</option>
                  <option value="1">1</option>
                </select>
              </div>
              <div className="jm-field">
                <label className="jm-label">Comment</label>
                <textarea className="jm-textarea" value={reviewForm.comment} onChange={(e) => setReviewForm((current) => ({ ...current, comment: e.target.value }))} />
              </div>
              <div className="jm-actions">
                <button className="jm-btn primary" disabled={saving} onClick={handleReviewSubmit} type="button">
                  Submit review
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
