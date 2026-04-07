"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  fetchJobApplications,
  findApplicationByRequestId,
  getApplicationWorker,
  getApplicationWorkerId,
  normalizeApplicationsResponse,
} from "@/lib/applications";
import { addReview } from "@/lib/reviews";
import {
  getJobOwnerId,
  getJobTitle,
  getUserFullName,
  normalizeJobDetails,
  type JobDetails,
  type JobDetailsEnvelope,
} from "@/lib/jobFlow";
import { resolveUserImageUrl } from "@/lib/messages";
import { useMe } from "@/lib/useMe";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500&display=swap');

  .jrv-root * { box-sizing: border-box; }
  .jrv-root {
    min-height: calc(100vh - 56px);
    padding: 26px 16px 72px;
    color: #E5E5E5;
    font-family: 'DM Sans', sans-serif;
    background:
      radial-gradient(900px 540px at 10% 0%, rgba(91,110,127,0.18), transparent 60%),
      linear-gradient(180deg, #2A3439 0%, #243036 100%);
  }
  .jrv-shell {
    max-width: 760px;
    margin: 0 auto;
    display: grid;
    gap: 16px;
  }
  .jrv-card {
    border: 1px solid rgba(229,229,229,0.10);
    border-radius: 20px;
    background: rgba(62,74,81,0.82);
    box-shadow: 0 18px 50px rgba(0,0,0,0.28);
    backdrop-filter: blur(10px);
    overflow: hidden;
  }
  .jrv-head {
    padding: 22px;
    border-bottom: 1px solid rgba(229,229,229,0.08);
  }
  .jrv-kicker {
    margin: 0 0 8px;
    font-size: 10px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: rgba(229,229,229,0.40);
  }
  .jrv-title {
    margin: 0;
    font-family: 'DM Serif Display', serif;
    font-size: 32px;
    font-weight: 400;
    line-height: 1.04;
  }
  .jrv-subtitle {
    margin: 10px 0 0;
    color: rgba(229,229,229,0.60);
    line-height: 1.7;
    font-size: 13px;
  }
  .jrv-body {
    padding: 22px;
    display: grid;
    gap: 16px;
  }
  .jrv-summary {
    display: flex;
    gap: 14px;
    align-items: center;
    border: 1px solid rgba(229,229,229,0.10);
    border-radius: 16px;
    background: rgba(229,229,229,0.04);
    padding: 16px;
  }
  .jrv-avatar {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    overflow: hidden;
    border: 1px solid rgba(229,229,229,0.12);
    background: linear-gradient(135deg, #3E4A51, #5B6E7F);
    display: grid;
    place-items: center;
    flex-shrink: 0;
  }
  .jrv-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .jrv-avatar-fallback {
    font-size: 22px;
    font-weight: 700;
    color: rgba(229,229,229,0.78);
  }
  .jrv-name {
    margin: 0;
    font-family: 'DM Serif Display', serif;
    font-size: 28px;
    font-weight: 400;
  }
  .jrv-job {
    margin-top: 6px;
    font-size: 13px;
    color: rgba(229,229,229,0.66);
  }
  .jrv-field {
    display: grid;
    gap: 8px;
  }
  .jrv-label {
    font-size: 11px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(229,229,229,0.40);
  }
  .jrv-select,
  .jrv-textarea {
    width: 100%;
    border-radius: 14px;
    border: 1px solid rgba(229,229,229,0.12);
    background: rgba(229,229,229,0.05);
    color: #EAEAEA;
    padding: 14px;
    font: inherit;
  }
  .jrv-textarea {
    min-height: 150px;
    resize: vertical;
  }
  .jrv-stars {
    display: flex;
    gap: 8px;
  }
  .jrv-star-btn {
    min-width: 48px;
    min-height: 48px;
    border-radius: 14px;
    border: 1px solid rgba(229,229,229,0.12);
    background: rgba(229,229,229,0.05);
    color: #EAEAEA;
    cursor: pointer;
    font-size: 20px;
  }
  .jrv-star-btn.active {
    background: rgba(246,196,83,0.18);
    border-color: rgba(246,196,83,0.34);
    color: #F6C453;
  }
  .jrv-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }
  .jrv-btn,
  .jrv-link-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 46px;
    border-radius: 14px;
    padding: 0 18px;
    border: 1px solid rgba(229,229,229,0.12);
    background: rgba(229,229,229,0.08);
    color: #E5E5E5;
    text-decoration: none;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    cursor: pointer;
  }
  .jrv-btn.primary {
    background: #26A69A;
    border-color: transparent;
    color: #fff;
  }
  .jrv-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .jrv-state {
    padding: 12px 14px;
    border-radius: 14px;
    border: 1px solid rgba(229,229,229,0.08);
    background: rgba(229,229,229,0.05);
    font-size: 13px;
    line-height: 1.7;
    color: rgba(229,229,229,0.70);
  }
  .jrv-state.error {
    border-color: rgba(183,91,91,0.36);
    background: rgba(183,91,91,0.12);
    color: rgba(255,220,220,0.92);
  }
  .jrv-state.ok {
    border-color: rgba(38,166,154,0.34);
    background: rgba(38,166,154,0.12);
    color: rgba(229,245,242,0.94);
  }
`;

function getInitials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "GB"
  );
}

export default function JobReviewClient({
  jobId,
  requestId,
}: {
  jobId: string;
  requestId: string;
}) {
  const { user: meUser, loading: meLoading } = useMe();
  const me = (meUser ?? null) as { _id?: string } | null;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [job, setJob] = useState<JobDetails | null>(null);
  const [offer, setOffer] = useState<JobApplication | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    if (meLoading) return;
    setLoading(true);
    setError(null);
    try {
      const [jobResponse, applicationsResponse] = await Promise.all([
        fetch(`/api/jobs/${encodeURIComponent(jobId)}${me?._id ? `?userId=${encodeURIComponent(me._id)}` : ""}`, {
          method: "GET",
          cache: "no-store",
        }),
        fetchJobApplications(jobId),
      ]);

      const jobPayload = (await jobResponse.json()) as JobDetailsEnvelope;
      if (!jobResponse.ok || jobPayload.success === false) {
        throw new Error(jobPayload.message || `Unable to load job (${jobResponse.status})`);
      }

      const nextJob = normalizeJobDetails(jobPayload);
      if (!nextJob) {
        throw new Error("Job details were unavailable.");
      }

      const applications = normalizeApplicationsResponse(applicationsResponse);
      const nextOffer = findApplicationByRequestId(applications, requestId);
      if (!nextOffer) {
        throw new Error("We could not find that completed job request.");
      }

      setJob(nextJob);
      setOffer(nextOffer);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to load the review page.");
    } finally {
      setLoading(false);
    }
  }, [jobId, me?._id, meLoading, requestId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const isOwner = Boolean(me?._id && getJobOwnerId(job) && me._id === getJobOwnerId(job));
  const worker = getApplicationWorker(offer);
  const workerId = getApplicationWorkerId(offer);
  const workerName = getUserFullName(worker) || "Worker";
  const workerAvatar = resolveUserImageUrl(worker?.image);
  const jobTitle = getJobTitle(job);
  const ratedByMe = Number(job?.ratedbyme ?? 0) === 1;

  async function handleSubmit() {
    if (!isOwner || !workerId || !job?._id) return;
    if (!comment.trim()) {
      setError("Please add a short review comment.");
      return;
    }
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      await addReview({
        reciver_userId: workerId,
        rating,
        comment: comment.trim(),
        jobId: job._id,
      });
      setMessage(`Review submitted for ${workerName}.`);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to submit review.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <style>{styles}</style>
      <div className="jrv-root">
        <div className="jrv-shell">
          <section className="jrv-card">
            <div className="jrv-head">
              <p className="jrv-kicker">Post-completion review</p>
              <h1 className="jrv-title">Rate the completed work</h1>
              <p className="jrv-subtitle">
                This uses the existing Gumboot review contract after the job has been confirmed and paid.
              </p>
            </div>

            {loading ? (
              <div className="jrv-body"><div className="jrv-state">Loading review form…</div></div>
            ) : error && !job ? (
              <div className="jrv-body"><div className="jrv-state error">{error}</div></div>
            ) : !job || !offer ? (
              <div className="jrv-body"><div className="jrv-state error">This review is no longer available.</div></div>
            ) : !isOwner ? (
              <div className="jrv-body"><div className="jrv-state error">Only the customer who owns this job can submit this review.</div></div>
            ) : (
              <div className="jrv-body">
                <div className="jrv-summary">
                  <div className="jrv-avatar" aria-hidden="true">
                    {workerAvatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={workerAvatar} alt={workerName} />
                    ) : (
                      <span className="jrv-avatar-fallback">{getInitials(workerName)}</span>
                    )}
                  </div>
                  <div>
                    <h2 className="jrv-name">{workerName}</h2>
                    <div className="jrv-job">{jobTitle}</div>
                  </div>
                </div>

                {error ? <div className="jrv-state error">{error}</div> : null}
                {message ? <div className="jrv-state ok">{message}</div> : null}
                {ratedByMe ? (
                  <div className="jrv-state ok">You have already reviewed this completed job.</div>
                ) : (
                  <>
                    <div className="jrv-field">
                      <div className="jrv-label">Overall rating</div>
                      <div className="jrv-stars">
                        {[1, 2, 3, 4, 5].map((value) => (
                          <button
                            key={value}
                            type="button"
                            className={`jrv-star-btn${rating === value ? " active" : ""}`}
                            onClick={() => setRating(value)}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="jrv-field">
                      <div className="jrv-label">Review comment</div>
                      <textarea
                        className="jrv-textarea"
                        value={comment}
                        onChange={(event) => setComment(event.target.value)}
                        placeholder="Share how the job went, what stood out, and whether you would work with them again."
                      />
                    </div>

                    <div className="jrv-actions">
                      <button type="button" className="jrv-btn primary" onClick={handleSubmit} disabled={submitting}>
                        {submitting ? "Submitting…" : "Submit review"}
                      </button>
                      <Link className="jrv-link-btn" href={`/jobs/${encodeURIComponent(job._id || jobId)}`}>
                        Back to job
                      </Link>
                    </div>
                  </>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
