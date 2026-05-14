"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchPublicReviews, type PublicProfileReview } from "@/lib/publicProfiles";
import { useMe } from "@/lib/useMe";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500&display=swap');

  .prv-root {
    min-height: calc(100vh - 56px);
    padding: 36px 16px 72px;
    color: #E5E5E5;
    font-family: 'DM Sans', sans-serif;
    background:
      radial-gradient(900px 540px at 10% 0%, rgba(91,110,127,0.18), transparent 60%),
      linear-gradient(180deg, #2A3439 0%, #243036 100%);
  }
  .prv-shell {
    max-width: 840px;
    margin: 0 auto;
    display: grid;
    gap: 16px;
  }
  .prv-card {
    border: 1px solid rgba(229,229,229,0.10);
    border-radius: 22px;
    background: rgba(62,74,81,0.82);
    box-shadow: 0 18px 50px rgba(0,0,0,0.28);
    backdrop-filter: blur(10px);
    padding: 22px;
    display: grid;
    gap: 16px;
  }
  .prv-kicker {
    margin: 0;
    font-size: 10px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: rgba(229,229,229,0.40);
  }
  .prv-title {
    margin: 6px 0 0;
    font-family: 'DM Serif Display', serif;
    font-size: 34px;
    font-weight: 400;
    line-height: 1.05;
  }
  .prv-subtitle {
    margin: 8px 0 0;
    font-size: 14px;
    line-height: 1.7;
    color: rgba(229,229,229,0.66);
  }
  .prv-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
  }
  .prv-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 44px;
    border-radius: 12px;
    padding: 0 16px;
    text-decoration: none;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    border: 1px solid rgba(229,229,229,0.14);
    background: rgba(229,229,229,0.06);
    color: #E5E5E5;
  }
  .prv-stat {
    font-size: 13px;
    color: rgba(229,229,229,0.68);
  }
  .prv-list {
    display: grid;
    gap: 14px;
  }
  .prv-item {
    border-radius: 16px;
    border: 1px solid rgba(229,229,229,0.10);
    background: rgba(229,229,229,0.04);
    padding: 16px;
    display: grid;
    gap: 10px;
  }
  .prv-item-head {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: flex-start;
  }
  .prv-name {
    font-size: 15px;
    font-weight: 700;
    color: #F3F4F6;
  }
  .prv-meta {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    font-size: 12px;
    color: rgba(229,229,229,0.48);
  }
  .prv-pill {
    border-radius: 999px;
    border: 1px solid rgba(229,229,229,0.10);
    background: rgba(229,229,229,0.04);
    padding: 5px 9px;
  }
  .prv-comment {
    margin: 0;
    font-size: 14px;
    line-height: 1.75;
    color: rgba(229,229,229,0.76);
  }
  .prv-rating {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  .prv-stars {
    display: flex;
    gap: 2px;
  }
  .prv-star {
    font-size: 14px;
    line-height: 1;
    color: rgba(229,229,229,0.22);
  }
  .prv-star.filled {
    color: #F6C453;
  }
  .prv-value {
    font-size: 14px;
    font-weight: 800;
    color: #F3F4F6;
  }
  .prv-state {
    border-radius: 14px;
    border: 1px solid rgba(229,229,229,0.10);
    background: rgba(229,229,229,0.04);
    padding: 16px;
    color: rgba(229,229,229,0.72);
    font-size: 14px;
    line-height: 1.7;
  }
  .prv-state.error {
    border-color: rgba(183,91,91,0.35);
    background: rgba(183,91,91,0.12);
    color: rgba(255,220,220,0.94);
  }
  @media (max-width: 640px) {
    .prv-item-head {
      flex-direction: column;
    }
  }
`;

function getFullName(user?: { firstname?: string; lastname?: string; email?: string } | null) {
  return [user?.firstname, user?.lastname].filter(Boolean).join(" ").trim() || user?.email || "Anonymous user";
}

function getRoleLabel(role?: string | number) {
  if (String(role ?? "") === "1") return "Client review";
  if (String(role ?? "") === "2") return "Worker review";
  return "Review";
}

function formatDate(value?: string) {
  if (!value) return "Recently";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  return new Intl.DateTimeFormat("en-NZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function RatingStars({ value }: { value: number }) {
  const rounded = Math.max(0, Math.min(5, Math.round(value)));
  return (
    <div className="prv-stars" aria-label={`Rating: ${value.toFixed(1)} out of 5`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <span key={index} className={`prv-star ${index < rounded ? "filled" : ""}`} aria-hidden="true">
          ★
        </span>
      ))}
    </div>
  );
}

export default function ProfileReviewsPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useMe();
  const me = (user ?? null) as { _id?: string } | null;

  const [reviews, setReviews] = useState<PublicProfileReview[]>([]);
  const [reviewsCount, setReviewsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReviews = useCallback(async () => {
    if (!me?._id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetchPublicReviews(me._id, 50);
      const reviewData = response.body?.reviewData ?? [];
      setReviews(reviewData);
      setReviewsCount(response.body?.totalCount ?? reviewData.length);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to load your reviews.");
      setReviews([]);
      setReviewsCount(0);
    } finally {
      setLoading(false);
    }
  }, [me?._id]);

  useEffect(() => {
    if (userLoading) return;
    if (!me?._id) {
      router.replace("/auth/login?next=%2Fprofile%2Freviews");
      return;
    }

    void loadReviews();
  }, [loadReviews, me?._id, router, userLoading]);

  const summary = useMemo(() => {
    if (!reviews.length) return "No reviews yet";
    return `${reviewsCount || reviews.length} review${(reviewsCount || reviews.length) === 1 ? "" : "s"} on your profile`;
  }, [reviews, reviewsCount]);

  return (
    <>
      <style>{styles}</style>
      <div className="prv-root">
        <div className="prv-shell">
          <section className="prv-card">
            <div>
              <p className="prv-kicker">Profile reviews</p>
              <h1 className="prv-title">Your latest reviews</h1>
              <p className="prv-subtitle">
                This feed is backed by the current `/review_listing` API so it stays in line with the live backend review data.
              </p>
            </div>

            <div className="prv-actions">
              <div className="prv-stat">{summary}</div>
              <Link className="prv-link" href="/profile">
                Back to profile
              </Link>
            </div>

            {loading ? (
              <div className="prv-state">Loading your reviews…</div>
            ) : error ? (
              <div className="prv-state error">{error}</div>
            ) : reviews.length === 0 ? (
              <div className="prv-state">Reviews from completed jobs will appear here once customers or workers submit them.</div>
            ) : (
              <div className="prv-list">
                {reviews.map((review) => {
                  const authorName = getFullName(review.userId);
                  const rating = Number(review.rating ?? 0);
                  return (
                    <article key={review._id ?? `${authorName}-${review.createdAt ?? ""}`} className="prv-item">
                      <div className="prv-item-head">
                        <div>
                          <div className="prv-name">{authorName}</div>
                          <div className="prv-meta">
                            <span className="prv-pill">{getRoleLabel(review.rater_role)}</span>
                            <span>{formatDate(review.createdAt)}</span>
                          </div>
                        </div>
                        <div className="prv-rating">
                          <RatingStars value={rating} />
                          <span className="prv-value">{rating.toFixed(1)}</span>
                        </div>
                      </div>
                      <p className="prv-comment">
                        {review.comment?.trim() || "No written comment was added to this review."}
                      </p>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
