"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchJobApplications,
  findApplicationByRequestId,
  getApplicationWorker,
  getApplicationWorkerId,
  normalizeApplicationsResponse,
  updateJobApplicationStatus,
  type JobApplication,
} from "@/lib/applications";
import type { ApiEnvelope } from "@/lib/apiTypes";
import { resolveUserImageUrl } from "@/lib/messages";
import {
  buildPublicProfileHref,
  fetchWorkerPublicProfile,
  type WorkerCompletedJob,
  type WorkerPublicProfileBody,
} from "@/lib/publicProfiles";
import { useMe } from "@/lib/useMe";

type UserValue =
  | string
  | {
      _id?: string;
      firstname?: string;
      lastname?: string;
      image?: string;
    }
  | null
  | undefined;

type JobDetails = {
  _id?: string;
  job_title?: string;
  description?: string;
  price?: string | number;
  job_status?: string | number;
  userId?: UserValue;
  image?: Array<{ url?: string }> | null;
};

type JobDetailsEnvelope = ApiEnvelope<JobDetails | { getdetails?: JobDetails }>;

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');

  .ofr-root * { box-sizing: border-box; }
  .ofr-root {
    min-height: calc(100vh - 56px);
    padding: 28px 16px 72px;
    color: #E5E5E5;
    font-family: 'DM Sans', sans-serif;
    background:
      radial-gradient(900px 540px at 8% 0%, rgba(91,110,127,0.18), transparent 60%),
      linear-gradient(180deg, #2A3439 0%, #243036 100%);
  }
  .ofr-shell {
    max-width: 980px;
    margin: 0 auto;
    display: grid;
    gap: 16px;
  }
  .ofr-card {
    border: 1px solid rgba(229,229,229,0.10);
    border-radius: 18px;
    background: rgba(62,74,81,0.82);
    box-shadow: 0 18px 50px rgba(0,0,0,0.28);
    backdrop-filter: blur(10px);
    overflow: hidden;
  }
  .ofr-head {
    padding: 22px 22px 16px;
    border-bottom: 1px solid rgba(229,229,229,0.08);
  }
  .ofr-kicker {
    margin: 0 0 8px;
    font-size: 10px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: rgba(229,229,229,0.42);
  }
  .ofr-title {
    margin: 0;
    font-family: 'DM Serif Display', serif;
    font-size: 32px;
    font-weight: 400;
    line-height: 1.04;
  }
  .ofr-subtitle {
    margin: 10px 0 0;
    color: rgba(229,229,229,0.62);
    line-height: 1.7;
    font-size: 13px;
  }
  .ofr-body {
    padding: 22px;
    display: grid;
    gap: 18px;
  }
  .ofr-job-strip {
    display: grid;
    gap: 10px;
    border: 1px solid rgba(229,229,229,0.08);
    border-radius: 20px;
    background:
      radial-gradient(circle at top right, rgba(38,166,154,0.12), transparent 42%),
      rgba(229,229,229,0.04);
    padding: 18px;
  }
  .ofr-job-title {
    font-size: 22px;
    font-weight: 700;
    color: #F0F0F0;
  }
  .ofr-job-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .ofr-pill {
    display: inline-flex;
    align-items: center;
    min-height: 28px;
    padding: 0 10px;
    border-radius: 999px;
    border: 1px solid rgba(229,229,229,0.10);
    background: rgba(229,229,229,0.06);
    color: rgba(229,229,229,0.70);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .ofr-profile-card {
    display: grid;
    gap: 16px;
    padding: 18px;
    border-radius: 20px;
    border: 1px solid rgba(38,166,154,0.18);
    background:
      radial-gradient(440px 220px at top right, rgba(38,166,154,0.18), rgba(0,0,0,0) 65%),
      linear-gradient(180deg, rgba(52,64,70,0.92), rgba(41,51,56,0.96));
    text-decoration: none;
    color: inherit;
    transition: transform 0.14s ease, border-color 0.14s ease, box-shadow 0.14s ease;
  }
  .ofr-profile-card:hover {
    transform: translateY(-1px);
    border-color: rgba(38,166,154,0.40);
    box-shadow: 0 18px 36px rgba(14,22,24,0.18);
  }
  .ofr-profile-top {
    display: flex;
    gap: 14px;
    align-items: flex-start;
  }
  .ofr-avatar {
    width: 76px;
    height: 76px;
    border-radius: 50%;
    border: 1px solid rgba(229,229,229,0.12);
    overflow: hidden;
    display: grid;
    place-items: center;
    background: linear-gradient(135deg, #3E4A51, #5B6E7F);
    flex-shrink: 0;
  }
  .ofr-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .ofr-avatar-fallback {
    font-size: 22px;
    font-weight: 700;
    color: rgba(229,229,229,0.80);
  }
  .ofr-name {
    margin: 0;
    font-family: 'DM Serif Display', serif;
    font-size: 28px;
    font-weight: 400;
    line-height: 1.02;
  }
  .ofr-profile-intro {
    display: grid;
    gap: 4px;
  }
  .ofr-profile-label {
    font-size: 10px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgba(229,229,229,0.42);
  }
  .ofr-mini {
    margin-top: 8px;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    color: rgba(229,229,229,0.66);
    font-size: 12px;
  }
  .ofr-stars {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    color: #F6C453;
    font-size: 14px;
  }
  .ofr-summary-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
  }
  @media (max-width: 760px) {
    .ofr-summary-grid {
      grid-template-columns: 1fr;
    }
  }
  .ofr-summary-card {
    border: 1px solid rgba(229,229,229,0.08);
    border-radius: 18px;
    background: rgba(229,229,229,0.035);
    padding: 14px 16px;
  }
  .ofr-summary-label {
    font-size: 10px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgba(229,229,229,0.34);
  }
  .ofr-summary-value {
    margin-top: 6px;
    font-size: 18px;
    font-weight: 700;
    color: #F7F7F7;
  }
  .ofr-offer-card {
    display: grid;
    gap: 16px;
    border: 1px solid rgba(229,229,229,0.08);
    border-radius: 22px;
    background:
      linear-gradient(180deg, rgba(42,52,57,0.74), rgba(34,43,47,0.88));
    padding: 20px;
  }
  .ofr-offer-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    flex-wrap: wrap;
  }
  .ofr-offer-label {
    font-size: 10px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgba(229,229,229,0.40);
  }
  .ofr-offer-price {
    margin-top: 6px;
    font-family: 'DM Serif Display', serif;
    font-size: 44px;
    line-height: 1;
    color: #F4FBFA;
  }
  .ofr-status {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 30px;
    padding: 0 12px;
    border-radius: 999px;
    border: 1px solid rgba(229,229,229,0.10);
    background: rgba(229,229,229,0.06);
    color: rgba(229,229,229,0.80);
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .ofr-message {
    border: 1px solid rgba(229,229,229,0.08);
    border-radius: 16px;
    background: rgba(229,229,229,0.035);
    padding: 14px;
  }
  .ofr-message-copy {
    margin-top: 8px;
    line-height: 1.75;
    color: rgba(229,229,229,0.74);
    white-space: pre-wrap;
    font-size: 14px;
  }
  .ofr-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }
  .ofr-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 46px;
    border-radius: 14px;
    padding: 0 18px;
    border: 1px solid rgba(229,229,229,0.12);
    background: rgba(229,229,229,0.08);
    color: #E5E5E5;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    cursor: pointer;
  }
  .ofr-btn.primary {
    background: linear-gradient(180deg, #29b3a6, #1f978c);
    border-color: transparent;
    color: #fff;
    box-shadow: 0 12px 26px rgba(38,166,154,0.22);
  }
  .ofr-btn.danger {
    background: rgba(183,91,91,0.18);
    border-color: rgba(183,91,91,0.32);
    color: #FFE1E1;
  }
  .ofr-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .ofr-note {
    font-size: 13px;
    line-height: 1.7;
    color: rgba(229,229,229,0.62);
  }
  .ofr-status-banner {
    border-radius: 14px;
    padding: 12px 14px;
    font-size: 13px;
    line-height: 1.7;
  }
  .ofr-status-banner.ok {
    border: 1px solid rgba(38,166,154,0.34);
    background: rgba(38,166,154,0.12);
    color: rgba(229,245,242,0.94);
  }
  .ofr-status-banner.error {
    border: 1px solid rgba(183,91,91,0.38);
    background: rgba(183,91,91,0.14);
    color: rgba(255,220,220,0.92);
  }
  .ofr-work-list {
    display: grid;
    gap: 10px;
  }
  .ofr-work-item {
    border: 1px solid rgba(229,229,229,0.10);
    border-radius: 14px;
    background: rgba(229,229,229,0.04);
    padding: 12px 14px;
  }
  .ofr-work-head {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    align-items: center;
    margin-bottom: 8px;
  }
  .ofr-work-name {
    font-size: 13px;
    font-weight: 700;
    color: #F0F0F0;
  }
  .ofr-work-copy {
    color: rgba(229,229,229,0.68);
    line-height: 1.65;
    font-size: 13px;
  }
  .ofr-loading,
  .ofr-empty {
    padding: 26px 22px;
    color: rgba(229,229,229,0.58);
    font-size: 13px;
    line-height: 1.7;
  }
  .ofr-dropdown {
    border: 1px solid rgba(229,229,229,0.08);
    border-radius: 20px;
    background: rgba(229,229,229,0.035);
    overflow: hidden;
  }
  .ofr-dropdown-trigger {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    border: none;
    background: transparent;
    color: #E5E5E5;
    padding: 16px 18px;
    text-align: left;
    cursor: pointer;
  }
  .ofr-dropdown-copy {
    display: grid;
    gap: 5px;
  }
  .ofr-dropdown-label {
    font-size: 10px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgba(229,229,229,0.40);
  }
  .ofr-dropdown-title {
    font-size: 18px;
    font-weight: 700;
    color: #F5F5F5;
  }
  .ofr-dropdown-note {
    font-size: 13px;
    color: rgba(229,229,229,0.62);
  }
  .ofr-dropdown-chevron {
    flex-shrink: 0;
    color: rgba(229,229,229,0.74);
    transition: transform 0.16s ease;
  }
  .ofr-dropdown-chevron.open {
    transform: rotate(180deg);
  }
  .ofr-dropdown-body {
    padding: 0 18px 18px;
    display: grid;
    gap: 12px;
  }
`;

const STATUS_LABELS: Record<string, string> = {
  "0": "Open",
  "1": "Pending",
  "2": "Accepted",
  "3": "In Progress",
  "4": "Rejected",
  "5": "Cancelled",
  "6": "Completed by worker",
  "7": "Confirmed complete",
  "8": "Tracking started",
  "9": "Reached location",
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeJobDetails(payload: JobDetailsEnvelope): JobDetails | null {
  const body = payload.body;
  if (!body || !isObject(body)) return null;
  return isObject(body.getdetails) ? (body.getdetails as JobDetails) : (body as JobDetails);
}

function getJobOwnerId(job?: JobDetails | null) {
  const owner = job?.userId;
  if (!owner) return "";
  if (typeof owner === "string") return owner;
  return owner._id ?? "";
}

function getUserFullName(user?: { firstname?: string; lastname?: string } | null) {
  return [user?.firstname, user?.lastname].filter(Boolean).join(" ").trim() || "Unknown worker";
}

function getInitials(user?: { firstname?: string; lastname?: string } | null) {
  return [user?.firstname, user?.lastname]
    .filter((value): value is string => Boolean(value))
    .map((value) => value[0]?.toUpperCase())
    .join("") || "GB";
}

function formatMoney(value?: string | number | null) {
  if (value == null || value === "") return "Offer not set";
  return `$${value}`;
}

function formatStatus(status?: string | number | null) {
  const key = String(status ?? "");
  return STATUS_LABELS[key] || (key ? `Status ${key}` : "Unknown");
}

function formatReviewCount(count?: number) {
  if (!count) return "No reviews yet";
  return `${count} review${count === 1 ? "" : "s"}`;
}

function toFiniteNumber(value?: string | number | null) {
  const parsed = typeof value === "string" ? Number(value) : value ?? 0;
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function OfferReviewClient({ jobId, requestId }: { jobId: string; requestId: string }) {
  const router = useRouter();
  const { user: meUser, loading: meLoading } = useMe();
  const me = (meUser ?? null) as { _id?: string } | null;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState<"accept" | "deny" | null>(null);
  const [job, setJob] = useState<JobDetails | null>(null);
  const [offer, setOffer] = useState<JobApplication | null>(null);
  const [offers, setOffers] = useState<JobApplication[]>([]);
  const [workerProfile, setWorkerProfile] = useState<WorkerPublicProfileBody | null>(null);
  const [pastWorkOpen, setPastWorkOpen] = useState(false);

  const loadOffer = useCallback(async () => {
    if (meLoading) return;
    setLoading(true);
    setError(null);
    try {
      const jobResponse = await fetch(
        `/api/jobs/${encodeURIComponent(jobId)}${me?._id ? `?userId=${encodeURIComponent(me._id)}` : ""}`,
        { method: "GET", cache: "no-store" }
      );
      const jobPayload = (await jobResponse.json()) as JobDetailsEnvelope;
      if (!jobResponse.ok || jobPayload.success === false) {
        throw new Error(jobPayload.message || `Unable to load job (${jobResponse.status})`);
      }

      const nextJob = normalizeJobDetails(jobPayload);
      if (!nextJob) throw new Error("Job details were unavailable.");

      const applicationsResponse = await fetchJobApplications(jobId);
      const applications = normalizeApplicationsResponse(applicationsResponse);
      const nextOffer = findApplicationByRequestId(applications, requestId);
      if (!nextOffer) {
        throw new Error("We could not find that offer request for this job.");
      }

      const workerId = getApplicationWorkerId(nextOffer);
      const workerProfileResponse = workerId
        ? await fetchWorkerPublicProfile(workerId, requestId)
        : null;
      if (workerProfileResponse) {
        console.debug("[offer-review] worker_public_profile response", workerProfileResponse);
      }

      setJob(nextJob);
      setOffers(applications);
      setOffer(nextOffer);
      setWorkerProfile(workerProfileResponse?.body ?? null);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to load this offer.");
    } finally {
      setLoading(false);
    }
  }, [jobId, me?._id, meLoading, requestId]);

  useEffect(() => {
    void loadOffer();
  }, [loadOffer]);

  const isOwner = me?._id != null && me._id === getJobOwnerId(job);
  const worker = useMemo(() => {
    const fromOffer = getApplicationWorker(offer);
    if (fromOffer) return fromOffer;
    return workerProfile?.workerDetails ?? workerProfile?.userDetail ?? null;
  }, [offer, workerProfile]);
  const workerName = getUserFullName(worker);
  const workerAvatar = resolveUserImageUrl(worker?.image);
  const workerRating = toFiniteNumber(workerProfile?.ratingdata?.averageRating);
  const workerReviewCount = toFiniteNumber(workerProfile?.ratingdata?.count);
  const completedJobsCount = Number(workerProfile?.completedJobs?.length ?? 0);
  const completedJobs = (workerProfile?.completedJobs ?? []).slice(0, 3);
  const offerPrice = offer?.offered_price ?? workerProfile?.offerPrice?.offered_price ?? job?.price ?? "";
  const offerMessage = offer?.message?.trim() || workerProfile?.offerPrice?.message?.trim() || "";
  const profileHref = buildPublicProfileHref({
    userId: getApplicationWorkerId(offer),
    jobId: requestId,
  });
  const acceptedOffer = useMemo(
    () => offers.find((item) => ["2", "3", "6", "7", "8", "9"].includes(String(item.job_status ?? ""))) ?? null,
    [offers]
  );
  const offerAccepted = String(offer?.job_status ?? "") === "2";
  const decisionsClosed = Boolean(acceptedOffer);
  const canAct = isOwner && !decisionsClosed && ["0", "1", "4"].includes(String(offer?.job_status ?? "1"));

  async function handleDecision(nextStatus: 2 | 4) {
    if (!offer?._id) return;
    setActionBusy(nextStatus === 2 ? "accept" : "deny");
    setError(null);
    setMessage(null);
    try {
      await updateJobApplicationStatus({
        jobRequested_id: offer._id,
        job_id: jobId,
        job_status: nextStatus,
      });
      setMessage(nextStatus === 2 ? "Offer accepted successfully." : "Offer denied successfully.");
      await loadOffer();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to update this offer.");
    } finally {
      setActionBusy(null);
    }
  }

  return (
    <>
      <style>{styles}</style>
      <div className="ofr-root">
        <div className="ofr-shell">
          <section className="ofr-card">
            <div className="ofr-head">
              <p className="ofr-kicker">Marketplace offer review</p>
              <h1 className="ofr-title">Review this offer</h1>
              <p className="ofr-subtitle">
                Check the applicant profile, their rating, and the message that came with this offer before you accept or deny it.
              </p>
            </div>

            {loading ? (
              <div className="ofr-loading">Loading offer details…</div>
            ) : error ? (
              <div className="ofr-body">
                <div className="ofr-status-banner error">{error}</div>
                <div className="ofr-actions">
                  <button type="button" className="ofr-btn" onClick={() => router.push(`/jobs/${encodeURIComponent(jobId)}`)}>
                    Back to job
                  </button>
                </div>
              </div>
            ) : !job || !offer ? (
              <div className="ofr-empty">This offer is no longer available.</div>
            ) : (
              <div className="ofr-body">
                <div className="ofr-job-strip">
                  <div className="ofr-job-title">{job.job_title || "Job"}</div>
                  <div className="ofr-job-meta">
                    <span className="ofr-pill">Job #{job._id?.slice(-6) ?? jobId.slice(-6)}</span>
                    <span className="ofr-pill">{formatStatus(offer.job_status)}</span>
                  </div>
                </div>

                {message ? <div className="ofr-status-banner ok">{message}</div> : null}
                {error ? <div className="ofr-status-banner error">{error}</div> : null}
                {offerAccepted ? <div className="ofr-status-banner ok">✓ Job has been accepted.</div> : null}

                <Link className="ofr-profile-card" href={profileHref}>
                  <div className="ofr-profile-top">
                    <div className="ofr-avatar" aria-hidden="true">
                      {workerAvatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={workerAvatar} alt={workerName} />
                      ) : (
                        <span className="ofr-avatar-fallback">{getInitials(worker)}</span>
                      )}
                    </div>
                    <div>
                      <div className="ofr-profile-intro">
                        <span className="ofr-profile-label">Applicant profile</span>
                      </div>
                      <h2 className="ofr-name">{workerName}</h2>
                      <div className="ofr-mini">
                        <span className="ofr-stars" aria-label={`Rating ${workerRating.toFixed(1)} out of 5`}>
                          ★ {workerRating.toFixed(1)}
                        </span>
                        <span>{formatReviewCount(workerReviewCount)}</span>
                        <span>{completedJobsCount} completed job{completedJobsCount === 1 ? "" : "s"}</span>
                      </div>
                    </div>
                  </div>
                  <div className="ofr-note">Open full profile to inspect past work, reviews, and more details.</div>
                </Link>

                <div className="ofr-summary-grid">
                  <div className="ofr-summary-card">
                    <div className="ofr-summary-label">Offer amount</div>
                    <div className="ofr-summary-value">{formatMoney(offerPrice)}</div>
                  </div>
                  <div className="ofr-summary-card">
                    <div className="ofr-summary-label">Rating</div>
                    <div className="ofr-summary-value">{workerRating.toFixed(1)} / 5</div>
                  </div>
                  <div className="ofr-summary-card">
                    <div className="ofr-summary-label">Reviews</div>
                    <div className="ofr-summary-value">{workerReviewCount || 0}</div>
                  </div>
                </div>

                <div className="ofr-offer-card">
                  <div className="ofr-offer-row">
                    <div>
                      <div className="ofr-offer-label">Offer price</div>
                      <div className="ofr-offer-price">{formatMoney(offerPrice)}</div>
                    </div>
                    <div className="ofr-status">{formatStatus(offer.job_status)}</div>
                  </div>

                  <div className="ofr-message">
                    <div className="ofr-offer-label">Offer message</div>
                    <div className="ofr-message-copy">
                      {offerMessage || "No message was attached to this offer."}
                    </div>
                  </div>

                  {canAct ? (
                    <div className="ofr-actions">
                      <button
                        type="button"
                        className="ofr-btn primary"
                        disabled={actionBusy !== null}
                        onClick={() => void handleDecision(2)}
                      >
                        {actionBusy === "accept" ? "Accepting…" : "Accept"}
                      </button>
                      <button
                        type="button"
                        className="ofr-btn danger"
                        disabled={actionBusy !== null}
                        onClick={() => void handleDecision(4)}
                      >
                        {actionBusy === "deny" ? "Denying…" : "Deny"}
                      </button>
                    </div>
                  ) : (
                    <div className="ofr-note">
                      {isOwner
                        ? offerAccepted
                          ? "This worker has already been accepted for the job."
                          : decisionsClosed
                            ? "A worker has already been accepted for this job, so offer decisions are now closed."
                            : "This offer is no longer awaiting a decision."
                        : "Only the job owner can accept or deny this offer."}
                    </div>
                  )}
                </div>
                <div className="ofr-dropdown">
                  <button
                    type="button"
                    className="ofr-dropdown-trigger"
                    aria-expanded={pastWorkOpen}
                    onClick={() => setPastWorkOpen((open) => !open)}
                  >
                    <span className="ofr-dropdown-copy">
                      <span className="ofr-dropdown-label">Previous work</span>
                      <span className="ofr-dropdown-title">Past work and reviews</span>
                      <span className="ofr-dropdown-note">
                        {completedJobs.length > 0
                          ? `${completedJobsCount} completed job${completedJobsCount === 1 ? "" : "s"} on this profile`
                          : "No completed-work summary is available yet"}
                      </span>
                    </span>
                    <svg
                      className={`ofr-dropdown-chevron${pastWorkOpen ? " open" : ""}`}
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="m6 9 6 6 6-6"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>

                  {pastWorkOpen ? (
                    <div className="ofr-dropdown-body">
                      {completedJobs.length > 0 ? (
                        <>
                          <div className="ofr-work-list">
                            {completedJobs.map((completedJob: WorkerCompletedJob) => {
                              const completedTitle = completedJob.jobId?.job_title?.trim() || "Completed job";
                              const completedPrice = completedJob.jobId?.offered_price ?? completedJob.jobId?.price ?? "";
                              const completedDescription = completedJob.jobId?.description?.trim() || "No extra job description available.";
                              return (
                                <div className="ofr-work-item" key={completedJob._id ?? `${completedTitle}-${completedJob.createdAt ?? ""}`}>
                                  <div className="ofr-work-head">
                                    <div className="ofr-work-name">{completedTitle}</div>
                                    <div className="ofr-stars">{formatMoney(completedPrice)}</div>
                                  </div>
                                  <div className="ofr-work-copy">
                                    {completedDescription}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          {profileHref !== "#" ? (
                            <Link className="ofr-btn" href={profileHref}>
                              View full profile
                            </Link>
                          ) : null}
                        </>
                      ) : (
                        <div className="ofr-note">
                          No completed-work summary is available yet for this profile. You can still open the full profile for the rating and any other public details.
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
