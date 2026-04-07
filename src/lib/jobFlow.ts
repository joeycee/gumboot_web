import type { ApiEnvelope } from "@/lib/apiTypes";
import type { JobApplication } from "@/lib/applications";

export type JobImageValue = { _id?: string; url?: string } | null | undefined;

export type JobTypeValue = string | { _id?: string; name?: string } | null | undefined;

export type AddressValue =
  | string
  | {
      _id?: string;
      address?: string;
      city?: string;
      state?: string;
      country?: string;
      location?: { coordinates?: [number, number] };
    }
  | null
  | undefined;

export type UserValue =
  | string
  | {
      _id?: string;
      firstname?: string;
      lastname?: string;
      name?: string;
      image?: string;
      bio?: string;
      rating?: number;
      reviews?: number;
    }
  | null
  | undefined;

export type JobDetails = {
  _id?: string;
  id?: string;
  title?: string;
  job_title?: string;
  description?: string;
  job_description?: string;
  exp_date?: string;
  date?: string;
  exact_time?: string;
  shift_time?: string;
  est_time?: string;
  job_status?: string | number;
  price?: string | number;
  offered_price?: string | number;
  payment_transaction?: {
    amount?: string | number;
    paymentAmount?: string | number;
    transaction_status?: string | number;
    transactionId?: string;
  } | null;
  transactionFeePercent?: {
    service_fee?: string | number;
    service_charge?: string | number;
  } | null;
  job_type?: JobTypeValue;
  address?: AddressValue;
  location?: string | { coordinates?: [number, number] } | null;
  userId?: UserValue;
  workerId?: string | UserValue;
  image?: Array<{ url?: string }> | null;
  image_before_job?: JobImageValue[] | null;
  image_after_job?: JobImageValue[] | null;
  jobRequestedData?: JobApplication[] | JobApplication | null;
  jobRequestedDataNew?: JobApplication | null;
  ratedbyme?: number;
  jobreviewData?: unknown;
  raw?: unknown;
};

export type JobDetailsEnvelope = ApiEnvelope<
  | JobDetails
  | {
      getdetails?: JobDetails;
      offered_price?: string | number;
      payment_transaction?: JobDetails["payment_transaction"];
      transactionFeePercent?: JobDetails["transactionFeePercent"];
      jobRequestedData?: JobApplication[];
      jobRequestedDataNew?: JobApplication | Record<string, unknown>;
      ratedbyme?: number;
      jobreviewData?: unknown;
    }
>;

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function hasApplicationIdentity(application: unknown): application is JobApplication {
  if (!isObject(application)) return false;
  const record = application as Record<string, unknown>;
  return typeof record._id === "string" && record._id.trim().length > 0;
}

export function normalizeJobDetails(payload: JobDetailsEnvelope): JobDetails | null {
  const body = payload.body;
  if (!body || !isObject(body)) return null;
  const bodyRecord = body as Record<string, unknown>;
  const details = isObject(bodyRecord.getdetails) ? (bodyRecord.getdetails as JobDetails) : (body as JobDetails);
  const rawPrice =
    typeof (body as { offered_price?: unknown }).offered_price === "string" ||
    typeof (body as { offered_price?: unknown }).offered_price === "number"
      ? (body as { offered_price?: string | number }).offered_price
      : undefined;
  const normalizedPrice =
    details.offered_price ??
    details.price ??
    rawPrice ??
    (typeof (body as { price?: unknown }).price === "string" || typeof (body as { price?: unknown }).price === "number"
      ? (body as { price?: string | number }).price
      : undefined);
  return {
    ...details,
    price: details.price ?? normalizedPrice,
    offered_price: normalizedPrice,
    payment_transaction:
      ((body as { payment_transaction?: JobDetails["payment_transaction"] }).payment_transaction ??
        details.payment_transaction) ??
      null,
    transactionFeePercent:
      ((body as { transactionFeePercent?: JobDetails["transactionFeePercent"] }).transactionFeePercent ??
        details.transactionFeePercent) ??
      null,
    image_before_job: Array.isArray(details.image_before_job)
      ? details.image_before_job
      : Array.isArray((body as { getdetails?: { image_before_job?: JobImageValue[] } }).getdetails?.image_before_job)
        ? (body as { getdetails?: { image_before_job?: JobImageValue[] } }).getdetails?.image_before_job ?? []
        : [],
    image_after_job: Array.isArray(details.image_after_job)
      ? details.image_after_job
      : Array.isArray((body as { getdetails?: { image_after_job?: JobImageValue[] } }).getdetails?.image_after_job)
        ? (body as { getdetails?: { image_after_job?: JobImageValue[] } }).getdetails?.image_after_job ?? []
        : [],
    jobRequestedData:
      (Array.isArray((body as { jobRequestedData?: JobApplication[] }).jobRequestedData)
        ? (body as { jobRequestedData?: JobApplication[] }).jobRequestedData
        : details.jobRequestedData) ?? [],
    jobRequestedDataNew:
      (hasApplicationIdentity((body as { jobRequestedDataNew?: unknown }).jobRequestedDataNew)
        ? ((body as { jobRequestedDataNew?: JobApplication }).jobRequestedDataNew ?? null)
        : hasApplicationIdentity(details.jobRequestedDataNew)
          ? details.jobRequestedDataNew
          : null),
    ratedbyme:
      typeof (body as { ratedbyme?: unknown }).ratedbyme === "number"
        ? ((body as { ratedbyme?: number }).ratedbyme ?? 0)
        : typeof details.ratedbyme === "number"
          ? details.ratedbyme
          : 0,
    jobreviewData:
      (body as { jobreviewData?: unknown }).jobreviewData ??
      details.jobreviewData ??
      null,
    raw: body,
  };
}

export function getJobOwnerId(job?: JobDetails | null) {
  const owner = job?.userId;
  if (!owner) return "";
  if (typeof owner === "string") return owner;
  return owner._id ?? "";
}

export function getUserFullName(user?: {
  firstname?: string;
  lastname?: string;
  name?: string;
} | null) {
  return [user?.firstname ?? user?.name, user?.lastname].filter(Boolean).join(" ").trim();
}

export function getJobTitle(job?: JobDetails | null) {
  return job?.job_title?.trim() || job?.title?.trim() || "Job";
}

export function getJobDescription(job?: JobDetails | null) {
  return job?.description?.trim() || job?.job_description?.trim() || "";
}

export function getWorkerUploadedImages(images?: JobImageValue[] | null) {
  return Array.isArray(images) ? images.filter(Boolean) : [];
}

