"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signup } from "@/lib/auth";
import {
  normalizeCountryCode,
  normalizePhoneNumber,
} from "@/lib/otp";
import { useLocalDevOtpBypassEnabled } from "@/lib/useLocalDevOtpBypass";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');

  .sp-root * { box-sizing: border-box; margin: 0; padding: 0; }
  .sp-root {
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

  .sp-grid {
    width: 100%;
    max-width: 940px;
    display: grid;
    gap: 16px;
    grid-template-columns: 1fr;
  }
  @media (min-width: 860px) {
    .sp-grid { grid-template-columns: 1.15fr 1fr; align-items: start; }
  }

  /* ── Hero panel ── */
  .sp-hero {
    border: 1px solid rgba(229,229,229,0.08);
    border-radius: 20px;
    background: #3E4A51;
    padding: 44px 40px 40px;
    display: flex;
    flex-direction: column;
    min-height: 420px;
    position: relative;
    overflow: hidden;
  }
  .sp-hero::before, .sp-hero::after {
    content: '';
    position: absolute;
    border-radius: 50%;
    pointer-events: none;
  }
  .sp-hero::before {
    width: 320px; height: 320px;
    top: -100px; right: -100px;
    border: 1px solid rgba(229,229,229,0.05);
  }
  .sp-hero::after {
    width: 190px; height: 190px;
    top: -50px; right: -50px;
    border: 1px solid rgba(229,229,229,0.04);
  }

  .sp-eyebrow {
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
  .sp-eyebrow::before {
    content: '';
    display: block;
    width: 22px; height: 1px;
    background: rgba(229,229,229,0.28);
    flex-shrink: 0;
  }

  .sp-logo {
    font-family: 'DM Serif Display', serif;
    font-size: 42px;
    font-weight: 400;
    color: #E5E5E5;
    line-height: 1.05;
    margin-bottom: 18px;
    letter-spacing: -0.01em;
  }
  .sp-logo-dot { color: #26A69A; }

  .sp-hero-top {
    position: relative;
    z-index: 1;
  }

  .sp-pill-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 18px;
  }
  .sp-pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    border: 1px solid rgba(229,229,229,0.1);
    border-radius: 999px;
    background: rgba(42,52,57,0.5);
    padding: 8px 12px;
    font-size: 11px;
    letter-spacing: 0.04em;
    color: rgba(229,229,229,0.7);
  }
  .sp-pill::before {
    content: '';
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #26A69A;
    box-shadow: 0 0 0 4px rgba(38,166,154,0.12);
    flex-shrink: 0;
  }

  .sp-hero-title {
    font-family: 'DM Serif Display', serif;
    font-size: 38px;
    font-weight: 400;
    line-height: 1.08;
    letter-spacing: -0.02em;
    color: #F4F0EA;
    max-width: 520px;
    margin-bottom: 18px;
  }

  .sp-tagline {
    font-size: 15px;
    color: rgba(229,229,229,0.66);
    line-height: 1.8;
    font-weight: 400;
    max-width: 500px;
    margin-bottom: 28px;
  }

  .sp-hero-note {
    max-width: 460px;
    border-left: 2px solid rgba(38,166,154,0.55);
    padding-left: 16px;
    color: rgba(229,229,229,0.56);
    font-size: 13px;
    line-height: 1.7;
  }

  .sp-bottom-panel {
    grid-column: 1 / -1;
    border: 1px solid rgba(229,229,229,0.08);
    border-radius: 20px;
    background:
      linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.02)),
      #344047;
    padding: 28px 30px;
    position: relative;
    overflow: hidden;
  }
  .sp-bottom-panel::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at top left, rgba(38,166,154,0.08), transparent 34%),
      radial-gradient(circle at bottom right, rgba(91,110,127,0.1), transparent 38%);
    pointer-events: none;
  }
  .sp-bottom-head {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 18px;
  }
  .sp-bottom-title {
    font-family: 'DM Serif Display', serif;
    font-size: 24px;
    font-weight: 400;
    line-height: 1.15;
    color: #F4F0EA;
  }
  .sp-bottom-sub {
    max-width: 420px;
    font-size: 13px;
    line-height: 1.7;
    color: rgba(229,229,229,0.58);
    text-align: right;
  }

  .sp-stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    position: relative;
    z-index: 1;
  }
  .sp-stat {
    border: 1px solid rgba(229,229,229,0.08);
    border-radius: 16px;
    padding: 18px 18px 18px 20px;
    background:
      linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02)),
      rgba(42,52,57,0.58);
    display: grid;
    grid-template-columns: 44px minmax(0, 1fr);
    gap: 14px;
    align-items: start;
    backdrop-filter: blur(4px);
  }
  .sp-stat-index {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    border: 1px solid rgba(38,166,154,0.22);
    background: rgba(38,166,154,0.1);
    color: #9fe0d8;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  .sp-stat-copy {
    min-width: 0;
  }
  .sp-stat-label {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(229,229,229,0.48);
    margin-bottom: 6px;
  }
  .sp-stat-value {
    font-size: 14px;
    line-height: 1.65;
    color: rgba(244,240,234,0.94);
    font-weight: 400;
  }

  /* ── Form panel ── */
  .sp-form-panel {
    border: 1px solid rgba(229,229,229,0.08);
    border-radius: 20px;
    background: #3E4A51;
    padding: 36px;
    display: flex;
    flex-direction: column;
  }

  .sp-form-title {
    font-family: 'DM Serif Display', serif;
    font-size: 28px;
    font-weight: 400;
    color: #E5E5E5;
    margin-bottom: 6px;
    line-height: 1.15;
  }
  .sp-form-sub {
    font-size: 13px;
    color: rgba(229,229,229,0.45);
    line-height: 1.6;
    font-weight: 300;
    margin-bottom: 24px;
  }

  /* Intent toggle */
  .sp-toggle-wrap {
    background: #2A3439;
    border: 1px solid rgba(229,229,229,0.10);
    border-radius: 10px;
    padding: 4px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4px;
    margin-bottom: 10px;
  }
  .sp-toggle-btn {
    font-family: 'DM Sans', sans-serif;
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.04em;
    padding: 10px 12px;
    border-radius: 7px;
    border: none;
    cursor: pointer;
    transition: all 0.16s;
    color: rgba(229,229,229,0.50);
    background: transparent;
  }
  .sp-toggle-btn:hover { color: rgba(229,229,229,0.80); background: rgba(229,229,229,0.05); }
  .sp-toggle-btn.active {
    background: #26A69A;
    color: #ffffff;
    box-shadow: 0 2px 10px rgba(38,166,154,0.30);
  }

  .sp-intent-copy {
    font-size: 11px;
    color: rgba(229,229,229,0.38);
    line-height: 1.55;
    margin-bottom: 22px;
    font-style: italic;
  }

  /* Error */
  .sp-error {
    border: 1px solid rgba(183,91,91,0.35);
    background: rgba(183,91,91,0.10);
    border-radius: 8px;
    padding: 10px 14px;
    font-size: 13px;
    color: rgba(229,180,180,0.90);
    margin-bottom: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  /* Form fields */
  .sp-field-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-bottom: 8px;
  }
  .sp-field { margin-bottom: 8px; }
  .sp-label {
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.13em;
    text-transform: uppercase;
    color: rgba(229,229,229,0.35);
    margin-bottom: 6px;
    display: block;
  }
  .sp-input {
    width: 100%;
    background: #2A3439;
    border: 1px solid rgba(229,229,229,0.12);
    border-radius: 10px;
    padding: 12px 14px;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    color: #E5E5E5;
    outline: none;
    transition: border-color 0.16s, box-shadow 0.16s;
    -webkit-appearance: none;
  }
  .sp-input::placeholder { color: rgba(229,229,229,0.22); }
  .sp-input:focus {
    border-color: #5B6E7F;
    box-shadow: 0 0 0 3px rgba(91,110,127,0.15);
  }
  .sp-input-cc {
    width: 72px;
    flex-shrink: 0;
    text-align: center;
    letter-spacing: 0.04em;
  }
  .sp-phone-row { display: flex; gap: 8px; }

  /* Submit */
  .sp-submit {
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
    margin-top: 6px;
    transition: background 0.16s, box-shadow 0.16s, transform 0.10s;
    box-shadow: 0 4px 16px rgba(38,166,154,0.25);
  }
  .sp-submit:hover:not(:disabled) {
    background: #1E8A80;
    box-shadow: 0 4px 20px rgba(38,166,154,0.35);
  }
  .sp-submit:active:not(:disabled) { transform: scale(0.99); }
  .sp-submit:disabled { opacity: 0.40; cursor: not-allowed; box-shadow: none; }

  .sp-submit-inner { display: flex; align-items: center; justify-content: center; gap: 8px; }
  @keyframes sp-spin { to { transform: rotate(360deg); } }
  .sp-spinner {
    width: 14px; height: 14px;
    border: 2px solid rgba(255,255,255,0.20);
    border-top-color: #ffffff;
    border-radius: 50%;
    animation: sp-spin 0.7s linear infinite;
    flex-shrink: 0;
  }

  /* Footer */
  .sp-divider { height: 1px; background: rgba(229,229,229,0.08); margin: 22px 0; }
  .sp-legal { font-size: 11px; color: rgba(229,229,229,0.25); line-height: 1.65; margin-bottom: 12px; }
  .sp-legal-link {
    color: rgba(229,229,229,0.72);
    text-decoration: none;
    border-bottom: 1px solid rgba(229,229,229,0.18);
    transition: color 0.14s, border-color 0.14s;
  }
  .sp-legal-link:hover {
    color: #E5E5E5;
    border-color: rgba(229,229,229,0.42);
  }
  .sp-login-row { font-size: 13px; color: rgba(229,229,229,0.50); }
  .sp-login-link {
    color: #26A69A;
    font-weight: 500;
    text-decoration: none;
    border-bottom: 1px solid rgba(38,166,154,0.35);
    padding-bottom: 1px;
    transition: color 0.14s, border-color 0.14s;
  }
  .sp-login-link:hover { color: #2ec4b6; border-color: rgba(46,196,182,0.60); }

  @media (max-width: 640px) {
    .sp-root {
      align-items: flex-start;
      padding: 20px 14px 40px;
    }
    .sp-grid {
      gap: 14px;
    }
    .sp-hero,
    .sp-form-panel {
      border-radius: 18px;
    }
    .sp-hero {
      min-height: unset;
      padding: 28px 22px 24px;
    }
    .sp-logo {
      font-size: 34px;
      margin-bottom: 14px;
    }
    .sp-hero-title {
      font-size: 30px;
      margin-bottom: 14px;
    }
    .sp-tagline {
      max-width: none;
      font-size: 14px;
      line-height: 1.7;
      margin-bottom: 20px;
    }
    .sp-hero-note {
      max-width: none;
      font-size: 12px;
      line-height: 1.65;
    }
    .sp-stats {
      grid-template-columns: 1fr;
    }
    .sp-bottom-panel {
      padding: 22px 20px;
      border-radius: 18px;
    }
    .sp-bottom-head {
      align-items: start;
      justify-content: flex-start;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 16px;
    }
    .sp-bottom-title {
      font-size: 21px;
    }
    .sp-bottom-sub {
      max-width: none;
      text-align: left;
      font-size: 12px;
      line-height: 1.65;
    }
    .sp-stat {
      grid-template-columns: 38px minmax(0, 1fr);
      gap: 12px;
      padding: 14px;
    }
    .sp-stat-index {
      width: 38px;
      height: 38px;
      border-radius: 10px;
    }
    .sp-form-panel {
      padding: 24px 20px;
    }
    .sp-form-title {
      font-size: 24px;
    }
    .sp-form-sub {
      margin-bottom: 20px;
    }
    .sp-field-row {
      grid-template-columns: 1fr;
      gap: 0;
    }
    .sp-phone-row {
      display: grid;
      grid-template-columns: 84px minmax(0, 1fr);
    }
    .sp-submit {
      min-height: 50px;
      font-size: 12px;
    }
  }
`;

const SIGNUP_DRAFT_KEY = "gumboot_signup_draft";

function readSignupDraft() {
  if (typeof window === "undefined") {
    return {
      firstname: "",
      lastname: "",
      email: "",
      phone: "",
      country_code: "+64",
    };
  }

  const raw = window.sessionStorage.getItem(SIGNUP_DRAFT_KEY);
  if (!raw) {
    return {
      firstname: "",
      lastname: "",
      email: "",
      phone: "",
      country_code: "+64",
    };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<{
      firstname: string;
      lastname: string;
      email: string;
      phone: string;
      country_code: string;
    }>;
    return {
      firstname: parsed.firstname ?? "",
      lastname: parsed.lastname ?? "",
      email: parsed.email ?? "",
      phone: parsed.phone ?? "",
      country_code: parsed.country_code ?? "+64",
    };
  } catch {
    return {
      firstname: "",
      lastname: "",
      email: "",
      phone: "",
      country_code: "+64",
    };
  }
}

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next");
  const isTwilioDevMode = useLocalDevOtpBypassEnabled();
  const [form, setForm] = useState(readSignupDraft);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(SIGNUP_DRAFT_KEY, JSON.stringify(form));
  }, [form]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const signupNextPath = nextPath || "/?signup=1";
      const payload = {
        ...form,
        country_code: normalizeCountryCode(form.country_code),
        phone: normalizePhoneNumber(form.phone),
      };
      if (!payload.country_code || !payload.phone) {
        throw new Error("Enter a valid country code and mobile number.");
      }
      const res = await signup(payload);
      const devOtp = isTwilioDevMode ? "123456" : "";
      const serviceSid =
        res?.body?.serviceSid ??
        res?.body?.service_sid ??
        process.env.NEXT_PUBLIC_TWILIO_VERIFY_SERVICE_SID;
      if (!serviceSid) {
        throw new Error("Missing service SID from OTP response");
      }
      const devOtpQuery = devOtp ? `&dev_otp=${encodeURIComponent(devOtp)}` : "";
      router.push(
        `/auth/verify-otp?flow=signup&next=${encodeURIComponent(signupNextPath)}&phone=${encodeURIComponent(payload.phone)}&country_code=${encodeURIComponent(payload.country_code)}&service_sid=${encodeURIComponent(serviceSid)}${devOtpQuery}`
      );
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Signup failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{styles}</style>
      <div className="sp-root">
        <div className="sp-grid">

          {/* ── Hero ── */}
          <section className="sp-hero">
            <div className="sp-hero-top">
              <p className="sp-eyebrow">Get started</p>
              <h1 className="sp-logo">Gumboot<span className="sp-logo-dot">.</span></h1>
              <div className="sp-pill-row">
                <span className="sp-pill">Built for New Zealand</span>
                <span className="sp-pill">Secure signup</span>
              </div>
              <h2 className="sp-hero-title">Local help, without the hard sell.</h2>
              <p className="sp-tagline">
                A simple way to find local help around Aotearoa. Post a job, have a look at who puts their hand up, and choose what feels right.
              </p>
              <p className="sp-hero-note">
                Gumboot is designed to feel dependable from the start: clear profiles, straightforward communication, and a signup flow that keeps things simple.
              </p>
            </div>
          </section>

          {/* ── Form ── */}
          <section className="sp-form-panel">
            <h2 className="sp-form-title">Create account</h2>
            <p className="sp-form-sub">Start with your details and verify with a one-time code.</p>

            {/* Intent toggle */}

            {error && (
              <div className="sp-error">
                <span>⚠</span>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="sp-field-row">
                <div>
                  <label className="sp-label">First name</label>
                  <input
                    className="sp-input"
                    placeholder="Jane"
                    value={form.firstname}
                    onChange={(e) => setForm({ ...form, firstname: e.target.value })}
                    autoComplete="given-name"
                    data-testid="signup-first-name"
                    required
                  />
                </div>
                <div>
                  <label className="sp-label">Last name</label>
                  <input
                    className="sp-input"
                    placeholder="Smith"
                    value={form.lastname}
                    onChange={(e) => setForm({ ...form, lastname: e.target.value })}
                    autoComplete="family-name"
                    data-testid="signup-last-name"
                    required
                  />
                </div>
              </div>

              <div className="sp-field">
                <label className="sp-label">Email</label>
                <input
                  className="sp-input"
                  placeholder="jane@example.com"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  autoComplete="email"
                  data-testid="signup-email"
                  required
                />
              </div>

              <div className="sp-field">
                <label className="sp-label">Phone number</label>
                <div className="sp-phone-row">
                  <input
                    className="sp-input sp-input-cc"
                    value={form.country_code}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        country_code: normalizeCountryCode(e.target.value),
                      })
                    }
                    inputMode="tel"
                    autoComplete="tel-country-code"
                    aria-label="Country code"
                    data-testid="signup-country-code"
                  />
                  <input
                    className="sp-input"
                    placeholder="021 234 5678"
                    value={form.phone}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        phone: e.target.value,
                      })
                    }
                    inputMode="tel"
                    autoComplete="tel"
                    required
                    aria-label="Phone number"
                    data-testid="signup-phone-number"
                  />
                </div>
              </div>

              <button className="sp-submit" disabled={loading} type="submit" data-testid="signup-continue">
                <span className="sp-submit-inner">
                  {loading && <span className="sp-spinner" />}
                  {loading ? "Sending OTP…" : "Continue"}
                </span>
              </button>
            </form>

            <div className="sp-divider" />
            <p className="sp-legal">
              By continuing, you agree to Gumboot&apos;s{" "}
              <Link href="/terms" className="sp-legal-link">Terms of Service</Link> and{" "}
              <Link href="/privacy" className="sp-legal-link">Privacy Policy</Link>.
            </p>
            <p className="sp-login-row">
              Already have an account?{" "}
              <Link href={nextPath ? `/auth/login?next=${encodeURIComponent(nextPath)}` : "/auth/login"} className="sp-login-link">Sign in</Link>
            </p>
          </section>

          <section className="sp-bottom-panel">
            <div className="sp-bottom-head">
              <h3 className="sp-bottom-title">A more grounded way to get started.</h3>
              <p className="sp-bottom-sub">
                Clear expectations, local focus, and a signup flow that keeps things moving.
              </p>
            </div>
            <div className="sp-stats">
              <div className="sp-stat">
                <div className="sp-stat-index">01</div>
                <div className="sp-stat-copy">
                  <p className="sp-stat-label">Straight up</p>
                  <p className="sp-stat-value">No inflated numbers. Just a new platform getting started properly.</p>
                </div>
              </div>
              <div className="sp-stat">
                <div className="sp-stat-index">02</div>
                <div className="sp-stat-copy">
                  <p className="sp-stat-label">Local first</p>
                  <p className="sp-stat-value">Built for everyday jobs, neighbours helping neighbours, and small businesses lending a hand.</p>
                </div>
              </div>
              <div className="sp-stat">
                <div className="sp-stat-index">03</div>
                <div className="sp-stat-copy">
                  <p className="sp-stat-label">No fuss</p>
                  <p className="sp-stat-value">Create an account, verify your number, and get on with it.</p>
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>
    </>
  );
}
