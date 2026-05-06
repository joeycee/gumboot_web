"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ApiError, getStoredAuthToken } from "@/lib/api";
import { StripeSetupCardForm } from "@/components/StripeSetupCardForm";
import { addBankAccount, extractBanksFromResponse, extractCardsFromResponse, getBankAccounts, getSavedCards } from "@/lib/payments";

type PaymentDraft = {
  bankAccountName: string;
  bankAccountNumber: string;
  bankName: string;
};

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');

  .pay-root * { box-sizing: border-box; margin: 0; padding: 0; }
  .pay-root {
    min-height: calc(100vh - 56px);
    background:
      radial-gradient(ellipse at 20% 10%, rgba(91,110,127,0.18) 0%, transparent 55%),
      radial-gradient(ellipse at 80% 90%, rgba(38,166,154,0.08) 0%, transparent 50%),
      #2A3439;
    color: #E5E5E5;
    font-family: 'DM Sans', sans-serif;
    padding: 34px 20px 72px;
  }
  .pay-card {
    width: 100%;
    max-width: 880px;
    margin: 0 auto;
    border: 1px solid rgba(229,229,229,0.08);
    border-radius: 18px;
    background: rgba(62,74,81,0.85);
    padding: 28px;
    box-shadow: 0 18px 50px rgba(0,0,0,0.28);
  }
  .pay-back {
    display: inline-flex;
    margin-bottom: 18px;
    color: rgba(229,229,229,0.60);
    text-decoration: none;
    font-size: 11px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  .pay-eyebrow {
    font-size: 10px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: rgba(229,229,229,0.38);
    margin-bottom: 10px;
  }
  .pay-title {
    font-family: 'DM Serif Display', serif;
    font-size: 34px;
    line-height: 1.1;
    margin-bottom: 8px;
  }
  .pay-sub {
    font-size: 13px;
    color: rgba(229,229,229,0.56);
    margin-bottom: 24px;
    line-height: 1.6;
    max-width: 720px;
  }
  .pay-grid {
    display: grid;
    gap: 18px;
    grid-template-columns: 1fr;
  }
  @media (min-width: 860px) {
    .pay-grid { grid-template-columns: 1fr 1fr; }
  }
  .pay-panel {
    border: 1px solid rgba(229,229,229,0.1);
    border-radius: 12px;
    background: rgba(42,52,57,0.55);
    padding: 14px;
  }
  .pay-panel-title {
    font-size: 11px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: rgba(229,229,229,0.46);
    margin-bottom: 10px;
  }
  .pay-label {
    display: block;
    font-size: 10px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(229,229,229,0.36);
    margin-bottom: 6px;
  }
  .pay-field { margin-bottom: 10px; }
  .pay-input {
    width: 100%;
    background: #2A3439;
    border: 1px solid rgba(229,229,229,0.12);
    border-radius: 10px;
    color: #E5E5E5;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    outline: none;
    padding: 11px 12px;
  }
  .pay-inline {
    display: grid;
    gap: 8px;
    grid-template-columns: 1fr 110px;
  }
  .pay-stripe {
    display: grid;
    gap: 12px;
  }
  .pay-stripe-shell {
    border: 1px solid rgba(229,229,229,0.12);
    border-radius: 12px;
    background: #2A3439;
    padding: 12px;
  }
  .pay-stripe-shell button {
    border: none;
    border-radius: 10px;
    padding: 12px 14px;
    font-family: 'DM Sans', sans-serif;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    cursor: pointer;
    background: #26A69A;
    color: #fff;
    font-weight: 600;
  }
  .pay-error, .pay-success, .pay-note {
    border-radius: 10px;
    padding: 10px 12px;
    font-size: 13px;
    margin-bottom: 12px;
    line-height: 1.6;
  }
  .pay-error {
    border: 1px solid rgba(183,91,91,0.42);
    background: rgba(183,91,91,0.12);
    color: rgba(245,196,196,0.95);
  }
  .pay-success {
    border: 1px solid rgba(38,166,154,0.40);
    background: rgba(38,166,154,0.12);
    color: rgba(229,245,242,0.94);
  }
  .pay-note {
    border: 1px solid rgba(229,229,229,0.10);
    background: rgba(229,229,229,0.05);
    color: rgba(229,229,229,0.65);
  }
  .pay-actions {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    margin-top: 16px;
    flex-wrap: wrap;
  }
  .pay-btn {
    border: none;
    border-radius: 10px;
    padding: 12px 14px;
    font-family: 'DM Sans', sans-serif;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    cursor: pointer;
  }
  .pay-btn-secondary {
    background: rgba(229,229,229,0.1);
    color: #E5E5E5;
  }
  .pay-btn-primary {
    background: #26A69A;
    color: #fff;
    font-weight: 600;
  }
  .pay-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  @media (max-width: 640px) {
    .pay-root {
      padding: 18px 12px 42px;
    }
    .pay-card {
      border-radius: 18px;
      padding: 20px 16px;
    }
    .pay-title {
      font-size: 28px;
    }
    .pay-sub {
      font-size: 13px;
      margin-bottom: 18px;
    }
    .pay-panel {
      padding: 12px;
      border-radius: 16px;
    }
    .pay-inline {
      grid-template-columns: 1fr;
    }
    .pay-actions {
      justify-content: stretch;
    }
    .pay-btn {
      width: 100%;
      min-height: 48px;
    }
  }
`;

function hasBankValues(form: PaymentDraft) {
  return form.bankAccountName.trim() || form.bankAccountNumber.trim() || form.bankName.trim();
}

export default function PaymentSetupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const required = useMemo(() => searchParams.get("required") === "1", [searchParams]);
  const nextPath = useMemo(() => searchParams.get("next"), [searchParams]);
  const isSettingsMode = useMemo(() => searchParams.get("mode") === "settings", [searchParams]);
  const setupMode = useMemo(() => (searchParams.get("setup") === "bank" ? "bank" : "card"), [searchParams]);
  const isBankSetup = setupMode === "bank";
  const [form, setForm] = useState<PaymentDraft>({
    bankAccountName: "",
    bankAccountNumber: "",
    bankName: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [hasSavedCard, setHasSavedCard] = useState(false);
  const [cardLoading, setCardLoading] = useState(true);
  const [hasSavedBank, setHasSavedBank] = useState(false);
  const [bankLoading, setBankLoading] = useState(true);
  const [cardResetKey, setCardResetKey] = useState(0);

  const loginHref = useMemo(() => {
    const returnPath = nextPath
      ? `/auth/signup/payment-setup?setup=${setupMode}&required=${required ? "1" : "0"}&next=${encodeURIComponent(nextPath)}${isSettingsMode ? "&mode=settings" : ""}`
      : `/auth/signup/payment-setup?setup=${setupMode}&required=${required ? "1" : "0"}${isSettingsMode ? "&mode=settings" : ""}`;
    return `/auth/login?next=${encodeURIComponent(returnPath)}`;
  }, [isSettingsMode, nextPath, required, setupMode]);

  useEffect(() => {
    if (!getStoredAuthToken()) {
      router.replace(loginHref);
    }
  }, [loginHref, router]);

  useEffect(() => {
    if (isBankSetup) {
      setCardLoading(false);
      return;
    }

    let mounted = true;

    (async () => {
      try {
        setCardLoading(true);
        const response = await getSavedCards();
        if (!mounted) return;
        setHasSavedCard(extractCardsFromResponse(response).length > 0);
      } catch (nextError) {
        if (!mounted) return;
        if (nextError instanceof ApiError && (nextError.status === 401 || nextError.status === 403)) {
          router.replace(loginHref);
          return;
        }
        setHasSavedCard(false);
      } finally {
        if (mounted) setCardLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [cardResetKey, isBankSetup, loginHref, router]);

  useEffect(() => {
    if (!isBankSetup) {
      setBankLoading(false);
      return;
    }

    let mounted = true;

    (async () => {
      try {
        setBankLoading(true);
        const response = await getBankAccounts();
        if (!mounted) return;
        setHasSavedBank(extractBanksFromResponse(response).length > 0);
      } catch (nextError) {
        if (!mounted) return;
        if (nextError instanceof ApiError && (nextError.status === 401 || nextError.status === 403)) {
          router.replace(loginHref);
          return;
        }
        setHasSavedBank(false);
      } finally {
        if (mounted) setBankLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [isBankSetup, loginHref, router]);

  async function handleComplete(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const bankFilled = Boolean(hasBankValues(form));

    if (isBankSetup) {
      if (required && !bankFilled && !hasSavedBank) {
        setError("A bank account is required for this flow.");
        return;
      }

      if (bankFilled && (!form.bankAccountName.trim() || !form.bankAccountNumber.trim() || !form.bankName.trim())) {
        setError("Please complete all bank fields or leave them all blank.");
        return;
      }
    } else if (required && !hasSavedCard) {
      setError("A saved card is required for this flow.");
      return;
    }

    try {
      setSaving(true);

      if (isBankSetup && bankFilled) {
        await addBankAccount({
          account_name: form.bankAccountName.trim(),
          account_number: form.bankAccountNumber.trim(),
          bank_name: form.bankName.trim(),
        });
        setHasSavedBank(true);
      }

      setSuccess(isBankSetup ? "Bank details saved." : "Card setup confirmed.");
      setForm({
        bankAccountName: "",
        bankAccountNumber: "",
        bankName: "",
      });
      window.setTimeout(() => {
        router.push(isSettingsMode ? "/profile/settings?saved=1" : nextPath || "/");
      }, 500);
    } catch (nextError) {
      if (nextError instanceof ApiError && (nextError.status === 401 || nextError.status === 403)) {
        const returnPath =
          typeof window === "undefined"
            ? "/auth/signup/payment-setup"
            : `${window.location.pathname}${window.location.search}`;
        router.replace(`/auth/login?next=${encodeURIComponent(returnPath)}`);
        return;
      }
      setError(nextError instanceof Error ? nextError.message : "Unable to save payment details.");
    } finally {
      setSaving(false);
    }
  }

  function handleSkip() {
    router.push(isSettingsMode ? "/profile/settings" : nextPath || "/");
  }

  return (
    <>
      <style>{styles}</style>
      <div className="pay-root">
        <section className="pay-card">
          <Link className="pay-back" href={isSettingsMode ? "/profile/settings" : nextPath || "/profile"}>
            Back
          </Link>
          <p className="pay-eyebrow">{isSettingsMode ? "Billing Setup" : isBankSetup ? "Worker Bank Setup" : "Card Setup"}</p>
          <h1 className="pay-title">{isBankSetup ? "Bank account setup" : "Card setup"}</h1>
          <p className="pay-sub">
            {isBankSetup
              ? "Workers only need a bank account before marking a job complete or using wallet withdrawals."
              : "Job posters only need a saved card before posting or releasing payment when a completed job is ready to sign off."}
          </p>

          {error ? <div className="pay-error">{error}</div> : null}
          {success ? <div className="pay-success">{success}</div> : null}
          <div className="pay-note">
            {isBankSetup
              ? "You can leave this screen without saving. If the current flow requires worker payouts, at least one bank account must be on file."
              : "You can leave this screen without saving. If the current flow requires card billing, at least one saved card must be on file."}
          </div>

          <form onSubmit={handleComplete}>
            {isBankSetup ? (
              <div className="pay-grid" style={{ gridTemplateColumns: "1fr" }}>
                <section className="pay-panel">
                  <h2 className="pay-panel-title">Bank account</h2>
                  <div className="pay-note" style={{ marginBottom: 12 }}>
                    {bankLoading
                      ? "Checking your saved bank accounts…"
                      : hasSavedBank
                        ? "A bank account is already on file. Add another one below if you want to update your payout details."
                        : "No bank account saved yet. Add one now so completed jobs can be paid out to your wallet flow."}
                  </div>
                  <div className="pay-field">
                    <label className="pay-label">Account name</label>
                    <input
                      className="pay-input"
                      value={form.bankAccountName}
                      onChange={(e) => setForm({ ...form, bankAccountName: e.target.value })}
                    />
                  </div>
                  <div className="pay-field">
                    <label className="pay-label">Account number</label>
                    <input
                      className="pay-input"
                      inputMode="numeric"
                      value={form.bankAccountNumber}
                      onChange={(e) => setForm({ ...form, bankAccountNumber: e.target.value })}
                    />
                  </div>
                  <div className="pay-field">
                    <label className="pay-label">Bank name</label>
                    <input
                      className="pay-input"
                      value={form.bankName}
                      onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                    />
                  </div>
                </section>
              </div>
            ) : (
              <div className="pay-grid" style={{ gridTemplateColumns: "1fr" }}>
                <section className="pay-panel">
                  <h2 className="pay-panel-title">Saved card</h2>
                  <div className="pay-stripe">
                    <div className="pay-note" style={{ marginBottom: 0 }}>
                      {cardLoading
                        ? "Checking your Stripe payment methods…"
                        : hasSavedCard
                          ? "A saved card is already on file. You can still add another secure card below."
                          : "No saved card yet. Add one securely with Stripe so posting and customer payments are ready."}
                    </div>
                    <div className="pay-stripe-shell">
                      <StripeSetupCardForm
                        buttonLabel="Save secure card"
                        makeDefaultOnSuccess
                        resetKey={cardResetKey}
                        onAuthError={() => router.replace(loginHref)}
                        onSuccess={() => {
                          setHasSavedCard(true);
                          setCardResetKey((current) => current + 1);
                          setSuccess("Card saved securely.");
                          if (nextPath) {
                            window.setTimeout(() => router.push(nextPath), 500);
                          }
                        }}
                        onError={(message) => setError(message)}
                      />
                    </div>
                  </div>
                </section>
              </div>
            )}

            <div className="pay-actions">
              {!required ? (
                <button className="pay-btn pay-btn-secondary" onClick={handleSkip} type="button">
                  Skip for now
                </button>
              ) : null}
              <button className="pay-btn pay-btn-primary" disabled={saving} type="submit">
                {saving ? "Saving…" : isBankSetup ? "Save bank details" : "Continue"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </>
  );
}
