"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { sendLoginOtp } from "@/lib/auth";
import { setAuthToken } from "@/lib/api";
import { isClientE2ETestModeEnabled } from "@/lib/e2eTestMode";
import { normalizeCountryCode, normalizePhoneNumber } from "@/lib/otp";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');

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
      radial-gradient(ellipse at 20% 10%, rgba(91,110,127,0.16) 0%, transparent 55%),
      radial-gradient(ellipse at 80% 90%, rgba(38,166,154,0.07) 0%, transparent 50%);
  }

  .lp-grid {
    width: 100%;
    max-width: 940px;
    display: grid;
    gap: 16px;
    grid-template-columns: 1fr;
  }
  @media (min-width: 860px) {
    .lp-grid { grid-template-columns: 1.15fr 1fr; align-items: start; }
  }

  .lp-hero {
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
  .lp-hero::before, .lp-hero::after {
    content: '';
    position: absolute;
    border-radius: 50%;
    pointer-events: none;
  }
  .lp-hero::before {
    width: 320px;
    height: 320px;
    top: -100px;
    right: -100px;
    border: 1px solid rgba(229,229,229,0.05);
  }
  .lp-hero::after {
    width: 190px;
    height: 190px;
    top: -50px;
    right: -50px;
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

  .lp-hero-top {
    position: relative;
    z-index: 1;
  }

  .lp-pill-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 18px;
  }
  .lp-pill {
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
  .lp-pill::before {
    content: '';
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #26A69A;
    box-shadow: 0 0 0 4px rgba(38,166,154,0.12);
    flex-shrink: 0;
  }

  .lp-hero-title {
    font-family: 'DM Serif Display', serif;
    font-size: 38px;
    font-weight: 400;
    line-height: 1.08;
    letter-spacing: -0.02em;
    color: #F4F0EA;
    max-width: 520px;
    margin-bottom: 18px;
  }

  .lp-tagline {
    font-size: 15px;
    color: rgba(229,229,229,0.66);
    line-height: 1.8;
    font-weight: 400;
    max-width: 500px;
    margin-bottom: 28px;
  }

  .lp-hero-note {
    max-width: 460px;
    border-left: 2px solid rgba(38,166,154,0.55);
    padding-left: 16px;
    color: rgba(229,229,229,0.56);
    font-size: 13px;
    line-height: 1.7;
  }

  .lp-bottom-panel {
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
  .lp-bottom-panel::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at top left, rgba(38,166,154,0.08), transparent 34%),
      radial-gradient(circle at bottom right, rgba(91,110,127,0.1), transparent 38%);
    pointer-events: none;
  }
  .lp-bottom-head {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 18px;
  }
  .lp-bottom-title {
    font-family: 'DM Serif Display', serif;
    font-size: 24px;
    font-weight: 400;
    line-height: 1.15;
    color: #F4F0EA;
  }
  .lp-bottom-sub {
    max-width: 420px;
    font-size: 13px;
    line-height: 1.7;
    color: rgba(229,229,229,0.58);
    text-align: right;
  }

  .lp-stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    position: relative;
    z-index: 1;
  }
  .lp-stat {
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
  .lp-stat-index {
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
  .lp-stat-copy {
    min-width: 0;
  }
  .lp-stat-label {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(229,229,229,0.48);
    margin-bottom: 6px;
  }
  .lp-stat-value {
    font-size: 14px;
    line-height: 1.65;
    color: rgba(244,240,234,0.94);
    font-weight: 400;
  }

  .lp-form-panel {
    border: 1px solid rgba(229,229,229,0.08);
    border-radius: 20px;
    background: #3E4A51;
    padding: 36px;
    display: flex;
    flex-direction: column;
  }

  .lp-form-title {
    font-family: 'DM Serif Display', serif;
    font-size: 28px;
    font-weight: 400;
    color: #E5E5E5;
    margin-bottom: 6px;
    line-height: 1.15;
  }
  .lp-form-sub {
    font-size: 13px;
    color: rgba(229,229,229,0.45);
    line-height: 1.6;
    font-weight: 300;
    margin-bottom: 24px;
  }

  .lp-error {
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

  .lp-label {
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.13em;
    text-transform: uppercase;
    color: rgba(229,229,229,0.35);
    margin-bottom: 6px;
    display: block;
  }
  .lp-input {
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
  .lp-input::placeholder { color: rgba(229,229,229,0.22); }
  .lp-input:focus {
    border-color: #5B6E7F;
    box-shadow: 0 0 0 3px rgba(91,110,127,0.15);
  }
  .lp-input-cc {
    width: 72px;
    flex-shrink: 0;
    text-align: center;
    letter-spacing: 0.04em;
  }
  .lp-phone-row {
    display: flex;
    gap: 8px;
    margin-bottom: 8px;
  }

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
    margin-top: 6px;
    transition: background 0.16s, box-shadow 0.16s, transform 0.10s;
    box-shadow: 0 4px 16px rgba(38,166,154,0.25);
  }
  .lp-submit:hover:not(:disabled) {
    background: #1E8A80;
    box-shadow: 0 4px 20px rgba(38,166,154,0.35);
  }
  .lp-submit:active:not(:disabled) { transform: scale(0.99); }
  .lp-submit:disabled { opacity: 0.40; cursor: not-allowed; box-shadow: none; }

  .lp-submit-inner { display: flex; align-items: center; justify-content: center; gap: 8px; }
  @keyframes lp-spin { to { transform: rotate(360deg); } }
  .lp-spinner {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255,255,255,0.20);
    border-top-color: #ffffff;
    border-radius: 50%;
    animation: lp-spin 0.7s linear infinite;
    flex-shrink: 0;
  }

  .lp-divider { height: 1px; background: rgba(229,229,229,0.08); margin: 22px 0; }
  .lp-legal { font-size: 11px; color: rgba(229,229,229,0.25); line-height: 1.65; margin-bottom: 12px; }
  .lp-legal-link {
    color: rgba(229,229,229,0.72);
    text-decoration: none;
    border-bottom: 1px solid rgba(229,229,229,0.18);
    transition: color 0.14s, border-color 0.14s;
  }
  .lp-legal-link:hover {
    color: #E5E5E5;
    border-color: rgba(229,229,229,0.42);
  }
  .lp-signup-row {
    margin-top: 14px;
    padding: 14px 16px;
    border-radius: 14px;
    border: 1px solid rgba(38,166,154,0.22);
    background: rgba(38,166,154,0.10);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    flex-wrap: wrap;
    font-size: 13px;
    color: rgba(229,229,229,0.82);
  }
  .lp-signup-copy {
    font-weight: 600;
    letter-spacing: 0.01em;
  }
  .lp-signup-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 42px;
    padding: 0 16px;
    border-radius: 999px;
    background: #26A69A;
    color: #ffffff;
    font-weight: 700;
    text-decoration: none;
    box-shadow: 0 4px 16px rgba(38,166,154,0.25);
    transition: background 0.14s, transform 0.10s, box-shadow 0.14s;
  }
  .lp-signup-link:hover {
    background: #1E8A80;
    box-shadow: 0 4px 20px rgba(38,166,154,0.35);
  }
  .lp-signup-link:active { transform: scale(0.99); }

  @media (max-width: 640px) {
    .lp-root {
      align-items: flex-start;
      padding: 20px 14px 40px;
    }
    .lp-grid {
      gap: 14px;
    }
    .lp-hero,
    .lp-form-panel {
      border-radius: 18px;
    }
    .lp-hero {
      min-height: unset;
      padding: 28px 22px 24px;
    }
    .lp-logo {
      font-size: 34px;
      margin-bottom: 14px;
    }
    .lp-hero-title {
      font-size: 30px;
      margin-bottom: 14px;
    }
    .lp-tagline {
      max-width: none;
      font-size: 14px;
      line-height: 1.7;
      margin-bottom: 20px;
    }
    .lp-hero-note {
      max-width: none;
      font-size: 12px;
      line-height: 1.65;
    }
    .lp-stats {
      grid-template-columns: 1fr;
    }
    .lp-bottom-panel {
      padding: 22px 20px;
      border-radius: 18px;
    }
    .lp-bottom-head {
      align-items: start;
      justify-content: flex-start;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 16px;
    }
    .lp-bottom-title {
      font-size: 21px;
    }
    .lp-bottom-sub {
      max-width: none;
      text-align: left;
      font-size: 12px;
      line-height: 1.65;
    }
    .lp-stat {
      grid-template-columns: 38px minmax(0, 1fr);
      gap: 12px;
      padding: 14px;
    }
    .lp-stat-index {
      width: 38px;
      height: 38px;
      border-radius: 10px;
    }
    .lp-form-panel {
      padding: 24px 20px;
    }
    .lp-form-title {
      font-size: 24px;
    }
    .lp-form-sub {
      margin-bottom: 20px;
    }
    .lp-phone-row {
      display: grid;
      grid-template-columns: 84px minmax(0, 1fr);
    }
    .lp-submit {
      min-height: 50px;
      font-size: 12px;
    }
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
      const normalizedCountryCode = normalizeCountryCode(countryCode);
      const normalizedPhone = normalizePhoneNumber(phone);
      if (!normalizedCountryCode || !normalizedPhone) {
        throw new Error("Enter a valid country code and mobile number.");
      }
      if (isClientE2ETestModeEnabled()) {
        const testResponse = await fetch("/api/test-login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phone: normalizedPhone,
            country_code: normalizedCountryCode,
          }),
          cache: "no-store",
        });

        if (testResponse.ok) {
          const testPayload = (await testResponse.json()) as {
            body?: {
              token?: string;
            };
          };
          const token = testPayload.body?.token ?? "";
          if (token) {
            setAuthToken(token);
            router.push(nextPath || "/");
            return;
          }
        }
      }
      const res = await sendLoginOtp({
        country_code: normalizedCountryCode,
        phone: normalizedPhone,
      });
      const serviceSid =
        res?.body?.serviceSid ??
        res?.body?.service_sid ??
        process.env.NEXT_PUBLIC_TWILIO_VERIFY_SERVICE_SID;
      const serviceSidQuery = serviceSid
        ? `&service_sid=${encodeURIComponent(serviceSid)}`
        : "";
      const nextQuery = nextPath ? `&next=${encodeURIComponent(nextPath)}` : "";
      router.push(
        `/auth/verify-otp?phone=${encodeURIComponent(normalizedPhone)}&country_code=${encodeURIComponent(normalizedCountryCode)}${serviceSidQuery}${nextQuery}`
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

          <section className="lp-hero">
            <div className="lp-hero-top">
              <p className="lp-eyebrow">Welcome back</p>
              <h1 className="lp-logo">Gumboot<span className="lp-logo-dot">.</span></h1>
              <div className="lp-pill-row">
                <span className="lp-pill">Built for New Zealand</span>
                <span className="lp-pill">Secure sign in</span>
              </div>
              <h2 className="lp-hero-title">Pick up where you left off.</h2>
              <p className="lp-tagline">
                Sign in to check jobs, messages, payouts, and your profile without any extra fuss.
              </p>
              <p className="lp-hero-note">
                Gumboot keeps sign in straightforward: one phone number, one code, and back to the work that matters.
              </p>
            </div>
          </section>

          <section className="lp-form-panel">
            <h2 className="lp-form-title">Sign in</h2>
            <p className="lp-form-sub">Enter your phone number and we&apos;ll send a one-time code.</p>

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
                  onChange={(e) => setCountryCode(normalizeCountryCode(e.target.value))}
                  inputMode="tel"
                  aria-label="Country code"
                  data-testid="login-country-code"
                />
                <input
                  className="lp-input"
                  placeholder="021 234 5678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  inputMode="tel"
                  required
                  aria-label="Phone number"
                  data-testid="login-phone-number"
                />
              </div>

              <button className="lp-submit" disabled={loading} type="submit" data-testid="login-send-code">
                <span className="lp-submit-inner">
                  {loading && <span className="lp-spinner" />}
                  {loading ? "Sending code…" : "Send code"}
                </span>
              </button>
            </form>

            <div className="lp-divider" />

            <p className="lp-legal">
              By continuing, you agree to Gumboot&apos;s{" "}
              <Link href="/terms" className="lp-legal-link">Terms of Service</Link> and{" "}
              <Link href="/privacy" className="lp-legal-link">Privacy Policy</Link>.
            </p>
            <div className="lp-signup-row">
              <span className="lp-signup-copy">New to Gumboot?</span>
              <Link
                href={nextPath ? `/auth/signup?next=${encodeURIComponent(nextPath)}` : "/auth/signup"}
                className="lp-signup-link"
              >
                Create an account
              </Link>
            </div>
          </section>

          <section className="lp-bottom-panel">
            <div className="lp-bottom-head">
              <h3 className="lp-bottom-title">A more grounded way to come back.</h3>
              <p className="lp-bottom-sub">
                Clear access, local focus, and a sign-in flow that keeps things moving.
              </p>
            </div>
            <div className="lp-stats">
              <div className="lp-stat">
                <div className="lp-stat-index">01</div>
                <div className="lp-stat-copy">
                  <p className="lp-stat-label">Straight up</p>
                  <p className="lp-stat-value">No inflated numbers. Just a practical way to sign in and get back to your jobs.</p>
                </div>
              </div>
              <div className="lp-stat">
                <div className="lp-stat-index">02</div>
                <div className="lp-stat-copy">
                  <p className="lp-stat-label">Local first</p>
                  <p className="lp-stat-value">Built for everyday work, local people, and small businesses lending a hand.</p>
                </div>
              </div>
              <div className="lp-stat">
                <div className="lp-stat-index">03</div>
                <div className="lp-stat-copy">
                  <p className="lp-stat-label">No fuss</p>
                  <p className="lp-stat-value">Use your phone number, get a one-time code, and carry on.</p>
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>
    </>
  );
}
