export type CalendarScope = "posted" | "applied";

type RecordLike = Record<string, unknown>;

export type CalendarEvent = {
  id: string;
  scope: CalendarScope;
  title: string;
  jobTypeName?: string;
  dateKey: string | null;
  expDate?: string;
  rawDate?: string;
  exactTime?: string;
  shiftTime?: string;
  timeLabel: string | null;
  statusCode: string;
  statusLabel: string;
  addressText: string | null;
  locationText: string | null;
  coordinates: { lat: number; lng: number } | null;
  href: string;
  offeredPrice?: string;
  raw: RecordLike;
};

type EnvelopeLike = {
  body?: {
    jobs?: unknown;
    requestedJobs?: unknown;
  };
};

const STATUS_LABELS: Record<string, string> = {
  "0": "Open",
  "1": "Applied",
  "2": "Accepted",
  "3": "In Progress",
  "4": "Rejected",
  "5": "Cancelled",
  "6": "Completed",
  "7": "Ended",
  "8": "Tracking Started",
  "9": "Arrived",
};

function asRecord(value: unknown): RecordLike | null {
  return value && typeof value === "object" ? (value as RecordLike) : null;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function getJobTypeName(jobType: unknown): string | undefined {
  if (typeof jobType === "string") return jobType;
  const record = asRecord(jobType);
  return asString(record?.name);
}

function buildAddressText(address: RecordLike | null): string | null {
  if (!address) return null;
  const parts = [
    asString(address.address),
    asString(address.city),
    asString(address.state),
    asString(address.country),
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}

function buildLocationSummary(address: RecordLike | null, row: RecordLike): string | null {
  const suburb =
    asString(address?.suburb) ??
    asString(row.suburb) ??
    null;
  const city =
    asString(address?.city) ??
    asString(row.city) ??
    null;

  if (suburb && city) return `${suburb}, ${city}`;
  if (suburb) return suburb;
  if (city) return city;

  const rawAddress = buildAddressText(address) ?? asString(row.address) ?? null;
  if (!rawAddress) return null;
  const parts = rawAddress
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length >= 2) return `${parts[1]}${parts[2] ? `, ${parts[2]}` : ""}`;
  return parts[0] || null;
}

function parseCoordinatePair(value: unknown): { lat: number; lng: number } | null {
  if (!Array.isArray(value) || value.length < 2) return null;
  const first = asNumber(value[0]);
  const second = asNumber(value[1]);
  if (first == null || second == null) return null;

  // Backend mostly uses GeoJSON [lng, lat].
  if (Math.abs(second) <= 90 && Math.abs(first) <= 180) {
    return { lat: second, lng: first };
  }
  if (Math.abs(first) <= 90 && Math.abs(second) <= 180) {
    return { lat: first, lng: second };
  }
  return null;
}

function getCoordinates(row: RecordLike, address: RecordLike | null) {
  const location = asRecord(row.location);
  const addressLocation = asRecord(address?.location);

  return (
    parseCoordinatePair(location?.coordinates) ??
    parseCoordinatePair(addressLocation?.coordinates) ??
    null
  );
}

function toDateKey(value: string | undefined): string | null {
  if (!value) return null;

  // Assumption: `exp_date` is the primary calendar field; plain `date` is a fallback.
  const directMatch = value.match(/^\d{4}-\d{2}-\d{2}/);
  if (directMatch) return directMatch[0];

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatTimeLabel(exactTime?: string, shiftTime?: string): string | null {
  if (exactTime) return exactTime;
  if (!shiftTime) return null;
  return shiftTime.toUpperCase();
}

function statusLabel(code: unknown): string {
  const normalized = String(code ?? "0");
  return STATUS_LABELS[normalized] ?? `Status ${normalized}`;
}

function normalizeJob(row: RecordLike, scope: CalendarScope): CalendarEvent {
  const id = String(row._id ?? row.id ?? crypto.randomUUID());
  const title = asString(row.job_title) ?? asString(row.title) ?? "Untitled Job";
  const jobTypeName = getJobTypeName(row.job_type);
  const expDate = asString(row.exp_date);
  const rawDate = asString(row.date);
  const exactTime = asString(row.exact_time);
  const shiftTime = asString(row.shift_time);
  const statusCode = String(row.job_status ?? "0");
  const address = asRecord(row.address);
  const addressText = buildAddressText(address);
  const locationText = buildLocationSummary(address, row);

  return {
    id,
    scope,
    title,
    jobTypeName,
    dateKey: toDateKey(expDate ?? rawDate),
    expDate,
    rawDate,
    exactTime,
    shiftTime,
    timeLabel: formatTimeLabel(exactTime, shiftTime),
    statusCode,
    statusLabel: statusLabel(statusCode),
    addressText,
    locationText,
    coordinates: getCoordinates(row, address),
    href: `/jobs/${id}`,
    offeredPrice: asString(row.offered_price),
    raw: row,
  };
}

function normalizeList(value: unknown, scope: CalendarScope): CalendarEvent[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const row = asRecord(item);
      return row ? normalizeJob(row, scope) : null;
    })
    .filter((item): item is CalendarEvent => item !== null);
}

export function normalizePostedCalendarEvents(payload: unknown): CalendarEvent[] {
  const envelope = payload as EnvelopeLike | null;
  return normalizeList(envelope?.body?.jobs, "posted");
}

export function normalizeAppliedCalendarEvents(payload: unknown): CalendarEvent[] {
  const envelope = payload as EnvelopeLike | null;
  return normalizeList(envelope?.body?.requestedJobs, "applied");
}

export function getStatusLabel(code: string | number | undefined | null): string {
  return statusLabel(code);
}
