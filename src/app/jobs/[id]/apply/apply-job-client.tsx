"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ApiError } from "@/lib/api";
import { applyToJob } from "@/lib/applications";
import { useMe } from "@/lib/useMe";

type MeUser = {
  _id?: string;
  firstname?: string;
  lastname?: string;
  verified_user?: string | number;
};

const styles = `
  .apply-root * { box-sizing: border-box; }
  .apply-root {
    min-height: calc(100vh - 56px);
    padding: 28px 16px 72px;
    background:
      radial-gradient(880px 520px at 10% 0%, rgba(91,110,127,0.18), rgba(0,0,0,0) 58%),
      linear-gradient(180deg, #2A3439, #20282c);
    color: #E5E5E5;
    font-family: 'DM Sans', sans-serif;
  }
  .apply-shell {
    max-width: 760px;
    margin: 0 auto;
  }
  .apply-card {
    border: 1px solid rgba(229,229,229,0.10);
    border-radius: 18px;
    background: rgba(62,74,81,0.82);
    box-shadow: 0 18px 50px rgba(0,0,0,0.28);
    backdrop-filter: blur(10px);
    padding: 24px;
  }
  .apply-back {
    display: inline-flex;
    margin-bottom: 14px;
    color: rgba(229,229,229,0.66);
    text-decoration: none;
    font-size: 11px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }
  .apply-kicker {
    margin: 0 0 8px;
    font-size: 10px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: rgba(229,229,229,0.40);
  }
  .apply-title {
    margin: 0;
    font-family: 'DM Serif Display', serif;
    font-size: 34px;
    line-height: 1.05;
    font-weight: 400;
  }
  .apply-sub {
    margin: 10px 0 0;
    color: rgba(229,229,229,0.62);
    line-height: 1.7;
    font-size: 14px;
  }
  .apply-grid {
    display: grid;
    gap: 14px;
    margin-top: 22px;
  }
  .apply-field {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .apply-label {
    font-size: 10px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(229,229,229,0.40);
  }
  .apply-input, .apply-textarea {
    width: 100%;
    border-radius: 12px;
    border: 1px solid rgba(229,229,229,0.12);
    background: #2A3439;
    color: #E5E5E5;
    padding: 12px 13px;
    font: inherit;
    outline: none;
  }
  .apply-textarea {
    min-height: 160px;
    resize: vertical;
  }
  .apply-error, .apply-success, .apply-note {
    border-radius: 12px;
    padding: 12px 14px;
    font-size: 13px;
    line-height: 1.6;
  }
  .apply-error {
    border: 1px solid rgba(183,91,91,0.38);
    background: rgba(183,91,91,0.14);
    color: rgba(255,220,220,0.92);
  }
  .apply-success {
    border: 1px solid rgba(38,166,154,0.34);
    background: rgba(38,166,154,0.12);
    color: rgba(229,245,242,0.94);
  }
  .apply-note {
    border: 1px solid rgba(229,229,229,0.10);
    background: rgba(229,229,229,0.05);
    color: rgba(229,229,229,0.62);
  }
  .apply-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    margin-top: 16px;
  }
  .apply-btn {
    border: none;
    border-radius: 12px;
    padding: 12px 15px;
    font: inherit;
    font-size: 12px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    cursor: pointer;
  }
  .apply-btn.primary {
    background: #26A69A;
    color: #fff;
    font-weight: 600;
  }
  .apply-btn.secondary {
    background: rgba(229,229,229,0.08);
    color: #E5E5E5;
    border: 1px solid rgba(229,229,229,0.12);
    text-decoration: none;
  }
`;

export default function ApplyJobClient({ jobId }: { jobId: string }) {
  const router = useRouter();
  const { user, loading: meLoading } = useMe();
  const me = (user ?? null) as MeUser | null;

  const [offerAmount, setOfferAmount] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (meLoading) return;
    if (!me?._id) {
      router.replace(`/auth/login?next=${encodeURIComponent(`/jobs/${jobId}/apply`)}`);
      return;
    }
    if (Number(me.verified_user ?? 0) !== 1) {
      router.replace(`/auth/signup/profile-setup?next=${encodeURIComponent(`/jobs/${jobId}/apply`)}`);
    }
  }, [jobId, me?._id, me?.verified_user, meLoading, router]);

  const canSubmit = useMemo(
    () => offerAmount.trim().length > 0 && message.trim().length > 0 && !submitting,
    [message, offerAmount, submitting]
  );

  async function handleSubmit() {
    if (!offerAmount.trim()) {
      setError("Offer amount is required.");
      return;
    }
    if (!message.trim()) {
      setError("A short message is required.");
      return;
    }
    if (Number(me?.verified_user ?? 0) !== 1) {
      router.replace(`/auth/signup/profile-setup?next=${encodeURIComponent(`/jobs/${jobId}/apply`)}`);
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await applyToJob({
        jobid: jobId,
        message: message.trim(),
        offered_price: offerAmount.trim().replace(/[^\d.]/g, ""),
      });
      setSuccess("Application sent.");
      setTimeout(() => {
        router.push(`/jobs/${jobId}?applied=1`);
      }, 700);
    } catch (nextError) {
      if (nextError instanceof ApiError && (nextError.status === 401 || nextError.status === 403)) {
        router.replace(`/auth/login?next=${encodeURIComponent(`/jobs/${jobId}/apply`)}`);
        return;
      }
      setError(nextError instanceof Error ? nextError.message : "Failed to send application.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <style>{styles}</style>
      <div className="apply-root">
        <div className="apply-shell">
          <Link className="apply-back" href={`/jobs/${jobId}`}>
            ‹ Back to job
          </Link>

          <section className="apply-card">
            <p className="apply-kicker">Application</p>
            <h1 className="apply-title">Send your offer</h1>
            <p className="apply-sub">
              Share your offer amount and a short note for the job poster. Re-applying may not overwrite an existing offer, so send your best version.
            </p>

            <div className="apply-grid">
              <label className="apply-field">
                <span className="apply-label">Offer amount</span>
                <input
                  className="apply-input"
                  inputMode="decimal"
                  placeholder="180"
                  value={offerAmount}
                  onChange={(e) => setOfferAmount(e.target.value.replace(/[^\d.]/g, ""))}
                />
              </label>

              <label className="apply-field">
                <span className="apply-label">Message</span>
                <textarea
                  className="apply-textarea"
                  placeholder="I can do this tomorrow morning."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </label>

              <div className="apply-note">
                Your offer sends `jobid`, `message`, and `offered_price` to the backend exactly as the mobile app flow expects.
              </div>

              {error ? <div className="apply-error">{error}</div> : null}
              {success ? <div className="apply-success">{success}</div> : null}
            </div>

            <div className="apply-actions">
              <button className="apply-btn primary" type="button" disabled={!canSubmit} onClick={handleSubmit}>
                {submitting ? "Sending..." : "Send offer"}
              </button>
              <Link className="apply-btn secondary" href={`/jobs/${jobId}`}>
                Cancel
              </Link>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
