"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ApiError } from "@/lib/api";
import { hasCompletedIdentityVerification } from "@/lib/accountStatus";
import { applyToJob } from "@/lib/applications";
import { me as fetchMe } from "@/lib/auth";
import { useMe } from "@/lib/useMe";

type MeUser = {
  _id?: string;
  firstname?: string;
  lastname?: string;
  verified_user?: string | number;
  idproof?: string;
  selfie?: string;
};

type ApplyDraft = {
  offerAmount: string;
  message: string;
  awaitingVerification?: boolean;
};

function normalizeMeUser(payload: unknown) {
  if (!payload || typeof payload !== "object") return null;
  const root = payload as {
    body?: {
      profiledata?: unknown;
      userDetail?: unknown;
    };
  };
  return root.body?.profiledata ?? root.body?.userDetail ?? root.body ?? null;
}

function getApplyDraftStorageKey(jobId: string) {
  return `gumboot:apply-draft:${jobId}`;
}

function readApplyDraft(jobId: string): ApplyDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(getApplyDraftStorageKey(jobId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ApplyDraft;
    if (typeof parsed?.offerAmount !== "string" || typeof parsed?.message !== "string") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeApplyDraft(jobId: string, draft: ApplyDraft) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(getApplyDraftStorageKey(jobId), JSON.stringify(draft));
  } catch {
    // Ignore storage restrictions in private browsing modes.
  }
}

function clearApplyDraft(jobId: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(getApplyDraftStorageKey(jobId));
  } catch {
    // Ignore storage restrictions in private browsing modes.
  }
}

async function waitForVerifiedDocuments() {
  for (let attempt = 0; attempt < 24; attempt += 1) {
    const latestMe = normalizeMeUser(await fetchMe());
    if (hasCompletedIdentityVerification(latestMe as MeUser | null)) {
      return true;
    }
    await new Promise((resolve) => window.setTimeout(resolve, 1000));
  }
  return false;
}

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
  .apply-syncing {
    display: grid;
    justify-items: center;
    gap: 12px;
    text-align: center;
    border: 1px solid rgba(38,166,154,0.28);
    background: rgba(38,166,154,0.10);
    color: rgba(229,245,242,0.94);
  }
  .apply-syncing-logo {
    width: 52px;
    height: 52px;
    display: block;
    animation: apply-spin 1s linear infinite;
    filter: drop-shadow(0 8px 18px rgba(0,0,0,0.18));
  }
  .apply-syncing-title {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.10em;
    text-transform: uppercase;
  }
  .apply-syncing-copy {
    font-size: 13px;
    line-height: 1.6;
    max-width: 420px;
  }
  .apply-note {
    border: 1px solid rgba(229,229,229,0.10);
    background: rgba(229,229,229,0.05);
    color: rgba(229,229,229,0.62);
  }
  .apply-warning {
    border: 1px solid rgba(251,191,36,0.34);
    background: rgba(251,191,36,0.12);
    color: rgba(255,244,214,0.95);
  }
  .apply-warning-link {
    color: #fff2c7;
    font-weight: 600;
    text-decoration: underline;
    text-underline-offset: 2px;
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
  @keyframes apply-spin {
    to { transform: rotate(360deg); }
  }
`;

export default function ApplyJobClient({ jobId }: { jobId: string }) {
  const router = useRouter();
  const { user, loading: meLoading, refresh } = useMe();
  const me = (user ?? null) as MeUser | null;

  const [offerAmount, setOfferAmount] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [syncingDocuments, setSyncingDocuments] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const submitLockRef = useRef(false);
  const restoredDraftRef = useRef(false);
  const autoResumeStartedRef = useRef(false);
  const profileSetupHref = `/auth/signup/profile-setup?mode=settings&next=${encodeURIComponent(`/jobs/${jobId}/apply`)}`;
  const canOffer = hasCompletedIdentityVerification(me);

  useEffect(() => {
    if (meLoading) return;
    if (!me?._id) {
      router.replace(`/auth/login?next=${encodeURIComponent(`/jobs/${jobId}/apply`)}`);
    }
  }, [jobId, me?._id, meLoading, router]);

  useEffect(() => {
    if (restoredDraftRef.current) return;
    restoredDraftRef.current = true;
    const draft = readApplyDraft(jobId);
    if (!draft) return;
    setOfferAmount(draft.offerAmount);
    setMessage(draft.message);
  }, [jobId]);

  useEffect(() => {
    if (!restoredDraftRef.current) return;
    const trimmedOfferAmount = offerAmount.trim();
    const trimmedMessage = message.trim();
    if (!trimmedOfferAmount && !trimmedMessage) {
      clearApplyDraft(jobId);
      return;
    }
    const existingDraft = readApplyDraft(jobId);
    writeApplyDraft(jobId, {
      offerAmount,
      message,
      awaitingVerification: existingDraft?.awaitingVerification === true,
    });
  }, [jobId, message, offerAmount]);

  const canSubmit = useMemo(
    () => offerAmount.trim().length > 0 && message.trim().length > 0 && !submitting && canOffer,
    [canOffer, message, offerAmount, submitting]
  );

  const waitForProfileSync = useCallback(async (draft: ApplyDraft) => {
    const trimmedOfferAmount = draft.offerAmount.trim();
    const trimmedMessage = draft.message.trim();

    submitLockRef.current = true;
    setSubmitting(true);
    setSyncingDocuments(true);
    setError(null);
    setSuccess(null);
    writeApplyDraft(jobId, {
      offerAmount: trimmedOfferAmount,
      message: trimmedMessage,
      awaitingVerification: true,
    });

    try {
      const verified = await waitForVerifiedDocuments();
      await refresh();
      if (!verified) {
        setError("Your documents are still finishing upload. We saved your offer while your profile catches up.");
        return false;
      }

      writeApplyDraft(jobId, {
        offerAmount: trimmedOfferAmount,
        message: trimmedMessage,
        awaitingVerification: false,
      });
      setSuccess("Documents ready. You can send your offer now.");
      return true;
    } finally {
      setSyncingDocuments(false);
      submitLockRef.current = false;
      setSubmitting(false);
    }
  }, [jobId, refresh]);

  const submitOfferDraft = useCallback(async (draft: ApplyDraft) => {
    if (submitLockRef.current) return;
    const trimmedOfferAmount = draft.offerAmount.trim();
    const trimmedMessage = draft.message.trim();

    if (!trimmedOfferAmount) {
      setError("Offer amount is required.");
      return;
    }
    if (!trimmedMessage) {
      setError("A short message is required.");
      return;
    }

    submitLockRef.current = true;
    setSubmitting(true);
    setSyncingDocuments(false);
    setError(null);
    setSuccess(null);
    writeApplyDraft(jobId, draft);
    try {
      const latestMe = normalizeMeUser(await fetchMe());
      if (!hasCompletedIdentityVerification(latestMe as MeUser | null)) {
        await waitForProfileSync({
          offerAmount: trimmedOfferAmount,
          message: trimmedMessage,
          awaitingVerification: true,
        });
        return;
      }

      await applyToJob({
        jobid: jobId,
        message: trimmedMessage,
        offered_price: trimmedOfferAmount.replace(/[^\d.]/g, ""),
      });
      clearApplyDraft(jobId);
      setSuccess("Application sent.");
      setTimeout(() => {
        router.push(`/jobs/${jobId}?applied=1`);
      }, 700);
    } catch (nextError) {
      if (nextError instanceof ApiError && (nextError.status === 401 || nextError.status === 403)) {
        router.replace(`/auth/login?next=${encodeURIComponent(`/jobs/${jobId}/apply`)}`);
        return;
      }
      const message = nextError instanceof Error ? nextError.message : "Failed to send application.";
      if (/already applied/i.test(message)) {
        clearApplyDraft(jobId);
        setSuccess("Application already sent.");
        setTimeout(() => {
          router.push(`/jobs/${jobId}?applied=1`);
        }, 300);
        return;
      }
      setError(message);
    } finally {
      setSyncingDocuments(false);
      submitLockRef.current = false;
      setSubmitting(false);
    }
  }, [jobId, router, waitForProfileSync]);

  async function handleSubmit() {
    if (!canOffer) {
      writeApplyDraft(jobId, {
        offerAmount,
        message,
        awaitingVerification: true,
      });
      setError("Upload your license/ID proof and selfie before sending an offer.");
      return;
    }

    await submitOfferDraft({
      offerAmount,
      message,
      awaitingVerification: false,
    });
  }

  useEffect(() => {
    if (meLoading || !me?._id || autoResumeStartedRef.current) return;
    const draft = readApplyDraft(jobId);
    if (!draft?.awaitingVerification) return;
    if (!draft.offerAmount.trim() || !draft.message.trim()) return;

    autoResumeStartedRef.current = true;
    setOfferAmount(draft.offerAmount);
    setMessage(draft.message);
    void waitForProfileSync(draft);
  }, [jobId, me?._id, meLoading, waitForProfileSync]);

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
              {me?._id && !canOffer ? (
                <div className="apply-error apply-warning">
                  You can still sign in to Gumboot, but you must upload your license/ID proof and selfie before you can send an offer on jobs.{" "}
                  <Link className="apply-warning-link" href={profileSetupHref}>
                    Click here
                  </Link>
                  {" "}to go straight there.
                </div>
              ) : null}

              <label className="apply-field">
                <span className="apply-label">Offer amount</span>
                <input
                  className="apply-input"
                  inputMode="decimal"
                  placeholder="180"
                  value={offerAmount}
                  onChange={(e) => setOfferAmount(e.target.value.replace(/[^\d.]/g, ""))}
                  data-testid="apply-offer-amount"
                />
              </label>

              <label className="apply-field">
                <span className="apply-label">Message</span>
                <textarea
                  className="apply-textarea"
                  placeholder="I can do this tomorrow morning."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  data-testid="apply-message"
                />
              </label>

              {error ? <div className="apply-error">{error}</div> : null}
              {success ? <div className="apply-success">{success}</div> : null}
              {syncingDocuments ? (
                <div className="apply-success apply-syncing">
                  <img className="apply-syncing-logo" src="/logo.png" alt="Gumboot loading" />
                  <div className="apply-syncing-title">Uploading Documents</div>
                  <div className="apply-syncing-copy">
                    We&apos;re waiting for your selfie and ID upload to finish syncing. Your offer will send automatically as soon as your profile is ready.
                  </div>
                </div>
              ) : null}
            </div>

            <div className="apply-actions">
              {canOffer ? (
                <button className="apply-btn primary" type="button" disabled={!canSubmit} onClick={handleSubmit} data-testid="apply-send-offer">
                  {syncingDocuments ? "Uploading documents…" : submitting ? "Sending..." : "Send offer"}
                </button>
              ) : null}
              {me?._id && !canOffer ? (
                <Link
                  className="apply-btn secondary"
                  href={profileSetupHref}
                  onClick={() =>
                    writeApplyDraft(jobId, {
                      offerAmount,
                      message,
                      awaitingVerification: true,
                    })
                  }
                >
                  Upload documents
                </Link>
              ) : null}
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
