import { api } from "./api";
import type { ApiEnvelope } from "./apiTypes";

type UnknownRecord = Record<string, unknown>;

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export type JobType = {
  id: string;
  name: string;
  icon?: string;
};

function firstNonEmptyArray(...values: unknown[]): unknown[] {
  for (const value of values) {
    if (Array.isArray(value) && value.length > 0) return value;
  }
  for (const value of values) {
    if (Array.isArray(value)) return value;
  }
  return [];
}

function pickFirstString(...values: unknown[]): string | undefined {
  for (const v of values) {
    if (typeof v === "string" && v.trim()) return v;
  }
  return undefined;
}

function normalizeJobTypesFromEnvelope(res: ApiEnvelope<unknown>) {
  const root = res as unknown as UnknownRecord;
  const body = (root.body ?? root.data ?? root) as UnknownRecord;
  const list = firstNonEmptyArray(
    body.jobType,
    body.job_types,
    body.jobTypes,
    body.types,
    body.list,
    body.job_type,
    body.jobtype,
    body.category,
    body.categories,
    root.body,
    root.data,
    body
  );

  return list
    .map((item) => {
      const row = (item ?? {}) as UnknownRecord;
      const id = pickFirstString(row._id, row.id, row.value);
      const name = pickFirstString(row.name, row.title, row.label);
      const image = row.image;
      const icon = Array.isArray(image) ? pickFirstString(image[0]) : pickFirstString(image);
      if (!id || !name) return null;
      return { id, name, icon } as JobType;
    })
    .filter((x): x is JobType => Boolean(x));
}

export async function getJobTypes() {
  const getRes = await api<ApiEnvelope<unknown>>("/get_job_types", { method: "GET" });
  const normalizedFromGet = normalizeJobTypesFromEnvelope(getRes);
  if (normalizedFromGet.length > 0) return normalizedFromGet;

  // Some backend variants expose this endpoint as POST.
  const postRes = await api<ApiEnvelope<unknown>>("/get_job_types", { method: "POST", body: {} });
  return normalizeJobTypesFromEnvelope(postRes);
}

export async function addAddress(payload: UnknownRecord) {
  return api<ApiEnvelope<unknown>>("/add_address", { method: "POST", body: payload });
}

function readToken() {
  if (typeof window === "undefined") return "";
  return (
    window.localStorage.getItem("gumboot_token") ||
    window.localStorage.getItem("token") ||
    ""
  );
}

export async function uploadFile(file: File): Promise<string | undefined> {
  const token = readToken();
  const form = new FormData();
  form.append("file", file);
  form.append("image", file);

  const res = await fetch(`${API_BASE}/file_upload`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: form,
    cache: "no-store",
  });

  const text = await res.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = {};
  }
  if (!res.ok) {
    const env = parsed as { message?: string };
    throw new Error(env.message || `Upload failed (${res.status})`);
  }

  const root = parsed as UnknownRecord;
  const body = (root.body ?? root.data ?? root) as UnknownRecord;

  return pickFirstString(
    body.url,
    body.image,
    body.file,
    (body.fileData as UnknownRecord | undefined)?.url,
    (body.fileData as UnknownRecord | undefined)?.file
  );
}

export async function addJob(payload: UnknownRecord) {
  return api<ApiEnvelope<unknown>>("/add_job", { method: "POST", body: payload });
}
