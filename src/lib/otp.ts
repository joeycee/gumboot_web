export function isTwilioDevModeConfigured() {
  return (
    process.env.NEXT_PUBLIC_TWILIO_MODE === "development" ||
    process.env.TWILIO_MODE === "development"
  );
}

export function isLocalDevOtpBypassEnabled() {
  if (!isTwilioDevModeConfigured()) return false;
  if (typeof window === "undefined") return false;

  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1" || host === "::1";
}

export function normalizeCountryCode(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits ? `+${digits}` : "";
}

export function normalizePhoneNumber(value: string) {
  return value.replace(/\D/g, "");
}
