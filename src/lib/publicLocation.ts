export function sanitizePublicLocation(value?: string | null) {
  if (!value) return null;

  const normalizedParts = value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => entry.replace(/\b\d{4,}\b/g, "").replace(/\s{2,}/g, " ").trim())
    .filter(Boolean)
    .filter((entry) => !/new zealand/i.test(entry));

  const parts = normalizedParts.filter((entry) => !/^\d{3,}$/.test(entry));
  const nonStreetParts = parts.filter((entry) => !/^\d+\s+/.test(entry));

  if (nonStreetParts.length >= 2) return `${nonStreetParts[0]}, ${nonStreetParts[1]}`;
  if (nonStreetParts.length === 1) return nonStreetParts[0] || null;
  return null;
}
