import type { JobDetailsEnvelope, JobDetails, AddressValue, JobTypeValue, UserValue } from "@/lib/jobFlow";
import { getJobDescription, getJobTitle, normalizeJobDetails } from "@/lib/jobFlow";
import { sanitizePublicLocation } from "@/lib/publicLocation";
import { getSiteUrl } from "@/lib/site";

type JobDetailsResponse = {
  statusCode: number;
  body: string;
  contentType: string | null;
};

type JobDetailsPayload = {
  jobId: string;
  userId?: string;
};

export type JobShareData = {
  id: string;
  title: string;
  description: string;
  shareDescription: string;
  metadataTitle: string;
  metadataDescription: string;
  shareTitle: string;
  shareText: string;
  priceLabel: string | null;
  jobTypeName: string | null;
  location: string | null;
  dateLabel: string | null;
  posterName: string | null;
  imageUrl: string | null;
  url: string;
};

export type JobShareContent = {
  id: string;
  title: string;
  description: string;
  location: string | null;
  priceLabel: string | null;
  url: string;
  shareTitle: string;
  shareText: string;
};

function getBackendBaseUrl() {
  const value = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!value) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured");
  }
  return value;
}

function resolveMediaUrl(path?: string) {
  if (!path) return null;
  const trimmed = path.trim();
  if (!trimmed || trimmed === "/" || trimmed === "#" || trimmed === "undefined" || trimmed === "null") return null;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("data:")) return trimmed;

  const root = getBackendBaseUrl().replace(/\/api\/?$/, "");
  const normalizedPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${root}${normalizedPath}`;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getJobTypeName(jobType?: JobTypeValue) {
  if (!jobType) return null;
  if (typeof jobType === "string") return jobType.trim() || null;
  return typeof jobType.name === "string" && jobType.name.trim() ? jobType.name.trim() : null;
}

function getPosterName(user?: UserValue) {
  if (!user || typeof user === "string" || !isObject(user)) return null;
  const first = typeof user.firstname === "string" ? user.firstname.trim() : "";
  const last = typeof user.lastname === "string" ? user.lastname.trim() : "";
  const full = [first, last].filter(Boolean).join(" ").trim();
  if (full) return full;
  return typeof user.name === "string" && user.name.trim() ? user.name.trim() : null;
}

function getAddressText(address?: AddressValue) {
  if (!address) return null;
  if (typeof address === "string") {
    return sanitizePublicLocation(address);
  }

  const parts = [address.city, address.state, address.country]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .map((value) => value.trim());

  return parts[0] || parts[1] || null;
}

function getLocation(job?: JobDetails | null) {
  const addressText = getAddressText(job?.address);
  if (addressText) return addressText;

  if (typeof job?.location === "string" && job.location.trim()) {
    return sanitizePublicLocation(job.location.trim());
  }

  return null;
}

function formatPrice(value?: string | number | null) {
  if (value == null || value === "") return null;
  const amount = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(amount)) return String(value);
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

function formatDate(value?: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-NZ", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

function clipText(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trimEnd()}…`;
}

function stripTrailingPunctuation(value: string) {
  return value.replace(/[.,;:!?]+$/g, "").trim();
}

export function buildPublicJobUrl(jobId: string, originOverride?: string) {
  const path = `/jobs/${encodeURIComponent(jobId)}`;
  if (originOverride) {
    return new URL(path, originOverride).toString();
  }
  return getSiteUrl(path);
}

export function buildJobShareContent(input: {
  id?: string | null;
  title?: string | null;
  description?: string | null;
  location?: string | null;
  priceLabel?: string | null;
  originOverride?: string;
}): JobShareContent | null {
  const id = input.id?.trim();
  if (!id) return null;

  const title = input.title?.trim() || "Local job";
  const description = input.description?.trim() || "View the full job details on Gumboot.";
  const location = sanitizePublicLocation(input.location?.trim() || null);
  const priceLabel = input.priceLabel?.trim() || null;
  const sentence = stripTrailingPunctuation(title);
  const intro = [`Someone needs help with ${sentence}`];

  if (location) {
    intro.push(`in ${location}`);
  }

  if (priceLabel) {
    intro.push(`for ${priceLabel}`);
  }

  const shareText = clipText(`${intro.join(" ")}. View or apply on Gumboot.`, 160);

  return {
    id,
    title,
    description,
    location,
    priceLabel,
    url: buildPublicJobUrl(id, input.originOverride),
    shareTitle: `Job on Gumboot: ${title}`,
    shareText,
  };
}

function buildShareDescription(job: {
  description: string;
  jobTypeName: string | null;
  location: string | null;
  priceLabel: string | null;
  dateLabel: string | null;
}) {
  const safeLocation = sanitizePublicLocation(job.location);
  const facts = [job.jobTypeName, safeLocation, job.priceLabel, job.dateLabel].filter(Boolean);
  const prefix = facts.length > 0 ? `${facts.join(" • ")}.` : "";
  const body = job.description ? clipText(job.description.replace(/\s+/g, " ").trim(), 140) : "";
  return clipText([prefix, body].filter(Boolean).join(" "), 180) || "View this job on Gumboot.";
}

function buildMetadataTitle(job: { title: string; location: string | null }) {
  const safeLocation = sanitizePublicLocation(job.location);
  return safeLocation ? `${job.title} in ${safeLocation} on Gumboot` : `${job.title} on Gumboot`;
}

function buildMetadataDescription() {
  return "View this local job and send an offer through Gumboot.";
}

function getPrimaryImage(job?: JobDetails | null) {
  if (!job) return null;
  if (Array.isArray(job.image)) {
    for (const entry of job.image) {
      const resolved = resolveMediaUrl(entry?.url);
      if (resolved) return resolved;
    }
  }

  if (job.job_type && typeof job.job_type !== "string" && "image" in job.job_type && Array.isArray(job.job_type.image)) {
    for (const entry of job.job_type.image) {
      if (typeof entry !== "string") continue;
      const resolved = resolveMediaUrl(entry);
      if (resolved) return resolved;
    }
  }

  return null;
}

async function requestJobDetailsFromServer(url: URL, payload: JobDetailsPayload): Promise<JobDetailsResponse> {
  const body = JSON.stringify(payload);
  const transport =
    url.protocol === "https:" ? await import("https") : await import("http");

  return new Promise<JobDetailsResponse>((resolve, reject) => {
    const request = transport.request(
      url,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body).toString(),
        },
      },
      (response) => {
        const chunks: Buffer[] = [];

        response.on("data", (chunk) => {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        });

        response.on("end", () => {
          resolve({
            statusCode: response.statusCode ?? 500,
            body: Buffer.concat(chunks).toString("utf8"),
            contentType: Array.isArray(response.headers["content-type"])
              ? response.headers["content-type"][0] ?? null
              : response.headers["content-type"] ?? null,
          });
        });
      }
    );

    request.on("error", reject);
    request.write(body);
    request.end();
  });
}

export async function requestJobDetails(jobId: string, userId?: string): Promise<JobDetailsResponse> {
  const baseUrl = getBackendBaseUrl().replace(/\/+$/, "");
  const url = new URL(`${baseUrl}/job_details`);
  url.searchParams.set("jobId", jobId);
  if (userId) url.searchParams.set("userId", userId);
  const payload: JobDetailsPayload = { jobId, ...(userId ? { userId } : {}) };

  if (typeof window === "undefined") {
    return requestJobDetailsFromServer(url, payload);
  }

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  return {
    statusCode: response.status,
    body: await response.text(),
    contentType: response.headers.get("content-type"),
  };
}

export async function fetchJobDetailsEnvelope(jobId: string, userId?: string): Promise<JobDetailsEnvelope | null> {
  const response = await requestJobDetails(jobId, userId);
  if (!response.body) return null;

  try {
    return JSON.parse(response.body) as JobDetailsEnvelope;
  } catch {
    return null;
  }
}

export async function fetchJobShareData(jobId: string): Promise<JobShareData | null> {
  const payload = await fetchJobDetailsEnvelope(jobId);
  if (!payload || payload.success === false) return null;

  const job = normalizeJobDetails(payload);
  if (!job) return null;

  const title = getJobTitle(job);
  const description = getJobDescription(job) || "View the full job details on Gumboot.";
  const jobTypeName = getJobTypeName(job.job_type);
  const location = getLocation(job);
  const priceLabel = formatPrice(job.offered_price ?? job.price ?? null);
  const dateLabel = formatDate(job.exp_date ?? job.date ?? null);
  const posterName = getPosterName(job.userId);
  const imageUrl = getPrimaryImage(job);
  const shareContent = buildJobShareContent({
    id: job._id || job.id || jobId,
    title,
    description,
    location,
    priceLabel,
  });

  if (!shareContent) return null;

  return {
    id: shareContent.id,
    title: shareContent.title,
    description: shareContent.description,
    shareDescription: buildShareDescription({ description, jobTypeName, location, priceLabel, dateLabel }),
    metadataTitle: buildMetadataTitle({ title: shareContent.title, location }),
    metadataDescription: buildMetadataDescription(),
    shareTitle: shareContent.shareTitle,
    shareText: shareContent.shareText,
    priceLabel,
    jobTypeName,
    location,
    dateLabel,
    posterName,
    imageUrl,
    url: shareContent.url,
  };
}
