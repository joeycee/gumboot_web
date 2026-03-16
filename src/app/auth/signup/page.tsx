"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signup } from "@/lib/auth";

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
    justify-content: space-between;
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

  .sp-tagline {
    font-size: 14px;
    color: rgba(229,229,229,0.52);
    line-height: 1.75;
    font-weight: 300;
    max-width: 320px;
  }

  .sp-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin-top: 40px;
  }
  .sp-stat {
    border: 1px solid rgba(229,229,229,0.08);
    border-radius: 10px;
    padding: 16px 14px;
    background: rgba(42,52,57,0.60);
  }
  .sp-stat-label {
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.10em;
    text-transform: uppercase;
    color: rgba(229,229,229,0.35);
    margin-bottom: 8px;
  }
  .sp-stat-value {
    font-family: 'DM Serif Display', serif;
    font-size: 24px;
    color: #E5E5E5;
    line-height: 1;
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
`;

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next");
  const twilioMode =
    process.env.NEXT_PUBLIC_TWILIO_MODE ?? process.env.TWILIO_MODE;
  const isTwilioDevMode = twilioMode === "development";
  const [form, setForm] = useState({
    firstname: "",
    lastname: "",
    email: "",
    phone: "",
    country_code: "+64",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      if (isTwilioDevMode) {
        router.push(
          `/auth/verify-otp?flow=signup&next=${encodeURIComponent(`/auth/signup/profile-setup${nextPath ? `?next=${encodeURIComponent(nextPath)}` : ""}`)}&phone=${encodeURIComponent(form.phone)}&country_code=${encodeURIComponent(form.country_code)}&dev_otp=123456`
        );
        return;
      }
      const res = await signup(form);
      const devOtp = "";
      const serviceSid =
        res?.body?.serviceSid ??
        res?.body?.service_sid ??
        process.env.NEXT_PUBLIC_TWILIO_VERIFY_SERVICE_SID;
      if (!serviceSid) {
        throw new Error("Missing service SID from OTP response");
      }
      const devOtpQuery = devOtp ? `&dev_otp=${encodeURIComponent(devOtp)}` : "";
      router.push(
        `/auth/verify-otp?flow=signup&next=${encodeURIComponent(`/auth/signup/profile-setup${nextPath ? `?next=${encodeURIComponent(nextPath)}` : ""}`)}&phone=${encodeURIComponent(form.phone)}&country_code=${encodeURIComponent(form.country_code)}&service_sid=${encodeURIComponent(serviceSid)}${devOtpQuery}`
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
            <div>
              <p className="sp-eyebrow">Get started</p>
              <h1 className="sp-logo">Gumboot<span className="sp-logo-dot">.</span></h1>
              <p className="sp-tagline">
                Book trusted local help in minutes. Post a task, review quotes, and pick the right person — with secure payment and verified profiles.
              </p>
            </div>
            <div className="sp-stats">
              <div className="sp-stat">
                <p className="sp-stat-label">Completed</p>
                <p className="sp-stat-value">12k+</p>
              </div>
              <div className="sp-stat">
                <p className="sp-stat-label">Response</p>
                <p className="sp-stat-value">8 min</p>
              </div>
              <div className="sp-stat">
                <p className="sp-stat-label">Verified</p>
                <p className="sp-stat-value">98%</p>
              </div>
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
                  required
                />
              </div>

              <div className="sp-field">
                <label className="sp-label">Phone number</label>
                <div className="sp-phone-row">
                  <input
                    className="sp-input sp-input-cc"
                    value={form.country_code}
                    onChange={(e) => setForm({ ...form, country_code: e.target.value })}
                    inputMode="tel"
                    aria-label="Country code"
                  />
                  <input
                    className="sp-input"
                    placeholder="021 234 5678"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    inputMode="tel"
                    required
                    aria-label="Phone number"
                  />
                </div>
              </div>

              <button className="sp-submit" disabled={loading} type="submit">
                <span className="sp-submit-inner">
                  {loading && <span className="sp-spinner" />}
                  {loading ? "Sending OTP…" : "Continue"}
                </span>
              </button>
            </form>

            <div className="sp-divider" />
            <p className="sp-legal">By continuing, you agree to Gumboot&apos;s Terms of Service and Privacy Policy.</p>
            <p className="sp-login-row">
              Already have an account?{" "}
              <Link href="/auth/login" className="sp-login-link">Sign in</Link>
            </p>
          </section>

        </div>
      </div>
    </>
  );
}
