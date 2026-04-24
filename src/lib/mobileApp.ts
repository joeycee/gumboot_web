export type MobileDeviceKind = "ios" | "android" | "other";

const MOBILE_APP_URL = process.env.NEXT_PUBLIC_GUMBOOT_APP_URL ?? "";
const IOS_APP_URL = process.env.NEXT_PUBLIC_GUMBOOT_IOS_APP_URL ?? MOBILE_APP_URL;
const ANDROID_APP_URL = process.env.NEXT_PUBLIC_GUMBOOT_ANDROID_APP_URL ?? MOBILE_APP_URL;
const DEEP_LINK_BASE =
  process.env.NEXT_PUBLIC_GUMBOOT_DEEP_LINK_BASE ??
  process.env.NEXT_PUBLIC_GUMBOOT_DEEP_LINK_URL ??
  MOBILE_APP_URL;

function normalizeUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function detectMobileDevice(userAgent: string): MobileDeviceKind {
  const ua = userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  return "other";
}

export function getMobileStoreUrl(deviceKind: MobileDeviceKind) {
  if (deviceKind === "ios") return normalizeUrl(IOS_APP_URL);
  if (deviceKind === "android") return normalizeUrl(ANDROID_APP_URL);
  return normalizeUrl(MOBILE_APP_URL);
}

export function buildJobAppLink(jobId: string) {
  const base = DEEP_LINK_BASE.trim();
  if (!base) return "";

  const encodedId = encodeURIComponent(jobId);

  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(base)) {
    return `${base.replace(/\/+$/, "")}/jobs/${encodedId}?source=share`;
  }

  try {
    const url = new URL(normalizeUrl(base));
    url.pathname = `${url.pathname.replace(/\/+$/, "")}/jobs/${encodedId}`;
    url.searchParams.set("source", "share");
    return url.toString();
  } catch {
    return "";
  }
}

export function cameFromExternalReferrer(currentUrl: string, referrer: string) {
  if (!referrer) return false;

  try {
    const current = new URL(currentUrl);
    const previous = new URL(referrer);
    return current.origin !== previous.origin;
  } catch {
    return false;
  }
}

export function shouldAttemptMobileAppOpen(userAgent: string, currentUrl: string, referrer: string) {
  return detectMobileDevice(userAgent) !== "other" && cameFromExternalReferrer(currentUrl, referrer);
}
