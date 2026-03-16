"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { resolveUserImageUrl } from "@/lib/messages";
import {
  buildPublicProfileHref,
  fetchEmployerPublicProfile,
  fetchPublicReviews,
  fetchWorkerCompletedJobs,
  fetchWorkerPublicProfile,
  type EmployerPublicProfileBody,
  type PublicProfileJob,
  type PublicProfileKind,
  type PublicProfileReview,
  type PublicProfileUser,
  type WorkerCompletedJob,
  type WorkerPublicProfileBody,
} from "@/lib/publicProfiles";

type LoadedProfile =
  | {
      kind: "worker";
      body: WorkerPublicProfileBody;
      user: PublicProfileUser | null;
    }
  | {
      kind: "employer";
      body: EmployerPublicProfileBody;
      user: PublicProfileUser | null;
    };

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');

  .pubp-root * { box-sizing: border-box; }
  .pubp-root {
    min-height: calc(100dvh - 56px);
    padding: 22px 14px 72px;
    color: #E5E5E5;
    font-family: 'DM Sans', sans-serif;
    background:
      radial-gradient(900px 540px at 8% 0%, rgba(91,110,127,0.18), transparent 60%),
      linear-gradient(180deg, #2A3439 0%, #243036 100%);
  }

  .pubp-shell {
    max-width: 1040px;
    margin: 0 auto;
    display: grid;
    gap: 16px;
  }

  @media (min-width: 960px) {
    .pubp-shell {
      grid-template-columns: minmax(0, 1.2fr) minmax(320px, 0.8fr);
      align-items: start;
    }
  }

  .pubp-card {
    border: 1px solid rgba(229,229,229,0.10);
    border-radius: 18px;
    background: rgba(62,74,81,0.82);
    box-shadow: 0 18px 50px rgba(0,0,0,0.28);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    overflow: hidden;
  }

  .pubp-card-head {
    padding: 20px 20px 14px;
    border-bottom: 1px solid rgba(229,229,229,0.08);
  }

  .pubp-kicker {
    margin: 0 0 6px;
    font-size: 10px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: rgba(229,229,229,0.40);
  }

  .pubp-title {
    margin: 0;
    font-family: 'DM Serif Display', serif;
    font-size: 26px;
    font-weight: 400;
    line-height: 1.05;
  }

  .pubp-subtitle {
    margin: 8px 0 0;
    font-size: 12px;
    line-height: 1.6;
    color: rgba(229,229,229,0.48);
  }

  .pubp-summary {
    padding: 22px 20px 24px;
    display: grid;
    gap: 18px;
  }

  @media (min-width: 720px) {
    .pubp-summary {
      grid-template-columns: 104px minmax(0, 1fr);
      align-items: start;
    }
  }

  .pubp-avatar {
    width: 104px;
    height: 104px;
    border-radius: 50%;
    border: 1px solid rgba(229,229,229,0.10);
    overflow: hidden;
    background: linear-gradient(135deg, #3E4A51, #5B6E7F);
    display: grid;
    place-items: center;
    flex-shrink: 0;
  }

  .pubp-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .pubp-avatar-fallback {
    font-size: 28px;
    font-weight: 700;
    letter-spacing: 0.04em;
    color: rgba(229,229,229,0.78);
  }

  .pubp-name {
    margin: 0;
    font-family: 'DM Serif Display', serif;
    font-size: 34px;
    font-weight: 400;
    line-height: 1.02;
  }

  .pubp-role-row {
    margin-top: 10px;
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  .pubp-pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 30px;
    border-radius: 999px;
    padding: 0 12px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgba(229,229,229,0.65);
    background: rgba(229,229,229,0.06);
    border: 1px solid rgba(229,229,229,0.10);
  }

  .pubp-bio {
    margin: 16px 0 0;
    font-size: 14px;
    line-height: 1.75;
    color: rgba(229,229,229,0.72);
    white-space: pre-wrap;
  }

  .pubp-meta {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 10px;
    margin-top: 18px;
  }

  .pubp-meta-card {
    border: 1px solid rgba(229,229,229,0.10);
    border-radius: 14px;
    background: rgba(229,229,229,0.04);
    padding: 12px 14px;
  }

  .pubp-meta-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(229,229,229,0.34);
  }

  .pubp-meta-value {
    margin-top: 6px;
    font-size: 14px;
    font-weight: 600;
    color: #E5E5E5;
  }

  .pubp-section {
    padding: 20px;
    display: grid;
    gap: 14px;
  }

  .pubp-section-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
  }

  .pubp-section-title {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #E5E5E5;
  }

  .pubp-section-note {
    font-size: 11px;
    color: rgba(229,229,229,0.38);
  }

  .pubp-chip-wrap {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .pubp-chip {
    display: inline-flex;
    align-items: center;
    min-height: 34px;
    border-radius: 999px;
    padding: 0 12px;
    font-size: 12px;
    color: rgba(229,229,229,0.82);
    background: rgba(229,229,229,0.06);
    border: 1px solid rgba(229,229,229,0.10);
  }

  .pubp-list {
    display: grid;
    gap: 12px;
  }

  .pubp-review,
  .pubp-job {
    border: 1px solid rgba(229,229,229,0.10);
    border-radius: 16px;
    background: rgba(229,229,229,0.04);
    padding: 14px;
  }

  .pubp-review-head,
  .pubp-job-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }

  .pubp-review-author {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }

  .pubp-review-avatar {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    overflow: hidden;
    border: 1px solid rgba(229,229,229,0.10);
    background: linear-gradient(135deg, #3E4A51, #5B6E7F);
    display: grid;
    place-items: center;
    flex-shrink: 0;
  }

  .pubp-review-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .pubp-review-name {
    font-size: 14px;
    font-weight: 600;
    color: #E5E5E5;
  }

  .pubp-review-role {
    margin-top: 2px;
    font-size: 11px;
    color: rgba(229,229,229,0.36);
    text-transform: uppercase;
    letter-spacing: 0.12em;
  }

  .pubp-time {
    font-size: 11px;
    color: rgba(229,229,229,0.38);
    white-space: nowrap;
  }

  .pubp-stars {
    display: flex;
    gap: 2px;
    margin-top: 10px;
  }

  .pubp-star {
    font-size: 13px;
    line-height: 1;
    color: rgba(229,229,229,0.16);
  }

  .pubp-star.filled {
    color: #FBBF24;
  }

  .pubp-review-body {
    margin: 10px 0 0;
    font-size: 13px;
    line-height: 1.7;
    color: rgba(229,229,229,0.72);
    white-space: pre-wrap;
  }

  .pubp-job {
    display: grid;
    grid-template-columns: 88px minmax(0, 1fr);
    gap: 12px;
    align-items: start;
  }

  .pubp-job-media {
    width: 88px;
    height: 88px;
    border-radius: 14px;
    overflow: hidden;
    border: 1px solid rgba(229,229,229,0.10);
    background: rgba(229,229,229,0.05);
    display: grid;
    place-items: center;
  }

  .pubp-job-media img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .pubp-job-fallback {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: rgba(229,229,229,0.28);
  }

  .pubp-job-title {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: #E5E5E5;
  }

  .pubp-job-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 8px;
  }

  .pubp-job-pill {
    display: inline-flex;
    align-items: center;
    min-height: 28px;
    border-radius: 999px;
    padding: 0 10px;
    font-size: 11px;
    color: rgba(229,229,229,0.68);
    border: 1px solid rgba(229,229,229,0.08);
    background: rgba(229,229,229,0.04);
  }

  .pubp-empty,
  .pubp-error,
  .pubp-loading {
    padding: 20px;
    text-align: center;
    border: 1px solid rgba(229,229,229,0.10);
    border-radius: 18px;
    background: rgba(62,74,81,0.82);
    box-shadow: 0 18px 50px rgba(0,0,0,0.28);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }

  .pubp-empty-text,
  .pubp-loading-text {
    font-size: 13px;
    line-height: 1.7;
    color: rgba(229,229,229,0.52);
  }

  .pubp-error-text {
    font-size: 13px;
    line-height: 1.7;
    color: rgba(255,214,214,0.88);
  }

  .pubp-back-link {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    width: fit-content;
    margin-bottom: 12px;
    color: rgba(229,229,229,0.65);
    text-decoration: none;
    font-size: 11px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  .pubp-back-link:hover {
    color: #E5E5E5;
  }
`;

function formatDate(value?: string) {
  if (!value) return "Recently";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function getInitials(user?: PublicProfileUser | null) {
  const first = user?.firstname?.trim() ?? "";
  const last = user?.lastname?.trim() ?? "";
  return `${first[0] ?? ""}${last[0] ?? ""}`.trim().toUpperCase() || "GB";
}

function getFullName(user?: PublicProfileUser | null) {
  return [user?.firstname, user?.lastname].filter(Boolean).join(" ").trim() || "Unknown user";
}

function normalizeTools(user?: PublicProfileUser | null) {
  if (!Array.isArray(user?.tools)) return [];
  return user.tools
    .map((tool) => {
      if (typeof tool === "string") return tool.trim();
      return tool?.tool_name?.trim() || tool?.name?.trim() || "";
    })
    .filter(Boolean);
}

function getRatingValue(value?: string | number) {
  const parsed = typeof value === "string" ? Number(value) : value ?? 0;
  return Number.isFinite(parsed) ? parsed : 0;
}

function getJobImage(job?: PublicProfileJob | null) {
  const path = Array.isArray(job?.image) ? job?.image?.[0]?.url : "";
  return resolveUserImageUrl(path);
}

function getJobTypeName(job?: PublicProfileJob | null) {
  if (!job?.job_type) return "";
  return typeof job.job_type === "string" ? job.job_type : job.job_type?.name ?? "";
}

function getJobPrice(job?: PublicProfileJob | null) {
  const value = job?.offered_price ?? job?.price;
  if (value == null || value === "") return "Price unavailable";
  return `$${value}`;
}

function normalizeCompletedJobs(kind: PublicProfileKind, profile: LoadedProfile | null, workerJobs: WorkerCompletedJob[]) {
  if (kind === "worker") {
    return workerJobs.length > 0
      ? workerJobs.map((item) => item.jobId).filter((job): job is PublicProfileJob => Boolean(job))
      : (profile?.body.completedJobs ?? [])
          .map((item) => item?.jobId)
          .filter((job): job is PublicProfileJob => Boolean(job));
  }

  return profile?.body.completedJobs ?? [];
}

export default function PublicProfileClient({ userId }: { userId: string }) {
  const searchParams = useSearchParams();
  const requestedKind = searchParams.get("kind") as PublicProfileKind | null;
  const jobId = searchParams.get("jobId") ?? "";

  const [profile, setProfile] = useState<LoadedProfile | null>(null);
  const [reviews, setReviews] = useState<PublicProfileReview[]>([]);
  const [completedJobs, setCompletedJobs] = useState<PublicProfileJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        let loadedProfile: LoadedProfile | null = null;

        if (requestedKind === "worker") {
          const response = await fetchWorkerPublicProfile(userId, jobId);
          loadedProfile = {
            kind: "worker",
            body: response.body ?? {},
            user: response.body?.workerDetails ?? response.body?.userDetail ?? null,
          };
        } else if (requestedKind === "employer") {
          const response = await fetchEmployerPublicProfile(userId);
          loadedProfile = {
            kind: "employer",
            body: response.body ?? {},
            user: response.body?.workerDetails ?? response.body?.userDetail ?? null,
          };
        } else {
          try {
            const response = await fetchEmployerPublicProfile(userId);
            loadedProfile = {
              kind: "employer",
              body: response.body ?? {},
              user: response.body?.workerDetails ?? response.body?.userDetail ?? null,
            };
          } catch {
            const response = await fetchWorkerPublicProfile(userId, jobId);
            loadedProfile = {
              kind: "worker",
              body: response.body ?? {},
              user: response.body?.workerDetails ?? response.body?.userDetail ?? null,
            };
          }
        }

        const targetUserId = loadedProfile.user?._id ?? userId;

        const [reviewsResponse, workerJobsResponse] = await Promise.all([
          fetchPublicReviews(targetUserId).catch(() => null),
          loadedProfile.kind === "worker"
            ? fetchWorkerCompletedJobs(targetUserId).catch(() => null)
            : Promise.resolve(null),
        ]);

        if (cancelled) return;

        setProfile(loadedProfile);
        setReviews(reviewsResponse?.body?.reviewData ?? []);
        setCompletedJobs(
          normalizeCompletedJobs(
            loadedProfile.kind,
            loadedProfile,
            workerJobsResponse?.body?.findcompletedjob ?? []
          )
        );
      } catch (loadError) {
        if (cancelled) return;
        setError(loadError instanceof Error ? loadError.message : "Failed to load public profile.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [jobId, requestedKind, userId]);

  const person = profile?.user ?? null;
  const fullName = useMemo(() => getFullName(person), [person]);
  const avatarSrc = useMemo(() => resolveUserImageUrl(person?.image), [person?.image]);
  const skills = useMemo(
    () => (Array.isArray(person?.skill) ? person.skill.map((entry) => entry.name?.trim() ?? "").filter(Boolean) : []),
    [person?.skill]
  );
  const tools = useMemo(() => normalizeTools(person), [person]);
  const rating = profile?.body.ratingdata;
  const roleLabel = profile?.kind === "worker" ? "Worker profile" : profile?.kind === "employer" ? "Employer profile" : "Public profile";

  return (
    <>
      <style>{styles}</style>
      <div className="pubp-root">
        <div className="pubp-shell">
          <div style={{ gridColumn: "1 / -1" }}>
            <Link className="pubp-back-link" href="/">
              <span>‹</span>
              <span>Back to app</span>
            </Link>
          </div>

          {loading ? (
            <div className="pubp-loading" style={{ gridColumn: "1 / -1" }}>
              <p className="pubp-loading-text">Loading public profile, reviews, and work history...</p>
            </div>
          ) : null}

          {!loading && error ? (
            <div className="pubp-error" style={{ gridColumn: "1 / -1" }}>
              <p className="pubp-error-text">{error}</p>
            </div>
          ) : null}

          {!loading && !error && profile ? (
            <>
              <section className="pubp-card">
                <div className="pubp-card-head">
                  <p className="pubp-kicker">Public profile</p>
                  <h1 className="pubp-title">{fullName}</h1>
                  <p className="pubp-subtitle">Public-facing profile details mirrored from the app’s existing profile flow.</p>
                </div>

                <div className="pubp-summary">
                  <div className="pubp-avatar" aria-hidden="true">
                    {avatarSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatarSrc} alt={fullName} />
                    ) : (
                      <span className="pubp-avatar-fallback">{getInitials(person)}</span>
                    )}
                  </div>

                  <div>
                    <h2 className="pubp-name">{fullName}</h2>
                    <div className="pubp-role-row">
                      <span className="pubp-pill">{roleLabel}</span>
                      {typeof rating?.averageRating === "number" ? (
                        <span className="pubp-pill">
                          <span>★</span>
                          <span>{rating.averageRating.toFixed(1)} rating</span>
                          <span>{typeof rating.count === "number" ? `(${rating.count})` : ""}</span>
                        </span>
                      ) : null}
                    </div>

                    <p className="pubp-bio">{person?.bio?.trim() || "No bio added yet."}</p>

                    <div className="pubp-meta">
                      <div className="pubp-meta-card">
                        <div className="pubp-meta-label">Reviews</div>
                        <div className="pubp-meta-value">{reviews.length}</div>
                      </div>
                      <div className="pubp-meta-card">
                        <div className="pubp-meta-label">Completed jobs</div>
                        <div className="pubp-meta-value">{completedJobs.length}</div>
                      </div>
                      <div className="pubp-meta-card">
                        <div className="pubp-meta-label">Profile type</div>
                        <div className="pubp-meta-value">{profile.kind}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {skills.length > 0 ? (
                  <div className="pubp-section" style={{ paddingTop: 0 }}>
                    <div className="pubp-section-head">
                      <h3 className="pubp-section-title">Skills</h3>
                    </div>
                    <div className="pubp-chip-wrap">
                      {skills.map((skill) => (
                        <span className="pubp-chip" key={skill}>{skill}</span>
                      ))}
                    </div>
                  </div>
                ) : null}

                {tools.length > 0 ? (
                  <div className="pubp-section" style={{ paddingTop: 0 }}>
                    <div className="pubp-section-head">
                      <h3 className="pubp-section-title">Tools</h3>
                    </div>
                    <div className="pubp-chip-wrap">
                      {tools.map((tool) => (
                        <span className="pubp-chip" key={tool}>{tool}</span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </section>

              <aside className="pubp-card">
                <div className="pubp-card-head">
                  <p className="pubp-kicker">Summary</p>
                  <h2 className="pubp-title" style={{ fontSize: "22px" }}>At a glance</h2>
                </div>
                <div className="pubp-section">
                  <div className="pubp-meta-card">
                    <div className="pubp-meta-label">Rating summary</div>
                    <div className="pubp-meta-value">
                      {typeof rating?.averageRating === "number" ? rating.averageRating.toFixed(1) : "No rating yet"}
                    </div>
                  </div>
                  <div className="pubp-meta-card">
                    <div className="pubp-meta-label">Public reviews</div>
                    <div className="pubp-meta-value">{reviews.length || "No reviews yet"}</div>
                  </div>
                  <div className="pubp-meta-card">
                    <div className="pubp-meta-label">Work history</div>
                    <div className="pubp-meta-value">{completedJobs.length || "No completed jobs yet"}</div>
                  </div>
                  <div className="pubp-meta-card">
                    <div className="pubp-meta-label">Profile route</div>
                    <div className="pubp-meta-value" style={{ wordBreak: "break-word" }}>
                      {buildPublicProfileHref({ userId, kind: profile.kind, jobId })}
                    </div>
                  </div>
                </div>
              </aside>

              <section className="pubp-card">
                <div className="pubp-card-head">
                  <p className="pubp-kicker">Reviews</p>
                  <h2 className="pubp-title" style={{ fontSize: "22px" }}>Public reviews</h2>
                </div>
                <div className="pubp-section">
                  {reviews.length === 0 ? (
                    <div className="pubp-empty">
                      <p className="pubp-empty-text">No public reviews are available for this user yet.</p>
                    </div>
                  ) : (
                    <div className="pubp-list">
                      {reviews.map((review) => {
                        const author = review.userId ?? review.workerId ?? null;
                        const reviewName = getFullName(author);
                        const reviewAvatar = resolveUserImageUrl(author?.image);
                        const reviewRating = getRatingValue(review.rating);

                        return (
                          <article className="pubp-review" key={review._id ?? `${reviewName}-${review.createdAt ?? ""}`}>
                            <div className="pubp-review-head">
                              <div className="pubp-review-author">
                                <div className="pubp-review-avatar" aria-hidden="true">
                                  {reviewAvatar ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={reviewAvatar} alt={reviewName} />
                                  ) : (
                                    <span className="pubp-avatar-fallback" style={{ fontSize: "15px" }}>
                                      {getInitials(author)}
                                    </span>
                                  )}
                                </div>
                                <div>
                                  <div className="pubp-review-name">{reviewName}</div>
                                  <div className="pubp-review-role">{review.rater_role || "Review"}</div>
                                </div>
                              </div>
                              <div className="pubp-time">{formatDate(review.createdAt)}</div>
                            </div>
                            <div className="pubp-stars" aria-label={`${reviewRating} star rating`}>
                              {[1, 2, 3, 4, 5].map((star) => (
                                <span className={`pubp-star ${star <= Math.round(reviewRating) ? "filled" : ""}`} key={star}>★</span>
                              ))}
                            </div>
                            <p className="pubp-review-body">{review.comment?.trim() || "No written comment."}</p>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </div>
              </section>

              <section className="pubp-card">
                <div className="pubp-card-head">
                  <p className="pubp-kicker">Work history</p>
                  <h2 className="pubp-title" style={{ fontSize: "22px" }}>Completed jobs</h2>
                </div>
                <div className="pubp-section">
                  {completedJobs.length === 0 ? (
                    <div className="pubp-empty">
                      <p className="pubp-empty-text">No completed jobs are available for this user yet.</p>
                    </div>
                  ) : (
                    <div className="pubp-list">
                      {completedJobs.map((job, index) => {
                        const imageSrc = getJobImage(job);
                        const jobTitle = job?.job_title?.trim() || "Untitled job";
                        const jobTypeName = getJobTypeName(job);
                        const priceLabel = getJobPrice(job);

                        return (
                          <article className="pubp-job" key={job?._id ?? `${jobTitle}-${index}`}>
                            <div className="pubp-job-media" aria-hidden="true">
                              {imageSrc ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={imageSrc} alt={jobTitle} />
                              ) : (
                                <span className="pubp-job-fallback">Job</span>
                              )}
                            </div>
                            <div>
                              <div className="pubp-job-head">
                                <h3 className="pubp-job-title">{jobTitle}</h3>
                                <div className="pubp-time">{formatDate(job?.createdAt)}</div>
                              </div>
                              <div className="pubp-job-meta">
                                <span className="pubp-job-pill">{priceLabel}</span>
                                {jobTypeName ? <span className="pubp-job-pill">{jobTypeName}</span> : null}
                                {job?.job_status != null ? (
                                  <span className="pubp-job-pill">Status {job.job_status}</span>
                                ) : null}
                              </div>
                              {job?.description?.trim() ? (
                                <p className="pubp-review-body" style={{ marginTop: "10px" }}>{job.description}</p>
                              ) : null}
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </div>
              </section>
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}
