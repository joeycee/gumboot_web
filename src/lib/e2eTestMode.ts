import { normalizeCountryCode, normalizePhoneNumber } from "@/lib/otp";

export type E2ETestAccount = {
  key: "owner" | "worker";
  phone: string;
  countryCode: string;
  token: string;
};

function isTruthy(value?: string) {
  if (!value) return false;
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

export function isE2ETestModeEnabled() {
  return isTruthy(process.env.E2E_TEST_MODE) || isTruthy(process.env.NEXT_PUBLIC_E2E_TEST_MODE);
}

export function isLocalHostname(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

export function isClientE2ETestModeEnabled() {
  if (typeof window === "undefined") return false;
  if (!isE2ETestModeEnabled()) return false;
  return isLocalHostname(window.location.hostname);
}

function getAccountFromEnv(prefix: "OWNER" | "WORKER"): E2ETestAccount | null {
  const phone = process.env[`PLAYWRIGHT_${prefix}_PHONE`]?.trim() ?? "";
  const countryCode = normalizeCountryCode(process.env[`PLAYWRIGHT_${prefix}_COUNTRY_CODE`]?.trim() ?? "+64");
  const token = process.env[`PLAYWRIGHT_${prefix}_TOKEN`]?.trim() ?? "";
  if (!phone || !countryCode || !token) return null;

  return {
    key: prefix === "OWNER" ? "owner" : "worker",
    phone: normalizePhoneNumber(phone),
    countryCode,
    token,
  };
}

export function getConfiguredE2ETestAccounts() {
  return [getAccountFromEnv("OWNER"), getAccountFromEnv("WORKER")].filter(
    (account): account is E2ETestAccount => Boolean(account)
  );
}

export function matchE2ETestAccount(payload: { phone: string; countryCode: string }) {
  const normalizedPhone = normalizePhoneNumber(payload.phone);
  const normalizedCountryCode = normalizeCountryCode(payload.countryCode);

  return (
    getConfiguredE2ETestAccounts().find(
      (account) => account.phone === normalizedPhone && account.countryCode === normalizedCountryCode
    ) ?? null
  );
}
