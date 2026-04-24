export function getSiteOrigin() {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.SITE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL,
  ];

  for (const candidate of candidates) {
    const value = candidate?.trim();
    if (!value) continue;
    if (value.startsWith("http://") || value.startsWith("https://")) return value;
    return `https://${value}`;
  }

  return "http://localhost:3000";
}

export function getSiteUrl(path = "/") {
  return new URL(path, getSiteOrigin()).toString();
}
