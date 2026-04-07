import { api, apiForm } from "@/lib/api";
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

export type JobApplicationsEnvelopeBody = {
  jobData?: JobApplication[];
  jobsData?: JobApplication[];
  body?: JobApplication[];
  ratingdata?: {
    count?: number;
    averageRating?: string | number;
  };
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
  return api<ApiEnvelope<JobApplication[] | JobApplicationsEnvelopeBody>>(
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

export async function updateJobLifecycleStatus(payload: {
  jobRequested_id: string;
  job_id: string;
  job_status: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  message?: string;
}) {
  return api<ApiEnvelope<unknown>>("/updateJobStatus", {
    method: "POST",
    body: payload,
  });
}

export async function uploadWorkerJobImages(payload: {
  jobId: string;
  type: "1" | "2";
  images: File[];
}) {
  const form = new FormData();
  form.set("jobId", payload.jobId);
  form.set("type", payload.type);
  for (const image of payload.images) {
    form.append("image", image);
  }
  return apiForm<ApiEnvelope<unknown>>("/addImageByWorker", form);
}

export function normalizeApplicationsResponse(
  response: ApiEnvelope<JobApplication[] | JobApplicationsEnvelopeBody> | null | undefined
) {
  const body = response?.body;
  if (Array.isArray(body)) return body;
  if (body && typeof body === "object") {
    if (Array.isArray((body as JobApplicationsEnvelopeBody).jobData)) {
      return (body as JobApplicationsEnvelopeBody).jobData ?? [];
    }
    if (Array.isArray((body as JobApplicationsEnvelopeBody).jobsData)) {
      return (body as JobApplicationsEnvelopeBody).jobsData ?? [];
    }
    if (Array.isArray((body as JobApplicationsEnvelopeBody).body)) {
      return (body as JobApplicationsEnvelopeBody).body ?? [];
    }
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

export function getApplicationWorkerId(application?: JobApplication | null) {
  const worker = application?.workerId;
  if (!worker) return "";
  if (typeof worker === "string") return worker;
  return worker._id ?? "";
}

export function findApplicationByRequestId(applications: JobApplication[], requestId: string) {
  return applications.find((application) => String(application?._id ?? "") === String(requestId)) ?? null;
}

export function findApplicationByWorkerId(applications: JobApplication[], workerId: string) {
  return (
    applications.find((application) => getApplicationWorkerId(application) === workerId) ??
    null
  );
}
