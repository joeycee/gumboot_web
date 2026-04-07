import { api, apiForm } from "@/lib/api";
import type { ApiEnvelope } from "@/lib/apiTypes";

export type ManagedJob = {
  _id?: string;
  job_title?: string;
  description?: string;
  price?: string | number;
  job_status?: string | number;
  exp_date?: string;
  est_time?: string;
  exact_time?: string;
  shift_time?: string;
  address?: unknown;
  workerId?: string | { _id?: string; firstname?: string; lastname?: string };
  image?: Array<{ _id?: string; url?: string }>;
  job_type?: string | { _id?: string; name?: string };
};

export async function getUserJobs() {
  return api<ApiEnvelope<{ jobs?: ManagedJob[] }>>("/user_job_listing?page=1&perPage=200");
}

export async function getCompletedJobs() {
  return api<ApiEnvelope<{ completedJobsWithReviews?: ManagedJob[] }>>("/completed_jobs");
}

export async function getJobCancellationCharges() {
  return api<ApiEnvelope<Record<string, unknown>>>("/job_cancellation_charges");
}

export async function editJob(payload: {
  jobId: string;
  job_title?: string;
  description?: string;
  price?: string;
  exp_date?: string;
  est_time?: string;
  exact_time?: string;
  shift_time?: string;
  images?: File[];
}) {
  const form = new FormData();
  form.set("jobId", payload.jobId);
  if (payload.job_title?.trim()) form.set("job_title", payload.job_title.trim());
  if (payload.description?.trim()) form.set("description", payload.description.trim());
  if (payload.price?.trim()) form.set("price", payload.price.trim());
  if (payload.exp_date?.trim()) form.set("exp_date", payload.exp_date.trim());
  if (payload.est_time?.trim()) form.set("est_time", payload.est_time.trim());
  if (payload.exact_time?.trim()) form.set("exact_time", payload.exact_time.trim());
  if (payload.shift_time?.trim()) form.set("shift_time", payload.shift_time.trim());
  for (const image of payload.images ?? []) {
    form.append("image", image);
  }
  return apiForm<ApiEnvelope<unknown>>("/edit_job", form);
}

export async function deleteJob(jobId: string) {
  return api<ApiEnvelope<unknown>>("/delete_job", {
    method: "DELETE",
    body: { jobId },
  });
}

export async function cancelJob(jobId: string) {
  return api<ApiEnvelope<unknown>>("/job_cancel", {
    method: "POST",
    body: { jobId },
  });
}

export async function deleteJobImage(id: string, imageId: string) {
  return api<ApiEnvelope<unknown>>("/delete_image", {
    method: "POST",
    body: { id, imageId },
  });
}

export async function updateJobSourceLocation(payload: {
  jobId: string;
  latitude: string;
  longitude: string;
}) {
  return api<ApiEnvelope<unknown>>("/update_jobSource_location", {
    method: "POST",
    body: payload,
  });
}
