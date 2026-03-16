"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { sendLoginOtp } from "@/lib/auth";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');

  /*
    PALETTE
    --bg-primary   #2A3439   Gunmetal Grey
    --bg-secondary #3E4A51   Charcoal Grey
    --accent       #5B6E7F   Slate Blue
    --text         #E5E5E5   Smoky White
    --cta          #26A69A   Vibrant Teal
    --urgent       #B75B5B   Red / Decline
  */

  .lp-root * { box-sizing: border-box; margin: 0; padding: 0; }
  .lp-root {
    min-height: 100dvh;
    background: #2A3439;
    font-family: 'DM Sans', sans-serif;
    color: #E5E5E5;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    background-image:
      radial-gradient(ellipse at 15% 15%, rgba(91,110,127,0.18) 0%, transparent 55%),
      radial-gradient(ellipse at 85% 85%, rgba(38,166,154,0.08) 0%, transparent 50%);
  }

  .lp-grid {
    width: 100%;
    max-width: 920px;
    display: grid;
    gap: 16px;
    grid-template-columns: 1fr;
  }
  @media (min-width: 860px) {
    .lp-grid { grid-template-columns: 1.15fr 1fr; }
  }

  /* ── Hero panel ── */
  .lp-hero {
    border: 1px solid rgba(229,229,229,0.08);
    border-radius: 20px;
    background: #3E4A51;
    padding: 44px 40px 40px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 400px;
    position: relative;
    overflow: hidden;
  }
  /* decorative rings */
  .lp-hero::before,
  .lp-hero::after {
    content: '';
    position: absolute;
    border-radius: 50%;
    pointer-events: none;
  }
  .lp-hero::before {
    width: 320px; height: 320px;
    top: -100px; right: -100px;
    border: 1px solid rgba(229,229,229,0.05);
  }
  .lp-hero::after {
    width: 200px; height: 200px;
    top: -50px; right: -50px;
    border: 1px solid rgba(229,229,229,0.04);
  }

  .lp-eyebrow {
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
  .lp-eyebrow::before {
    content: '';
    display: block;
    width: 22px;
    height: 1px;
    background: rgba(229,229,229,0.28);
    flex-shrink: 0;
  }

  .lp-logo {
    font-family: 'DM Serif Display', serif;
    font-size: 42px;
    font-weight: 400;
    color: #E5E5E5;
    line-height: 1.05;
    margin-bottom: 18px;
    letter-spacing: -0.01em;
  }
  .lp-logo-dot { color: #26A69A; }

  .lp-tagline {
    font-size: 14px;
    color: rgba(229,229,229,0.52);
    line-height: 1.75;
    font-weight: 300;
    max-width: 320px;
  }

  /* Stats */
  .lp-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin-top: 40px;
  }
  .lp-stat {
    border: 1px solid rgba(229,229,229,0.08);
    border-radius: 10px;
    padding: 16px 14px;
    background: rgba(42,52,57,0.60);
    transition: border-color 0.16s;
  }
  .lp-stat-label {
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.10em;
    text-transform: uppercase;
    color: rgba(229,229,229,0.35);
    margin-bottom: 8px;
  }
  .lp-stat-value {
    font-family: 'DM Serif Display', serif;
    font-size: 24px;
    font-weight: 400;
    color: #E5E5E5;
    line-height: 1;
  }

  /* ── Form panel ── */
  .lp-form-panel {
    border: 1px solid rgba(229,229,229,0.08);
    border-radius: 20px;
    background: #3E4A51;
    padding: 40px 36px;
    display: flex;
    flex-direction: column;
  }

  .lp-form-title {
    font-family: 'DM Serif Display', serif;
    font-size: 30px;
    font-weight: 400;
    color: #E5E5E5;
    margin-bottom: 6px;
    line-height: 1.15;
  }
  .lp-form-sub {
    font-size: 13px;
    color: rgba(229,229,229,0.48);
    line-height: 1.6;
    font-weight: 300;
    margin-bottom: 28px;
  }

  /* Error banner */
  .lp-error {
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
    line-height: 1.4;
  }

  /* Input label */
  .lp-label {
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.13em;
    text-transform: uppercase;
    color: rgba(229,229,229,0.38);
    margin-bottom: 8px;
    display: block;
  }

  /* Phone row */
  .lp-phone-row {
    display: flex;
    gap: 8px;
    margin-bottom: 14px;
  }
  .lp-input {
    width: 100%;
    background: #2A3439;
    border: 1px solid rgba(229,229,229,0.12);
    border-radius: 10px;
    padding: 13px 14px;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    color: #E5E5E5;
    outline: none;
    transition: border-color 0.16s, background 0.16s;
    -webkit-appearance: none;
  }
  .lp-input::placeholder { color: rgba(229,229,229,0.25); }
  .lp-input:focus {
    border-color: #5B6E7F;
    background: #2A3439;
    box-shadow: 0 0 0 3px rgba(91,110,127,0.15);
  }
  .lp-input-cc {
    width: 72px;
    flex-shrink: 0;
    text-align: center;
    letter-spacing: 0.04em;
  }

  /* CTA button */
  .lp-submit {
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
    transition: background 0.16s, transform 0.10s, box-shadow 0.16s;
    box-shadow: 0 4px 16px rgba(38,166,154,0.25);
  }
  .lp-submit:hover:not(:disabled) {
    background: #1E8A80;
    box-shadow: 0 4px 20px rgba(38,166,154,0.35);
  }
  .lp-submit:active:not(:disabled) { transform: scale(0.99); }
  .lp-submit:disabled { opacity: 0.40; cursor: not-allowed; box-shadow: none; }

  /* Spinner */
  .lp-submit-inner {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  @keyframes lp-spin { to { transform: rotate(360deg); } }
  .lp-spinner {
    width: 14px; height: 14px;
    border: 2px solid rgba(255,255,255,0.20);
    border-top-color: #ffffff;
    border-radius: 50%;
    animation: lp-spin 0.7s linear infinite;
    flex-shrink: 0;
  }

  /* Divider */
  .lp-divider {
    height: 1px;
    background: rgba(229,229,229,0.08);
    margin: 24px 0;
  }

  /* Footer */
  .lp-legal {
    font-size: 11px;
    color: rgba(229,229,229,0.25);
    line-height: 1.65;
    margin-bottom: 14px;
  }
  .lp-signup-row {
    font-size: 13px;
    color: rgba(229,229,229,0.50);
  }
  .lp-signup-link {
    color: #26A69A;
    font-weight: 500;
    text-decoration: none;
    border-bottom: 1px solid rgba(38,166,154,0.35);
    padding-bottom: 1px;
    transition: color 0.14s, border-color 0.14s;
  }
  .lp-signup-link:hover {
    color: #2ec4b6;
    border-color: rgba(46,196,182,0.60);
  }
`;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next");
  const [countryCode, setCountryCode] = useState("+64");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const res = await sendLoginOtp({ country_code: countryCode, phone });
      console.log("[login] sendLoginOtp response:", res);
      const serviceSid =
        res?.body?.serviceSid ??
        res?.body?.service_sid ??
        process.env.NEXT_PUBLIC_TWILIO_VERIFY_SERVICE_SID;
      const serviceSidQuery = serviceSid
        ? `&service_sid=${encodeURIComponent(serviceSid)}`
        : "";
      const nextQuery = nextPath ? `&next=${encodeURIComponent(nextPath)}` : "";
      router.push(
        `/auth/verify-otp?phone=${encodeURIComponent(phone)}&country_code=${encodeURIComponent(countryCode)}${serviceSidQuery}${nextQuery}`
      );
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to send OTP";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{styles}</style>
      <div className="lp-root">
        <div className="lp-grid">

          {/* ── Hero ── */}
          <section className="lp-hero">
            <div>
              <p className="lp-eyebrow">Welcome back</p>
              <h1 className="lp-logo">Gumboot<span className="lp-logo-dot">.</span></h1>
              <p className="lp-tagline">
                Sign in to access jobs, messages, payouts, and your profile — all in one place.
              </p>
            </div>

            <div className="lp-stats">
              <div className="lp-stat">
                <p className="lp-stat-label">Taskers</p>
                <p className="lp-stat-value">4.2k+</p>
              </div>
              <div className="lp-stat">
                <p className="lp-stat-label">Jobs posted</p>
                <p className="lp-stat-value">12k+</p>
              </div>
              <div className="lp-stat">
                <p className="lp-stat-label">Verified</p>
                <p className="lp-stat-value">98%</p>
              </div>
            </div>
          </section>

          {/* ── Form ── */}
          <section className="lp-form-panel">
            <h2 className="lp-form-title">Sign in</h2>
            <p className="lp-form-sub">
              Enter your phone number and we&apos;ll send a one-time code.
            </p>

            {error && (
              <div className="lp-error">
                <span>⚠</span>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <label className="lp-label">Phone number</label>
              <div className="lp-phone-row">
                <input
                  className="lp-input lp-input-cc"
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  inputMode="tel"
                  aria-label="Country code"
                />
                <input
                  className="lp-input"
                  placeholder="021 234 5678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  inputMode="tel"
                  required
                  aria-label="Phone number"
                />
              </div>

              <button className="lp-submit" disabled={loading} type="submit">
                <span className="lp-submit-inner">
                  {loading && <span className="lp-spinner" />}
                  {loading ? "Sending code…" : "Send code"}
                </span>
              </button>
            </form>

            <div className="lp-divider" />

            <p className="lp-legal">
              By continuing, you agree to Gumboot&apos;s Terms of Service and Privacy Policy.
            </p>
            <p className="lp-signup-row">
              New to Gumboot?{" "}
              <Link
                href={nextPath ? `/auth/signup?next=${encodeURIComponent(nextPath)}` : "/auth/signup"}
                className="lp-signup-link"
              >
                Create an account
              </Link>
            </p>
          </section>

        </div>
      </div>
    </>
  );
}
