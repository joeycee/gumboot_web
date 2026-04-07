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
  updateJobLifecycleStatus,
  type JobApplication,
} from "@/lib/applications";
import {
  getJobDescription,
  getJobOwnerId,
  getJobTitle,
  getUserFullName,
  getWorkerUploadedImages,
  normalizeJobDetails,
  type JobDetails,
  type JobDetailsEnvelope,
  type JobImageValue,
} from "@/lib/jobFlow";
import { resolveChatMediaUrl, resolveUserImageUrl } from "@/lib/messages";
import { extractCardsFromResponse, getSavedCards, recordJobPayment } from "@/lib/payments";
import { buildPublicProfileHref, fetchWorkerPublicProfile, type WorkerPublicProfileBody } from "@/lib/publicProfiles";
import { stripePromise } from "@/lib/stripe";
import { useMe } from "@/lib/useMe";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500&display=swap');

  .jcr-root * { box-sizing: border-box; }
  .jcr-root {
    min-height: calc(100vh - 56px);
    padding: 26px 16px 72px;
    color: #E5E5E5;
    font-family: 'DM Sans', sans-serif;
    background:
      radial-gradient(900px 540px at 10% 0%, rgba(91,110,127,0.18), transparent 60%),
      linear-gradient(180deg, #2A3439 0%, #243036 100%);
  }
  .jcr-shell {
    max-width: 1080px;
    margin: 0 auto;
    display: grid;
    gap: 16px;
  }
  @media (min-width: 980px) {
    .jcr-shell {
      grid-template-columns: minmax(0, 1.1fr) minmax(320px, 0.9fr);
      align-items: start;
    }
  }
  .jcr-card {
    border: 1px solid rgba(229,229,229,0.10);
    border-radius: 20px;
    background: rgba(62,74,81,0.82);
    box-shadow: 0 18px 50px rgba(0,0,0,0.28);
    backdrop-filter: blur(10px);
    overflow: hidden;
  }
  .jcr-head {
    padding: 22px;
    border-bottom: 1px solid rgba(229,229,229,0.08);
  }
  .jcr-kicker {
    margin: 0 0 8px;
    font-size: 10px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: rgba(229,229,229,0.40);
  }
  .jcr-title {
    margin: 0;
    font-family: 'DM Serif Display', serif;
    font-size: 32px;
    font-weight: 400;
    line-height: 1.04;
  }
  .jcr-subtitle {
    margin: 10px 0 0;
    color: rgba(229,229,229,0.60);
    line-height: 1.7;
    font-size: 13px;
  }
  .jcr-body {
    padding: 22px;
    display: grid;
    gap: 16px;
  }
  .jcr-strip,
  .jcr-block,
  .jcr-gallery-card {
    border: 1px solid rgba(229,229,229,0.10);
    border-radius: 16px;
    background: rgba(229,229,229,0.04);
    padding: 16px;
  }
  .jcr-job-title {
    font-size: 22px;
    font-weight: 700;
    color: #F5F5F5;
  }
  .jcr-meta {
    margin-top: 10px;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .jcr-pill {
    display: inline-flex;
    align-items: center;
    min-height: 28px;
    padding: 0 10px;
    border-radius: 999px;
    border: 1px solid rgba(229,229,229,0.10);
    background: rgba(229,229,229,0.06);
    color: rgba(229,229,229,0.74);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .jcr-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 10px;
  }
  .jcr-label {
    font-size: 10px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgba(229,229,229,0.34);
  }
  .jcr-value {
    margin-top: 6px;
    font-size: 15px;
    line-height: 1.6;
    color: rgba(245,245,245,0.94);
  }
  .jcr-value.price {
    font-size: 26px;
    font-family: 'DM Serif Display', serif;
  }
  .jcr-profile {
    display: grid;
    gap: 14px;
    padding: 16px;
    border-radius: 18px;
    border: 1px solid rgba(38,166,154,0.20);
    background:
      radial-gradient(440px 220px at top right, rgba(38,166,154,0.16), rgba(0,0,0,0) 65%),
      rgba(42,52,57,0.86);
    text-decoration: none;
    color: inherit;
  }
  .jcr-profile-top {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .jcr-avatar {
    width: 74px;
    height: 74px;
    border-radius: 50%;
    overflow: hidden;
    border: 1px solid rgba(229,229,229,0.12);
    background: linear-gradient(135deg, #3E4A51, #5B6E7F);
    display: grid;
    place-items: center;
    flex-shrink: 0;
  }
  .jcr-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .jcr-avatar-fallback {
    font-size: 22px;
    font-weight: 700;
    color: rgba(229,229,229,0.78);
  }
  .jcr-name {
    margin: 0;
    font-family: 'DM Serif Display', serif;
    font-size: 30px;
    font-weight: 400;
    line-height: 1.02;
  }
  .jcr-mini {
    margin-top: 8px;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    font-size: 12px;
    color: rgba(229,229,229,0.66);
  }
  .jcr-stars {
    color: #F6C453;
  }
  .jcr-copy {
    font-size: 14px;
    line-height: 1.8;
    color: rgba(229,229,229,0.74);
    white-space: pre-wrap;
  }
  .jcr-gallery {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 10px;
  }
  .jcr-image-btn {
    border: 1px solid rgba(229,229,229,0.10);
    border-radius: 14px;
    overflow: hidden;
    background: rgba(229,229,229,0.05);
    cursor: pointer;
    padding: 0;
    min-height: 140px;
  }
  .jcr-image-btn img {
    width: 100%;
    height: 100%;
    min-height: 140px;
    object-fit: cover;
    display: block;
  }
  .jcr-note,
  .jcr-state {
    font-size: 13px;
    line-height: 1.7;
    color: rgba(229,229,229,0.62);
  }
  .jcr-state {
    padding: 12px 14px;
    border-radius: 14px;
    border: 1px solid rgba(229,229,229,0.08);
    background: rgba(229,229,229,0.05);
  }
  .jcr-state.error {
    border-color: rgba(183,91,91,0.36);
    background: rgba(183,91,91,0.12);
    color: rgba(255,220,220,0.92);
  }
  .jcr-state.ok {
    border-color: rgba(38,166,154,0.34);
    background: rgba(38,166,154,0.12);
    color: rgba(229,245,242,0.94);
  }
  .jcr-actions {
    display: grid;
    gap: 10px;
  }
  .jcr-btn,
  .jcr-link-btn {
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
  .jcr-btn.primary {
    background: #26A69A;
    border-color: transparent;
    color: #fff;
  }
  .jcr-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .jcr-empty,
  .jcr-loading {
    padding: 28px 22px;
    color: rgba(229,229,229,0.58);
    font-size: 13px;
    line-height: 1.7;
  }
  .jcr-lightbox {
    position: fixed;
    inset: 0;
    z-index: 70;
    background: rgba(9,13,18,0.92);
    display: grid;
    place-items: center;
    padding: 20px;
  }
  .jcr-lightbox-inner {
    max-width: min(1000px, 96vw);
    max-height: 92vh;
    display: grid;
    gap: 12px;
  }
  .jcr-lightbox img {
    max-width: 100%;
    max-height: 78vh;
    border-radius: 18px;
    border: 1px solid rgba(229,229,229,0.10);
  }
`;

function formatMoney(value?: string | number | null) {
  if (value == null || value === "") return "Not set";
  return `$${value}`;
}

function formatDateTime(value?: string | null) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

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

function toFiniteNumber(value?: string | number | null) {
  const parsed = typeof value === "string" ? Number(value) : value ?? 0;
  return Number.isFinite(parsed) ? parsed : 0;
}

function getJobStatusLabel(status?: string | number | null) {
  switch (String(status ?? "")) {
    case "6":
      return "Completed by worker";
    case "7":
      return "Finished";
    default:
      return `Status ${status ?? "unknown"}`;
  }
}

function getImageUrl(image?: JobImageValue) {
  return resolveChatMediaUrl(image?.url);
}

export default function CompletionReviewClient({
  jobId,
  requestId,
}: {
  jobId: string;
  requestId: string;
}) {
  const router = useRouter();
  const { user: meUser, loading: meLoading } = useMe();
  const me = (meUser ?? null) as { _id?: string } | null;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [job, setJob] = useState<JobDetails | null>(null);
  const [offer, setOffer] = useState<JobApplication | null>(null);
  const [workerProfile, setWorkerProfile] = useState<WorkerPublicProfileBody | null>(null);
  const [hasSavedCard, setHasSavedCard] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (meLoading) return;
    setLoading(true);
    setError(null);
    try {
      const [jobResponse, applicationsResponse, cardsResponse] = await Promise.all([
        fetch(`/api/jobs/${encodeURIComponent(jobId)}${me?._id ? `?userId=${encodeURIComponent(me._id)}` : ""}`, {
          method: "GET",
          cache: "no-store",
        }),
        fetchJobApplications(jobId),
        me?._id ? getSavedCards().catch(() => null) : Promise.resolve(null),
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
        throw new Error("We could not find the completion request for this job.");
      }

      const workerId = getApplicationWorkerId(nextOffer);
      const workerProfileResponse = workerId
        ? await fetchWorkerPublicProfile(workerId, requestId)
        : null;

      setJob(nextJob);
      setOffer(nextOffer);
      setWorkerProfile(workerProfileResponse?.body ?? null);
      setHasSavedCard(extractCardsFromResponse(cardsResponse).length > 0);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to load the completion review.");
    } finally {
      setLoading(false);
    }
  }, [jobId, me?._id, meLoading, requestId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const ownerId = getJobOwnerId(job);
  const isOwner = Boolean(me?._id && ownerId && me._id === ownerId);
  const worker = useMemo(() => {
    const fromOffer = getApplicationWorker(offer);
    if (fromOffer) return fromOffer;
    return workerProfile?.workerDetails ?? workerProfile?.userDetail ?? null;
  }, [offer, workerProfile]);
  const workerId = getApplicationWorkerId(offer);
  const workerName = getUserFullName(worker) || "Worker";
  const workerAvatar = resolveUserImageUrl(worker?.image);
  const workerRating = toFiniteNumber(workerProfile?.ratingdata?.averageRating);
  const workerReviewCount = toFiniteNumber(workerProfile?.ratingdata?.count);
  const afterImages = getWorkerUploadedImages(job?.image_after_job);
  const jobTitle = getJobTitle(job);
  const jobDescription = getJobDescription(job);
  const agreedPrice = offer?.offered_price ?? job?.offered_price ?? job?.price ?? "";
  const submittedAt = offer?.updatedAt ?? offer?.createdAt ?? null;
  const profileHref = buildPublicProfileHref({ userId: workerId, jobId: requestId });
  const canMessage = Boolean(me?._id && (isOwner || me?._id === workerId));
  const canComplete = isOwner && String(offer?.job_status ?? "") === "6";
  const alreadyFinished = String(offer?.job_status ?? "") === "7";
  const isParticipant = Boolean(me?._id && (isOwner || me?._id === workerId));

  async function openChat() {
    if (!workerId || !canMessage) return;
    const params = new URLSearchParams({ userId: workerId });
    if (workerName.trim()) params.set("name", workerName.trim());
    router.push(`/messages?${params.toString()}`);
  }

  async function handleCompleteJob() {
    if (!job?._id && !jobId) {
      setError("Job id is missing.");
      return;
    }
    if (!canComplete) return;
    if (!hasSavedCard) {
      setError("Add a saved card before confirming payment for this completed job.");
      return;
    }

    setActionBusy(true);
    setError(null);
    try {
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error("Stripe is not configured for this environment.");
      }

      const paymentResponse = await recordJobPayment({
        jobId: job?._id || jobId,
      });
      const clientSecret = paymentResponse.body?.clientSecret;
      if (!clientSecret) {
        throw new Error("Missing Stripe client secret.");
      }

      const result = await stripe.confirmCardPayment(clientSecret);
      if (result.error) {
        throw new Error(result.error.message || "Payment failed.");
      }
      if (result.paymentIntent?.status !== "succeeded" && result.paymentIntent?.status !== "processing") {
        throw new Error(`Payment status: ${result.paymentIntent?.status || "unknown"}`);
      }

      await updateJobLifecycleStatus({
        jobRequested_id: requestId,
        job_id: job?._id || jobId,
        job_status: 7,
      });

      router.push(`/jobs/${encodeURIComponent(job?._id || jobId)}/review/${encodeURIComponent(requestId)}`);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to complete this job.");
    } finally {
      setActionBusy(false);
    }
  }

  return (
    <>
      <style>{styles}</style>
      <div className="jcr-root">
        <div className="jcr-shell">
          <section className="jcr-card">
            <div className="jcr-head">
              <p className="jcr-kicker">Completed work review</p>
              <h1 className="jcr-title">Inspect submitted work</h1>
              <p className="jcr-subtitle">
                Review the worker&apos;s completion proof, inspect the uploaded images, message them if needed, and then confirm the final payment.
              </p>
            </div>

            {loading ? (
              <div className="jcr-loading">Loading the completed-work submission…</div>
            ) : error ? (
              <div className="jcr-body">
                <div className="jcr-state error">{error}</div>
                <Link className="jcr-link-btn" href={`/jobs/${encodeURIComponent(jobId)}`}>Back to job</Link>
              </div>
            ) : !job || !offer ? (
              <div className="jcr-empty">This completion submission is no longer available.</div>
            ) : !isParticipant ? (
              <div className="jcr-body">
                <div className="jcr-state error">Only the customer or accepted worker for this job can view this page.</div>
              </div>
            ) : (
              <div className="jcr-body">
                <div className="jcr-strip">
                  <div className="jcr-job-title">{jobTitle}</div>
                  <div className="jcr-meta">
                    <span className="jcr-pill">Job #{(job._id || jobId).slice(-6)}</span>
                    <span className="jcr-pill">{getJobStatusLabel(offer.job_status)}</span>
                    <span className="jcr-pill">Submitted {formatDateTime(submittedAt)}</span>
                  </div>
                </div>

                {error ? <div className="jcr-state error">{error}</div> : null}

                <div className="jcr-grid">
                  <div className="jcr-block">
                    <div className="jcr-label">Agreed price</div>
                    <div className="jcr-value price">{formatMoney(agreedPrice)}</div>
                  </div>
                  <div className="jcr-block">
                    <div className="jcr-label">Payment status</div>
                    <div className="jcr-value">
                      {alreadyFinished ? "Confirmed and paid" : canComplete ? "Awaiting customer sign-off" : getJobStatusLabel(offer.job_status)}
                    </div>
                  </div>
                  <div className="jcr-block">
                    <div className="jcr-label">Completion timestamp</div>
                    <div className="jcr-value">{formatDateTime(submittedAt)}</div>
                  </div>
                </div>

                <div className="jcr-block">
                  <div className="jcr-label">Job context</div>
                  <div className="jcr-value">{jobDescription || "No extra job description was added to this listing."}</div>
                </div>

                <div className="jcr-block">
                  <div className="jcr-label">Completion notes</div>
                  <div className="jcr-copy">
                    {jobDescription || "The current Flutter/backend contract does not store a separate completion note. The original job description is shown here as the closest available context."}
                  </div>
                </div>

                <div className="jcr-gallery-card">
                  <div className="jcr-label">Submitted completion images</div>
                  {afterImages.length > 0 ? (
                    <div className="jcr-gallery" style={{ marginTop: 12 }}>
                      {afterImages.map((image, index) => {
                        const src = getImageUrl(image);
                        if (!src) return null;
                        return (
                          <button
                            key={image?._id ?? `${src}-${index}`}
                            className="jcr-image-btn"
                            type="button"
                            onClick={() => setLightboxUrl(src)}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={src} alt={`Completed work ${index + 1}`} />
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="jcr-note" style={{ marginTop: 10 }}>
                      No after-work images were uploaded for this job.
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>

          <aside className="jcr-card">
            <div className="jcr-head">
              <p className="jcr-kicker">Worker</p>
              <h2 className="jcr-title" style={{ fontSize: 24 }}>Worker summary</h2>
            </div>

            {loading ? (
              <div className="jcr-loading">Loading profile summary…</div>
            ) : !job || !offer || !isParticipant ? (
              <div className="jcr-empty">No profile summary available.</div>
            ) : (
              <div className="jcr-body">
                <Link className="jcr-profile" href={profileHref}>
                  <div className="jcr-profile-top">
                    <div className="jcr-avatar" aria-hidden="true">
                      {workerAvatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={workerAvatar} alt={workerName} />
                      ) : (
                        <span className="jcr-avatar-fallback">{getInitials(workerName)}</span>
                      )}
                    </div>
                    <div>
                      <h2 className="jcr-name">{workerName}</h2>
                      <div className="jcr-mini">
                        <span className="jcr-stars">★ {workerRating.toFixed(1)}</span>
                        <span>{workerReviewCount} review{workerReviewCount === 1 ? "" : "s"}</span>
                      </div>
                    </div>
                  </div>
                  <div className="jcr-note">Open the full profile to inspect public reviews and past work.</div>
                </Link>

                {!hasSavedCard && isOwner && String(offer.job_status ?? "") === "6" ? (
                  <div className="jcr-state">
                    Add a saved card before confirming payment.
                    {" "}
                    <Link href="/profile/payments" style={{ color: "#fff", fontWeight: 700 }}>
                      Open wallet & payments
                    </Link>
                  </div>
                ) : null}

                <div className="jcr-actions">
                  <button type="button" className="jcr-btn" onClick={openChat} disabled={!canMessage}>
                    Message user
                  </button>
                  {canComplete ? (
                    <button type="button" className="jcr-btn primary" onClick={handleCompleteJob} disabled={actionBusy}>
                      {actionBusy ? "Processing payment..." : `Complete job • ${formatMoney(agreedPrice)}`}
                    </button>
                  ) : null}
                  {alreadyFinished ? (
                    <Link className="jcr-link-btn" href={`/jobs/${encodeURIComponent(job._id || jobId)}/review/${encodeURIComponent(requestId)}`}>
                      Leave review
                    </Link>
                  ) : null}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>

      {lightboxUrl ? (
        <button className="jcr-lightbox" type="button" onClick={() => setLightboxUrl(null)} aria-label="Close image preview">
          <div className="jcr-lightbox-inner">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={lightboxUrl} alt="Completed work preview" />
          </div>
        </button>
      ) : null}
    </>
  );
}
