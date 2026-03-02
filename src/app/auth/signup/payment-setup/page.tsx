"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

const PAYMENT_DRAFT_KEY = "gumboot_signup_payment_setup";

type PaymentDraft = {
  bankAccountName: string;
  bankAccountNumber: string;
  bankRoutingNumber: string;
  cardHolderName: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvc: string;
  skipped: boolean;
};

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');

  .pay-root * { box-sizing: border-box; margin: 0; padding: 0; }
  .pay-root {
    min-height: 100dvh;
    background: #2A3439;
    color: #E5E5E5;
    font-family: 'DM Sans', sans-serif;
    padding: 34px 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-image:
      radial-gradient(ellipse at 20% 10%, rgba(91,110,127,0.18) 0%, transparent 55%),
      radial-gradient(ellipse at 80% 90%, rgba(38,166,154,0.08) 0%, transparent 50%);
  }
  .pay-card {
    width: 100%;
    max-width: 860px;
    border: 1px solid rgba(229,229,229,0.08);
    border-radius: 18px;
    background: #3E4A51;
    padding: 28px;
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
    color: rgba(229,229,229,0.52);
    margin-bottom: 24px;
    line-height: 1.6;
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
  .pay-error {
    border: 1px solid rgba(183,91,91,0.42);
    background: rgba(183,91,91,0.12);
    border-radius: 10px;
    padding: 10px 12px;
    color: rgba(245,196,196,0.95);
    font-size: 13px;
    margin-bottom: 12px;
  }
  .pay-note {
    font-size: 12px;
    color: rgba(229,229,229,0.65);
    margin-top: 10px;
    line-height: 1.5;
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
`;

function readDraft(): PaymentDraft {
  if (typeof window === "undefined") {
    return {
      bankAccountName: "",
      bankAccountNumber: "",
      bankRoutingNumber: "",
      cardHolderName: "",
      cardNumber: "",
      cardExpiry: "",
      cardCvc: "",
      skipped: false,
    };
  }
  const raw = window.localStorage.getItem(PAYMENT_DRAFT_KEY);
  if (!raw) {
    return {
      bankAccountName: "",
      bankAccountNumber: "",
      bankRoutingNumber: "",
      cardHolderName: "",
      cardNumber: "",
      cardExpiry: "",
      cardCvc: "",
      skipped: false,
    };
  }
  try {
    const parsed = JSON.parse(raw) as Partial<PaymentDraft>;
    return {
      bankAccountName: parsed.bankAccountName ?? "",
      bankAccountNumber: parsed.bankAccountNumber ?? "",
      bankRoutingNumber: parsed.bankRoutingNumber ?? "",
      cardHolderName: parsed.cardHolderName ?? "",
      cardNumber: parsed.cardNumber ?? "",
      cardExpiry: parsed.cardExpiry ?? "",
      cardCvc: parsed.cardCvc ?? "",
      skipped: parsed.skipped ?? false,
    };
  } catch {
    return {
      bankAccountName: "",
      bankAccountNumber: "",
      bankRoutingNumber: "",
      cardHolderName: "",
      cardNumber: "",
      cardExpiry: "",
      cardCvc: "",
      skipped: false,
    };
  }
}

export default function PaymentSetupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const required = useMemo(() => searchParams.get("required") === "1", [searchParams]);
  const [form, setForm] = useState<PaymentDraft>(() => readDraft());
  const [error, setError] = useState<string | null>(null);

  function saveDraft(next: PaymentDraft) {
    window.localStorage.setItem(PAYMENT_DRAFT_KEY, JSON.stringify(next));
  }

  function hasBankValues() {
    return (
      form.bankAccountName.trim() ||
      form.bankAccountNumber.trim() ||
      form.bankRoutingNumber.trim()
    );
  }

  function hasCardValues() {
    return (
      form.cardHolderName.trim() ||
      form.cardNumber.trim() ||
      form.cardExpiry.trim() ||
      form.cardCvc.trim()
    );
  }

  function handleComplete(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (required && !hasBankValues() && !hasCardValues()) {
      setError("Bank or card details are required for this flow.");
      return;
    }
    const next: PaymentDraft = { ...form, skipped: false };
    saveDraft(next);
    router.push("/profile");
  }

  function handleSkip() {
    const next: PaymentDraft = { ...form, skipped: true };
    saveDraft(next);
    router.push("/profile");
  }

  return (
    <>
      <style>{styles}</style>
      <div className="pay-root">
        <section className="pay-card">
          <p className="pay-eyebrow">Signup • Step 3 of 3</p>
          <h1 className="pay-title">Payment setup</h1>
          <p className="pay-sub">
            Add your own bank account or card details. You can skip this for now and complete it later.
          </p>

          {error && <div className="pay-error">{error}</div>}

          <form onSubmit={handleComplete}>
            <div className="pay-grid">
              <section className="pay-panel">
                <h2 className="pay-panel-title">Bank account</h2>
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
                    value={form.bankAccountNumber}
                    onChange={(e) => setForm({ ...form, bankAccountNumber: e.target.value })}
                  />
                </div>
                <div className="pay-field">
                  <label className="pay-label">Routing number</label>
                  <input
                    className="pay-input"
                    value={form.bankRoutingNumber}
                    onChange={(e) => setForm({ ...form, bankRoutingNumber: e.target.value })}
                  />
                </div>
              </section>

              <section className="pay-panel">
                <h2 className="pay-panel-title">Card details</h2>
                <div className="pay-field">
                  <label className="pay-label">Card holder name</label>
                  <input
                    className="pay-input"
                    value={form.cardHolderName}
                    onChange={(e) => setForm({ ...form, cardHolderName: e.target.value })}
                  />
                </div>
                <div className="pay-field">
                  <label className="pay-label">Card number</label>
                  <input
                    className="pay-input"
                    value={form.cardNumber}
                    onChange={(e) => setForm({ ...form, cardNumber: e.target.value })}
                  />
                </div>
                <div className="pay-inline">
                  <div className="pay-field">
                    <label className="pay-label">Expiry</label>
                    <input
                      className="pay-input"
                      placeholder="MM/YY"
                      value={form.cardExpiry}
                      onChange={(e) => setForm({ ...form, cardExpiry: e.target.value })}
                    />
                  </div>
                  <div className="pay-field">
                    <label className="pay-label">CVC</label>
                    <input
                      className="pay-input"
                      value={form.cardCvc}
                      onChange={(e) => setForm({ ...form, cardCvc: e.target.value })}
                    />
                  </div>
                </div>
              </section>
            </div>

            <p className="pay-note">
              If a user tries to post or accept a job without payment details, route them back here with
              <code> ?required=1</code> to enforce completion.
            </p>

            <div className="pay-actions">
              <button
                type="button"
                className="pay-btn pay-btn-secondary"
                onClick={() => router.push("/auth/signup/profile-setup")}
              >
                Back
              </button>
              {!required && (
                <button type="button" className="pay-btn pay-btn-secondary" onClick={handleSkip}>
                  Skip for now
                </button>
              )}
              <button type="submit" className="pay-btn pay-btn-primary">
                Save and finish
              </button>
            </div>
          </form>
        </section>
      </div>
    </>
  );
}
