// src/lib/auth.ts
import { api, clearAuthToken } from "./api";
import type { ApiEnvelope } from "./apiTypes";

export type OtpVerifyBody = {
  userDetail?: {
    token?: string;
  };
  token?: string;
};

export type SendOtpBody = {
  otp?: string;
  serviceSid?: string;
  service_sid?: string;
};

/**
 * SIGN UP (step 1)
 * Creates user + sends OTP via Twilio
 */
export async function signup(payload: {
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  country_code?: string | number;
}) {
  return api<ApiEnvelope<unknown>>("/signup", {
    method: "POST",
    body: payload,
  });
}

/**
 * LOGIN (step 1)
 * Sends OTP to existing user
 */
export async function sendLoginOtp(payload: {
  phone: string;
  country_code?: string | number;
}) {
  return api<ApiEnvelope<SendOtpBody>>("/Login", {
    method: "POST",
    body: payload,
  });
}

/**
 * VERIFY OTP (signup + login)
 * Confirms OTP and creates session
 */
export async function otpVerify(payload: {
  phone: string;
  otp: string;
  country_code?: string | number;
  serviceSid?: string;
  service_sid?: string;
  service_id?: string;
}) {
  return api<ApiEnvelope<OtpVerifyBody>>("/otpVerify", {
    method: "POST",
    body: payload,
  });
}

/**
 * LOG OUT
 */
export async function logout() {
  try {
    return await api<ApiEnvelope<unknown>>("/logOut", {
      method: "POST",
    });
  } finally {
    clearAuthToken();
  }
}

/**
 * CURRENT USER ("me")
 * Used to detect logged-in state
 */
export async function me() {
  return api<ApiEnvelope<unknown>>("/profile", {
    method: "GET",
  });
}
