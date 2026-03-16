import { api } from "@/lib/api";
import type { ApiEnvelope } from "@/lib/apiTypes";

export type JobApplicationWorker = {
  _id?: string;
  firstname?: string;
  lastname?: string;
  bio?: string;
  image?: string;
};

export type JobApplication = {
  _id?: string;
  jobId?: string | { _id?: string };
  workerId?: string | JobApplicationWorker;
  message?: string;
  offered_price?: string | number;
  job_status?: string | number;
  createdAt?: string;
  updatedAt?: string;
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

export async function applyToJob(payload: {
  jobid: string;
  message: string;
  offered_price: string;
}) {
  return api<ApiEnvelope<unknown>>("/applyjob", {
    method: "POST",
    body: payload,
  });
}

export async function fetchJobApplications(jobId: string) {
  return api<ApiEnvelope<JobApplication[] | { body?: JobApplication[] }>>(
    withQuery("/applications", { jobId })
  );
}

export async function updateJobApplicationStatus(payload: {
  jobRequested_id: string;
  job_id: string;
  job_status: 2 | 4;
}) {
  return api<ApiEnvelope<unknown>>("/updateJobStatus", {
    method: "POST",
    body: payload,
  });
}

export function normalizeApplicationsResponse(
  response: ApiEnvelope<JobApplication[] | { body?: JobApplication[] }> | null | undefined
) {
  const body = response?.body;
  if (Array.isArray(body)) return body;
  if (body && typeof body === "object" && Array.isArray((body as { body?: JobApplication[] }).body)) {
    return (body as { body?: JobApplication[] }).body ?? [];
  }
  return [];
}

export function getApplicationWorker(application?: JobApplication | null) {
  const worker = application?.workerId;
  if (!worker || typeof worker === "string") return null;
  return worker;
}

export function getApplicationJobId(application?: JobApplication | null) {
  const jobId = application?.jobId;
  if (!jobId) return "";
  if (typeof jobId === "string") return jobId;
  return jobId._id ?? "";
}
