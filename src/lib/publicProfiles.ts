"use client";

import { api } from "@/lib/api";
import type { ApiEnvelope } from "@/lib/apiTypes";

export type PublicProfileKind = "worker" | "employer";

export type PublicProfileUser = {
  _id?: string;
  firstname?: string;
  lastname?: string;
  email?: string;
  image?: string;
  bio?: string;
  role?: string;
  address?: string;
  phone?: string | number;
  country_code?: string | number;
  skill?: Array<{ _id?: string; name?: string; image?: string[] }>;
  tools?: Array<{ _id?: string; tool_name?: string; name?: string } | string>;
};

export type PublicProfileRating = {
  count?: number;
  averageRating?: number;
};

export type PublicProfileReview = {
  _id?: string;
  userId?: PublicProfileUser;
  workerId?: PublicProfileUser;
  jobId?: string;
  rating?: string | number;
  comment?: string;
  rater_role?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type PublicProfileJob = {
  _id?: string;
  job_title?: string;
  price?: string | number;
  offered_price?: string | number;
  description?: string;
  createdAt?: string;
  job_status?: string | number;
  image?: Array<{ url?: string }>;
  job_type?: { _id?: string; name?: string; image?: string[] } | string;
};

export type WorkerCompletedJob = {
  _id?: string;
  jobId?: PublicProfileJob;
  workerId?: string;
  job_status?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type WorkerPublicProfileBody = {
  workerDetails?: PublicProfileUser;
  userDetail?: PublicProfileUser;
  ratingdata?: PublicProfileRating;
  offerPrice?: {
    message?: string;
    offered_price?: string | number;
    admin_charges?: string | number;
  };
  completedJobs?: WorkerCompletedJob[];
  newJobs?: PublicProfileJob[];
};

export type EmployerPublicProfileBody = {
  workerDetails?: PublicProfileUser;
  userDetail?: PublicProfileUser;
  ratingdata?: PublicProfileRating;
  completedJobs?: PublicProfileJob[];
  newJobs?: PublicProfileJob[];
};

export type ReviewsBody = {
  reviewData?: PublicProfileReview[];
  page?: number;
  perPage?: number;
  totalPages?: number;
  totalCount?: number;
};

export type WorkerCompletedJobsBody = {
  findcompletedjob?: WorkerCompletedJob[];
  page?: number;
  perPage?: number;
  totalPages?: number;
};

type PublicProfileHrefOptions = {
  userId?: string | null;
  kind?: PublicProfileKind | null;
  jobId?: string | null;
};

function withQuery(path: string, params: Record<string, string | number | null | undefined>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value == null || value === "") continue;
    query.set(key, String(value));
  }
  const queryString = query.toString();
  return queryString ? `${path}?${queryString}` : path;
}

export function buildPublicProfileHref({ userId, kind, jobId }: PublicProfileHrefOptions) {
  if (!userId) return "#";

  const search = new URLSearchParams();
  if (kind) search.set("kind", kind);
  if (jobId) search.set("jobId", jobId);

  const queryString = search.toString();
  return `/public_profile/${encodeURIComponent(userId)}${queryString ? `?${queryString}` : ""}`;
}

export async function fetchWorkerPublicProfile(userId: string, jobId = "") {
  return api<ApiEnvelope<WorkerPublicProfileBody>>(
    withQuery("/worker_public_profile", {
      workerId: userId,
      jobrequestedId: jobId,
    })
  );
}

export async function fetchEmployerPublicProfile(userId: string) {
  return api<ApiEnvelope<EmployerPublicProfileBody>>(
    withQuery("/user_public_profile", { userId })
  );
}

export async function fetchPublicReviews(userId: string) {
  return api<ApiEnvelope<ReviewsBody>>(
    withQuery("/review_listing", {
      userId,
      type: "1",
    })
  );
}

export async function fetchWorkerCompletedJobs(userId: string) {
  return api<ApiEnvelope<WorkerCompletedJobsBody>>(
    withQuery("/jobsCompletedbyWorker", {
      workerId: userId,
    })
  );
}
