"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { sendSupportMessage } from "@/lib/messages";
import { useMe } from "@/lib/useMe";

type MeUser = {
  _id?: string;
  firstname?: string;
  lastname?: string;
  email?: string;
  phone?: string | number;
};

type SupportFormState = {
  name: string;
  mobile_number: string;
  email: string;
  message: string;
};

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');

  .sp-root * { box-sizing: border-box; }
  .sp-root {
    min-height: calc(100dvh - 112px);
    padding: 32px 16px 48px;
    background:
      radial-gradient(900px 480px at 12% 0%, rgba(91,110,127,0.18), transparent 60%),
      linear-gradient(180deg, #2A3439 0%, #243036 100%);
    color: #E5E5E5;
    font-family: 'DM Sans', sans-serif;
  }
  .sp-shell {
    max-width: 820px;
    margin: 0 auto;
  }
  .sp-card {
    border: 1px solid rgba(229,229,229,0.10);
    border-radius: 22px;
    background: rgba(62,74,81,0.82);
    box-shadow: 0 18px 50px rgba(0,0,0,0.28);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    overflow: hidden;
  }
  .sp-header {
    padding: 24px 24px 18px;
    border-bottom: 1px solid rgba(229,229,229,0.08);
  }
  .sp-kicker {
    margin: 0 0 6px;
    font-size: 10px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: rgba(229,229,229,0.40);
  }
  .sp-title {
    margin: 0;
    font-family: 'DM Serif Display', serif;
    font-size: 32px;
    line-height: 1.05;
    font-weight: 400;
  }
  .sp-subtitle {
    margin: 10px 0 0;
    max-width: 620px;
    font-size: 13px;
    line-height: 1.7;
    color: rgba(229,229,229,0.56);
  }
  .sp-body {
    padding: 22px 24px 24px;
  }
  .sp-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;
  }
  @media (min-width: 720px) {
    .sp-grid.two {
      grid-template-columns: 1fr 1fr;
    }
  }
  .sp-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .sp-label {
    font-size: 10px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgba(229,229,229,0.38);
  }
  .sp-input,
  .sp-textarea {
    border-radius: 12px;
    border: 1px solid rgba(229,229,229,0.12);
    background: rgba(30,40,46,0.70);
    color: #E5E5E5;
    padding: 10px 12px;
    font: inherit;
    font-size: 14px;
    outline: none;
    transition: border-color 0.16s, box-shadow 0.16s;
  }
  .sp-input:focus,
  .sp-textarea:focus {
    border-color: rgba(38,166,154,0.50);
    box-shadow: 0 0 0 3px rgba(38,166,154,0.10);
  }
  .sp-textarea {
    min-height: 150px;
    resize: vertical;
  }
  .sp-status {
    margin-bottom: 14px;
    border-radius: 10px;
    padding: 9px 12px;
    font-size: 12px;
    line-height: 1.5;
  }
  .sp-status.error {
    border: 1px solid rgba(183,91,91,0.35);
    background: rgba(183,91,91,0.12);
    color: rgba(255,214,214,0.92);
  }
  .sp-status.success {
    border: 1px solid rgba(38,166,154,0.24);
    background: rgba(38,166,154,0.10);
    color: rgba(220,255,246,0.92);
  }
  .sp-actions {
    margin-top: 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }
  .sp-note {
    font-size: 12px;
    color: rgba(229,229,229,0.42);
  }
  .sp-submit {
    border: none;
    border-radius: 12px;
    padding: 11px 18px;
    font: inherit;
    font-size: 11px;
    letter-spacing: 0.10em;
    text-transform: uppercase;
    background: linear-gradient(135deg, #26A69A 0%, #1d7a72 100%);
    color: #fff;
    font-weight: 700;
    cursor: pointer;
    min-width: 140px;
  }
  .sp-submit:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
  .sp-auth {
    max-width: 600px;
    margin: 40px auto 0;
    border: 1px solid rgba(229,229,229,0.10);
    border-radius: 18px;
    background: rgba(62,74,81,0.82);
    padding: 28px;
    text-align: center;
  }
  .sp-auth-copy {
    margin: 10px 0 18px;
    color: rgba(229,229,229,0.62);
    font-size: 14px;
    line-height: 1.7;
  }
  .sp-auth-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 130px;
    padding: 11px 18px;
    border-radius: 12px;
    text-decoration: none;
    color: #fff;
    background: #26A69A;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
`;

function readUser(user: unknown): MeUser {
  if (!user || typeof user !== "object") return {};
  return user as MeUser;
}

export default function SupportPage() {
  const { user, loading } = useMe();
  const me = useMemo(() => readUser(user), [user]);
  const loggedInUserId = me._id ?? "";

  const [form, setForm] = useState<SupportFormState>({
    name: "",
    mobile_number: "",
    email: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm((current) => ({
      ...current,
      name: `${me.firstname ?? ""} ${me.lastname ?? ""}`.trim(),
      mobile_number: me.phone ? String(me.phone) : "",
      email: me.email ?? "",
    }));
  }, [me.email, me.firstname, me.lastname, me.phone]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!loggedInUserId) return;
      setSubmitting(true);
      setSuccess(null);
      setError(null);
      try {
        await sendSupportMessage({
          userId: loggedInUserId,
          name: form.name.trim(),
          mobile_number: form.mobile_number.trim(),
          email: form.email.trim(),
          message: form.message.trim(),
        });
        setSuccess("Support message sent.");
        setForm((current) => ({ ...current, message: "" }));
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : "Unable to send support message");
      } finally {
        setSubmitting(false);
      }
    },
    [form, loggedInUserId]
  );

  if (loading) {
    return (
      <>
        <style>{styles}</style>
        <div className="sp-root">
          <div className="sp-auth">
            <p className="sp-kicker">Support</p>
            <h1 className="sp-title">Loading your account</h1>
            <p className="sp-auth-copy">Checking your session before opening support.</p>
          </div>
        </div>
      </>
    );
  }

  if (!loggedInUserId) {
    return (
      <>
        <style>{styles}</style>
        <div className="sp-root">
          <div className="sp-auth">
            <p className="sp-kicker">Support</p>
            <h1 className="sp-title">Sign in to contact support</h1>
            <p className="sp-auth-copy">Support messages use the authenticated Gumboot support endpoint.</p>
            <Link className="sp-auth-link" href="/auth/login?next=/support">
              Sign In
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className="sp-root">
        <div className="sp-shell">
          <section className="sp-card">
            <div className="sp-header">
              <p className="sp-kicker">Support</p>
              <h1 className="sp-title">Contact Gumboot support</h1>
              <p className="sp-subtitle">
                Send a support request through the same authenticated API used elsewhere in the app. Messages will go to the backend support inbox, not the chat socket.
              </p>
            </div>
            <div className="sp-body">
              {error ? <div className="sp-status error">{error}</div> : null}
              {success ? <div className="sp-status success">{success}</div> : null}

              <form onSubmit={handleSubmit}>
                <div className="sp-grid two">
                  <label className="sp-field">
                    <span className="sp-label">Name</span>
                    <input
                      className="sp-input"
                      required
                      value={form.name}
                      onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    />
                  </label>
                  <label className="sp-field">
                    <span className="sp-label">Mobile</span>
                    <input
                      className="sp-input"
                      required
                      value={form.mobile_number}
                      onChange={(event) => setForm((current) => ({ ...current, mobile_number: event.target.value }))}
                    />
                  </label>
                </div>
                <div className="sp-grid" style={{ marginTop: 12 }}>
                  <label className="sp-field">
                    <span className="sp-label">Email</span>
                    <input
                      className="sp-input"
                      type="email"
                      required
                      value={form.email}
                      onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                    />
                  </label>
                  <label className="sp-field">
                    <span className="sp-label">Message</span>
                    <textarea
                      className="sp-textarea"
                      required
                      value={form.message}
                      onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
                    />
                  </label>
                </div>
                <div className="sp-actions">
                  <div className="sp-note">We’ll use your signed-in session when submitting this request.</div>
                  <button className="sp-submit" disabled={submitting || !form.message.trim()} type="submit">
                    {submitting ? "Sending..." : "Send Message"}
                  </button>
                </div>
              </form>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
