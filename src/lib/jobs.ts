export type Job = {
  id: string;
  title: string;
  price?: number;
  lat: number;
  lng: number;
  jobTypeName?: string;
  jobTypeIconPath?: string;
  imageUrl?: string;
  imageUrls?: string[];
  description?: string;
  addressText?: string;
  city?: string;
  date?: string;
  shiftTime?: string;
  expDate?: string;
  ownerName?: string;
  userRatingCount?: number;
  userAverageRating?: number;
  raw: unknown;
};

function toNumber(v: unknown): number | null {
  const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) ? n : null;
}

function hasValidCoordinates(lat: number | null, lng: number | null): lat is number {
  if (lat == null || lng == null) return false;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (lat === 0 && lng === 0) return false;
  if (lat < -90 || lat > 90) return false;
  if (lng < -180 || lng > 180) return false;
  return true;
}

function parseCoordinatePair(value: unknown): { lat: number; lng: number } | null {
  if (!Array.isArray(value) || value.length < 2) return null;
  const a = toNumber(value[0]);
  const b = toNumber(value[1]);
  if (a == null || b == null) return null;

  // Prefer GeoJSON order [lng, lat]
  if (hasValidCoordinates(b, a)) return { lat: b, lng: a };
  // Fallback for APIs that send [lat, lng]
  if (hasValidCoordinates(a, b)) return { lat: a, lng: b };
  return null;
}

function pickOwnerName(value: unknown): string | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const row = value as Record<string, unknown>;
  const first =
    typeof row.firstname === "string" && row.firstname.trim()
      ? row.firstname.trim()
      : typeof row.name === "string" && row.name.trim()
        ? row.name.trim()
        : "";
  const last = typeof row.lastname === "string" && row.lastname.trim() ? row.lastname.trim() : "";
  const full = [first, last].filter(Boolean).join(" ").trim();
  return full || undefined;
}

/**
 * Your API may return location in different shapes.
 * This tries common patterns and falls back to (0,0) filtered out later.
 */
export function normalizeJobs(apiBody: unknown): Job[] {
  const maybe = apiBody as { body?: unknown; data?: unknown; jobs?: unknown } | null;
  const list =
    maybe?.body && typeof maybe.body === "object" && maybe.body !== null && "jobs" in maybe.body
      ? (maybe.body as { jobs?: unknown }).jobs
      : maybe?.data && typeof maybe.data === "object" && maybe.data !== null && "jobs" in maybe.data
        ? (maybe.data as { jobs?: unknown }).jobs
        : maybe?.body ?? maybe?.data ?? maybe?.jobs ?? apiBody ?? [];
  if (!Array.isArray(list)) return [];

  let droppedForInvalidCoords = 0;

  const normalized = list
    .map<Job | null>((j: unknown) => {
      const row = (j ?? {}) as Record<string, unknown>;
      const id = row._id ?? row.id ?? row.job_id;
      const title = String(row.title ?? row.job_title ?? row.name ?? "Job");

      // common location shapes:
      // 1) j.location.coordinates = [lng, lat] (GeoJSON)
      // 2) j.location = { lat, lng }
      // 3) j.lat / j.lng
      const location = (row.location ?? null) as { coordinates?: unknown; lat?: unknown; lng?: unknown } | null;
      const coords1 = parseCoordinatePair(location?.coordinates);
      const lat1 = coords1?.lat ?? null;
      const lng1 = coords1?.lng ?? null;

      const lat2 = toNumber(location?.lat ?? row.lat);
      const lng2 = toNumber(location?.lng ?? row.lng);

      const address = (row.address ?? null) as
        | { location?: { coordinates?: unknown; lat?: unknown; lng?: unknown }; address?: unknown; city?: unknown }
        | null;
      const coords2 = parseCoordinatePair(address?.location?.coordinates);
      const lat3 = coords2?.lat ?? null;
      const lng3 = coords2?.lng ?? null;
      const lat4 = toNumber(address?.location?.lat);
      const lng4 = toNumber(address?.location?.lng);

      const lat = lat1 ?? lat2 ?? lat3 ?? lat4;
      const lng = lng1 ?? lng2 ?? lng3 ?? lng4;

      const price = toNumber(row.price ?? row.job_price ?? row.amount ?? row.budget) ?? undefined;
      const jobType = (row.job_type ?? null) as { name?: unknown; image?: unknown } | null;
      const ownerName = pickOwnerName(row.userId ?? row.user ?? row.owner);
      const jobTypeIconPath =
        Array.isArray(jobType?.image) && jobType.image.length > 0
          ? String(jobType.image[0] ?? "")
          : undefined;
      const image = row.image;
      const imageUrl =
        Array.isArray(image) && image.length > 0 && typeof image[0] === "object" && image[0] !== null
          ? String((image[0] as { url?: unknown }).url ?? "")
          : undefined;
      const imageUrls = Array.isArray(image)
        ? image
            .map((item) =>
              typeof item === "object" && item !== null
                ? String((item as { url?: unknown }).url ?? "")
                : ""
            )
            .filter(Boolean)
        : [];
      const description = typeof row.description === "string" ? row.description : undefined;
      const addressText =
        typeof address?.address === "string"
          ? address.address
          : typeof row.address === "string"
            ? row.address
            : undefined;
      const city =
        typeof address?.city === "string"
          ? address.city
          : typeof row.city === "string"
            ? row.city
            : undefined;
      const userRatingData = (row.userRatingData ?? null) as { count?: unknown; averageRating?: unknown } | null;
      const userRatingCount = toNumber(userRatingData?.count ?? null) ?? undefined;
      const userAverageRating = toNumber(userRatingData?.averageRating ?? null) ?? undefined;
      const date = typeof row.date === "string" ? row.date : undefined;
      const shiftTime = typeof row.shift_time === "string" ? row.shift_time : undefined;
      const expDate = typeof row.exp_date === "string" ? row.exp_date : undefined;

      if (!hasValidCoordinates(lat, lng)) {
        droppedForInvalidCoords += 1;
        if (droppedForInvalidCoords <= 5) {
          console.debug("[normalizeJobs] dropped invalid coords:", {
            id: String(id ?? ""),
            title,
            lat1,
            lng1,
            lat2,
            lng2,
            lat3,
            lng3,
            lat4,
            lng4,
            rawLocation: row.location,
            rawAddress: row.address,
          });
        }
        return null;
      }

      const resolvedLat = lat;
      const resolvedLng = lng as number;

      return {
        id: String(id ?? crypto.randomUUID()),
        title,
        price,
        lat: resolvedLat,
        lng: resolvedLng,
        jobTypeName: typeof jobType?.name === "string" ? jobType.name : undefined,
        jobTypeIconPath: jobTypeIconPath || undefined,
        imageUrl: imageUrl || undefined,
        imageUrls,
        description,
        addressText,
        city,
        date,
        shiftTime,
        expDate,
        ownerName,
        userRatingCount,
        userAverageRating,
        raw: row,
      };
    })
    .filter((j): j is Job => j !== null);

  console.debug("[normalizeJobs] totals:", {
    input: list.length,
    output: normalized.length,
    droppedForInvalidCoords,
  });

  return normalized;
}
