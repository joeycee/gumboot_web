"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { me, otpVerify, resendSignupOtp, sendLoginOtp } from "@/lib/auth";
import { clearAuthToken, setAuthToken } from "@/lib/api";
import {
  isTwilioDevModeConfigured,
  normalizeCountryCode,
  normalizePhoneNumber,
} from "@/lib/otp";
import { useLocalDevOtpBypassEnabled } from "@/lib/useLocalDevOtpBypass";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');

  .vop-root * { box-sizing: border-box; margin: 0; padding: 0; }
  .vop-root {
    min-height: 100dvh;
    background: #2A3439;
    font-family: 'DM Sans', sans-serif;
    color: #E5E5E5;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    background-image:
      radial-gradient(ellipse at 20% 10%, rgba(91,110,127,0.16) 0%, transparent 55%),
      radial-gradient(ellipse at 80% 90%, rgba(38,166,154,0.07) 0%, transparent 50%);
  }

  .vop-grid {
    width: 100%;
    max-width: 900px;
    display: grid;
    gap: 16px;
    grid-template-columns: 1fr;
  }
  @media (min-width: 860px) {
    .vop-grid { grid-template-columns: 1.1fr 1fr; align-items: start; }
  }

  /* ── Hero panel ── */
  .vop-hero {
    border: 1px solid rgba(229,229,229,0.08);
    border-radius: 20px;
    background: #3E4A51;
    padding: 44px 40px 40px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 380px;
    position: relative;
    overflow: hidden;
  }
  .vop-hero::before, .vop-hero::after {
    content: '';
    position: absolute;
    border-radius: 50%;
    pointer-events: none;
  }
  .vop-hero::before {
    width: 320px; height: 320px;
    top: -100px; right: -100px;
    border: 1px solid rgba(229,229,229,0.05);
  }
  .vop-hero::after {
    width: 190px; height: 190px;
    top: -50px; right: -50px;
    border: 1px solid rgba(229,229,229,0.04);
  }

  .vop-eyebrow {
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: rgba(229,229,229,0.38);
    margin-bottom: 22px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .vop-eyebrow::before {
    content: '';
    display: block;
    width: 22px; height: 1px;
    background: rgba(229,229,229,0.28);
    flex-shrink: 0;
  }

  .vop-logo {
    font-family: 'DM Serif Display', serif;
    font-size: 42px;
    font-weight: 400;
    color: #E5E5E5;
    line-height: 1.05;
    margin-bottom: 18px;
    letter-spacing: -0.01em;
  }
  .vop-logo-dot { color: #26A69A; }

  .vop-tagline {
    font-size: 14px;
    color: rgba(229,229,229,0.52);
    line-height: 1.75;
    font-weight: 300;
    max-width: 320px;
  }

  /* Phone card */
  .vop-phone-card {
    margin-top: 40px;
    border: 1px solid rgba(229,229,229,0.08);
    border-radius: 12px;
    padding: 18px 20px;
    background: rgba(42,52,57,0.60);
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .vop-phone-icon {
    width: 36px; height: 36px;
    border-radius: 8px;
    background: rgba(38,166,154,0.12);
    border: 1px solid rgba(38,166,154,0.22);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    flex-shrink: 0;
  }
  .vop-phone-label {
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.10em;
    text-transform: uppercase;
    color: rgba(229,229,229,0.35);
    margin-bottom: 4px;
  }
  .vop-phone-number {
    font-family: 'DM Serif Display', serif;
    font-size: 20px;
    color: #E5E5E5;
    line-height: 1;
  }

  /* ── Form panel ── */
  .vop-form-panel {
    border: 1px solid rgba(229,229,229,0.08);
    border-radius: 20px;
    background: #3E4A51;
    padding: 40px 36px;
    display: flex;
    flex-direction: column;
  }

  .vop-form-title {
    font-family: 'DM Serif Display', serif;
    font-size: 28px;
    font-weight: 400;
    color: #E5E5E5;
    margin-bottom: 6px;
    line-height: 1.15;
  }
  .vop-form-sub {
    font-size: 13px;
    color: rgba(229,229,229,0.45);
    line-height: 1.6;
    font-weight: 300;
    margin-bottom: 28px;
  }

  /* Error */
  .vop-error {
    border: 1px solid rgba(183,91,91,0.35);
    background: rgba(183,91,91,0.10);
    border-radius: 8px;
    padding: 10px 14px;
    font-size: 13px;
    color: rgba(229,180,180,0.90);
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  /* OTP input */
  .vop-label {
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.13em;
    text-transform: uppercase;
    color: rgba(229,229,229,0.35);
    margin-bottom: 8px;
    display: block;
  }
  .vop-otp-input {
    width: 100%;
    background: #2A3439;
    border: 1px solid rgba(229,229,229,0.12);
    border-radius: 10px;
    padding: 16px 14px;
    font-family: 'DM Sans', sans-serif;
    font-size: 24px;
    font-weight: 500;
    color: #E5E5E5;
    letter-spacing: 0.40em;
    text-align: center;
    outline: none;
    transition: border-color 0.16s, box-shadow 0.16s;
    -webkit-appearance: none;
    margin-bottom: 12px;
  }
  .vop-otp-input::placeholder {
    color: rgba(229,229,229,0.18);
    letter-spacing: 0.20em;
    font-size: 18px;
  }
  .vop-otp-input:focus {
    border-color: #5B6E7F;
    box-shadow: 0 0 0 3px rgba(91,110,127,0.15);
  }

  /* Buttons */
  .vop-submit {
    width: 100%;
    padding: 14px;
    border-radius: 10px;
    border: none;
    background: #26A69A;
    color: #ffffff;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    cursor: pointer;
    transition: background 0.16s, box-shadow 0.16s, transform 0.10s;
    box-shadow: 0 4px 16px rgba(38,166,154,0.25);
    margin-bottom: 8px;
  }
  .vop-submit:hover:not(:disabled) {
    background: #1E8A80;
    box-shadow: 0 4px 20px rgba(38,166,154,0.35);
  }
  .vop-submit:active:not(:disabled) { transform: scale(0.99); }
  .vop-submit:disabled { opacity: 0.40; cursor: not-allowed; box-shadow: none; }

  .vop-resend {
    width: 100%;
    padding: 13px;
    border-radius: 10px;
    border: 1px solid rgba(229,229,229,0.12);
    background: transparent;
    color: rgba(229,229,229,0.55);
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 0.04em;
    cursor: pointer;
    transition: all 0.16s;
  }
  .vop-resend:hover:not(:disabled) {
    background: rgba(229,229,229,0.06);
    border-color: rgba(229,229,229,0.22);
    color: #E5E5E5;
  }
  .vop-resend:disabled { opacity: 0.35; cursor: not-allowed; }

  /* Spinner */
  .vop-btn-inner { display: flex; align-items: center; justify-content: center; gap: 8px; }
  @keyframes vop-spin { to { transform: rotate(360deg); } }
  .vop-spinner {
    width: 14px; height: 14px;
    border: 2px solid rgba(255,255,255,0.20);
    border-top-color: #ffffff;
    border-radius: 50%;
    animation: vop-spin 0.7s linear infinite;
    flex-shrink: 0;
  }
  .vop-spinner-dark {
    width: 14px; height: 14px;
    border: 2px solid rgba(229,229,229,0.15);
    border-top-color: rgba(229,229,229,0.60);
    border-radius: 50%;
    animation: vop-spin 0.7s linear infinite;
    flex-shrink: 0;
  }

  /* Footer */
  .vop-divider { height: 1px; background: rgba(229,229,229,0.08); margin: 22px 0; }
  .vop-back-row { font-size: 13px; color: rgba(229,229,229,0.50); }
  .vop-back-link {
    color: #26A69A;
    font-weight: 500;
    text-decoration: none;
    border-bottom: 1px solid rgba(38,166,154,0.35);
    padding-bottom: 1px;
    transition: color 0.14s, border-color 0.14s;
  }
  .vop-back-link:hover { color: #2ec4b6; border-color: rgba(46,196,182,0.60); }
`;

export default function VerifyOtpPage() {
  const params = useSearchParams();
  const router = useRouter();

  const phone = normalizePhoneNumber(params.get("phone") ?? "");
  const countryCode = normalizeCountryCode(params.get("country_code") ?? "+64");
  const serviceSid =
    params.get("service_sid") ??
    process.env.NEXT_PUBLIC_TWILIO_VERIFY_SERVICE_SID ??
    "";
  const flow = params.get("flow") ?? "login";
  const nextPath = params.get("next");
  const isTwilioDevMode = useLocalDevOtpBypassEnabled();
  const devOtp = isTwilioDevMode
    ? params.get("dev_otp") ?? "123456"
    : "";

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (flow === "signup" && devOtp) {
      setOtp(devOtp);
    }
  }, [flow, devOtp]);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      if (flow === "signup" && isTwilioDevMode) {
        if (otp !== devOtp) {
          throw new Error("Use the development code shown on screen.");
        }
        setAuthToken("dev-local-token");
        router.push(
          nextPath
            ? `/auth/signup/profile-setup?next=${encodeURIComponent(nextPath)}`
            : "/auth/signup/profile-setup"
        );
        return;
      }
      if (!serviceSid) {
        throw new Error("Missing service SID. Please request a new OTP.");
      }
      const res = await otpVerify({
        phone,
        country_code: countryCode,
        otp,
        code: otp,
        serviceSid: serviceSid || undefined,
        service_sid: serviceSid || undefined,
        service_id: serviceSid || undefined,
      });
      const token = res?.body?.userDetail?.token ?? res?.body?.token;
      if (!token) {
        clearAuthToken();
        throw new Error("No auth token returned from verification. Please try again.");
      }
      setAuthToken(token);
      try {
        await me();
      } catch {}
      router.push(
        flow === "signup"
          ? nextPath
            ? `/auth/signup/profile-setup?next=${encodeURIComponent(nextPath)}`
            : "/auth/signup/profile-setup"
          : nextPath || "/"
      );
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Invalid code");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    try {
      setResending(true);
      setError(null);
      if (flow === "signup" && isTwilioDevMode) return;
      if (!serviceSid) {
        throw new Error("Missing service SID. Please go back and request OTP again.");
      }
      if (flow === "signup") {
        await resendSignupOtp({
          phone,
          country_code: countryCode,
          serviceSid: serviceSid || undefined,
          service_sid: serviceSid || undefined,
          service_id: serviceSid || undefined,
        });
      } else {
        await sendLoginOtp({ phone, country_code: countryCode });
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to resend code");
    } finally {
      setResending(false);
    }
  }

  return (
    <>
      <style>{styles}</style>
      <div className="vop-root">
        <div className="vop-grid">

          {/* ── Hero ── */}
          <section className="vop-hero">
            <div>
              <p className="vop-eyebrow">Security check</p>
              <h1 className="vop-logo">Gumboot<span className="vop-logo-dot">.</span></h1>
              <p className="vop-tagline">
                Enter the one-time code sent to your mobile to complete sign in and secure your account.
              </p>
            </div>

            <div className="vop-phone-card">
              <div className="vop-phone-icon">📱</div>
              <div>
                <p className="vop-phone-label">Code sent to</p>
                <p className="vop-phone-number">{countryCode} {phone}</p>
              </div>
            </div>
          </section>

          {/* ── Form ── */}
          <section className="vop-form-panel">
            <h2 className="vop-form-title">Enter code</h2>
              <p className="vop-form-sub">
              {flow === "signup" && devOtp && isTwilioDevMode && isTwilioDevModeConfigured()
                ? `Development mode: use code ${devOtp}`
                : "Use the 6-digit code from your SMS."}
            </p>

            {error && (
              <div className="vop-error">
                <span>⚠</span>
                {error}
              </div>
            )}

            <form onSubmit={handleVerify}>
              <label className="vop-label">One-time code</label>
              <input
                className="vop-otp-input"
                placeholder="••••••"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                maxLength={6}
                required
                autoComplete="one-time-code"
              />

              <button className="vop-submit" disabled={loading || otp.length < 6} type="submit">
                <span className="vop-btn-inner">
                  {loading && <span className="vop-spinner" />}
                  {loading ? "Verifying…" : "Verify and continue"}
                </span>
              </button>

              <button
                type="button"
                className="vop-resend"
                disabled={resending}
                onClick={handleResend}
              >
                <span className="vop-btn-inner">
                  {resending && <span className="vop-spinner-dark" />}
                  {resending ? "Resending…" : "Resend code"}
                </span>
              </button>
            </form>

            <div className="vop-divider" />
            <p className="vop-back-row">
              Wrong number?{" "}
              <Link
                href={flow === "signup" ? "/auth/signup" : "/auth/login"}
                className="vop-back-link"
              >
                Go back
              </Link>
            </p>
          </section>

        </div>
      </div>
    </>
  );
}
