"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { StripeSetupCardForm } from "@/components/StripeSetupCardForm";
import { ApiError } from "@/lib/api";
import {
  addBankAccount,
  deleteBankAccount,
  deleteSavedCard,
  editBankAccount,
  extractBanksFromResponse,
  extractCardsFromResponse,
  extractPaymentsFromResponse,
  extractWithdrawalsFromResponse,
  getBankAccounts,
  getPaymentHistory,
  getPaymentProfile,
  getSavedCards,
  getWalletAmount,
  getWithdrawList,
  getWorkerWalletHistory,
  isWorkerRole,
  maskBankAccount,
  normalizeProfile,
  requestWithdraw,
  type BankAccount,
  type PaymentHistoryItem,
  type PaymentProfile,
  type SavedCard,
  type WithdrawItem,
  type WorkerWalletHistory,
} from "@/lib/payments";

const styles = `
  .payarea-root * { box-sizing: border-box; }
  .payarea-root {
    min-height: calc(100vh - 56px);
    padding: 36px 18px 72px;
    background:
      radial-gradient(860px 520px at 10% 0%, rgba(91,110,127,0.18), rgba(0,0,0,0) 58%),
      linear-gradient(180deg, #2A3439, #20282c);
    color: #E5E5E5;
    font-family: 'DM Sans', sans-serif;
  }
  .payarea-shell {
    max-width: 1120px;
    margin: 0 auto;
    display: grid;
    gap: 18px;
  }
  .payarea-hero {
    display: flex;
    justify-content: space-between;
    align-items: end;
    gap: 16px;
    flex-wrap: wrap;
  }
  .payarea-eyebrow {
    font-size: 10px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: rgba(229,229,229,0.44);
    margin: 0 0 8px;
  }
  .payarea-title {
    margin: 0;
    font-family: 'DM Serif Display', serif;
    font-size: 36px;
    line-height: 1.05;
  }
  .payarea-sub {
    margin: 10px 0 0;
    max-width: 620px;
    color: rgba(229,229,229,0.64);
    font-size: 14px;
    line-height: 1.6;
  }
  .payarea-back {
    color: rgba(229,229,229,0.72);
    text-decoration: none;
    border: 1px solid rgba(229,229,229,0.12);
    background: rgba(229,229,229,0.05);
    border-radius: 12px;
    padding: 10px 14px;
    font-size: 12px;
  }
  .payarea-grid {
    display: grid;
    gap: 18px;
    grid-template-columns: 1.2fr 0.8fr;
  }
  .payarea-main, .payarea-side {
    display: grid;
    gap: 18px;
    align-content: start;
  }
  .payarea-card {
    border: 1px solid rgba(229,229,229,0.1);
    border-radius: 18px;
    background: rgba(62,74,81,0.72);
    backdrop-filter: blur(10px);
    box-shadow: 0 18px 48px rgba(0,0,0,0.28);
    overflow: hidden;
  }
  .payarea-section {
    padding: 22px;
  }
  .payarea-section + .payarea-section {
    border-top: 1px solid rgba(229,229,229,0.08);
  }
  .payarea-section-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    margin-bottom: 14px;
  }
  .payarea-section-title {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
  }
  .payarea-pill {
    border-radius: 999px;
    padding: 6px 10px;
    font-size: 11px;
    color: rgba(229,229,229,0.76);
    background: rgba(229,229,229,0.08);
    border: 1px solid rgba(229,229,229,0.1);
  }
  .payarea-balance {
    font-size: 42px;
    line-height: 1;
    font-weight: 700;
    margin: 0;
    color: #26A69A;
  }
  .payarea-balance-sub {
    margin: 8px 0 0;
    color: rgba(229,229,229,0.58);
    font-size: 13px;
  }
  .payarea-metrics {
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(3, 1fr);
    margin-top: 16px;
  }
  .payarea-metric {
    border: 1px solid rgba(229,229,229,0.1);
    border-radius: 14px;
    background: rgba(42,52,57,0.56);
    padding: 14px;
  }
  .payarea-metric-label {
    font-size: 10px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(229,229,229,0.42);
    margin-bottom: 8px;
  }
  .payarea-metric-value {
    font-size: 18px;
    font-weight: 700;
  }
  .payarea-banner {
    border: 1px solid rgba(38,166,154,0.28);
    background: rgba(38,166,154,0.12);
    border-radius: 14px;
    padding: 14px 16px;
    font-size: 13px;
    line-height: 1.6;
    color: rgba(229,229,229,0.84);
  }
  .payarea-error {
    border: 1px solid rgba(183,91,91,0.38);
    background: rgba(183,91,91,0.14);
    color: rgba(255,220,220,0.92);
    border-radius: 12px;
    padding: 12px 14px;
    font-size: 13px;
    white-space: pre-wrap;
  }
  .payarea-success {
    border: 1px solid rgba(38,166,154,0.34);
    background: rgba(38,166,154,0.12);
    color: rgba(229,245,242,0.94);
    border-radius: 12px;
    padding: 12px 14px;
    font-size: 13px;
  }
  .payarea-form-grid {
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(2, 1fr);
  }
  .payarea-stripe-shell {
    border: 1px solid rgba(229,229,229,0.12);
    border-radius: 14px;
    background: #2A3439;
    padding: 14px;
  }
  .payarea-stripe-shell button {
    border: none;
    border-radius: 12px;
    padding: 12px 14px;
    font: inherit;
    font-size: 12px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    cursor: pointer;
    background: #26A69A;
    color: #fff;
    font-weight: 600;
  }
  .payarea-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .payarea-field.full {
    grid-column: 1 / -1;
  }
  .payarea-label {
    font-size: 10px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(229,229,229,0.42);
  }
  .payarea-input, .payarea-select {
    width: 100%;
    border-radius: 12px;
    border: 1px solid rgba(229,229,229,0.12);
    background: #2A3439;
    color: #E5E5E5;
    font-size: 14px;
    font-family: inherit;
    padding: 12px 13px;
    outline: none;
  }
  .payarea-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    margin-top: 14px;
  }
  .payarea-actions > * {
    flex: 0 1 auto;
  }
  .payarea-btn {
    border: none;
    border-radius: 12px;
    padding: 11px 14px;
    font-family: inherit;
    font-size: 12px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    cursor: pointer;
  }
  .payarea-btn.primary {
    background: #26A69A;
    color: #fff;
    font-weight: 600;
  }
  .payarea-btn.secondary {
    background: rgba(229,229,229,0.08);
    color: #E5E5E5;
    border: 1px solid rgba(229,229,229,0.12);
  }
  .payarea-btn.danger {
    background: rgba(183,91,91,0.16);
    color: #ffd9d9;
    border: 1px solid rgba(183,91,91,0.24);
  }
  .payarea-btn:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
  .payarea-list {
    display: grid;
    gap: 12px;
  }
  .payarea-item {
    border: 1px solid rgba(229,229,229,0.08);
    border-radius: 14px;
    background: rgba(42,52,57,0.5);
    padding: 14px;
  }
  .payarea-item-top {
    display: flex;
    justify-content: space-between;
    align-items: start;
    gap: 12px;
  }
  .payarea-item-title {
    font-size: 14px;
    font-weight: 600;
  }
  .payarea-item-sub {
    margin-top: 4px;
    color: rgba(229,229,229,0.58);
    font-size: 12px;
  }
  .payarea-row {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    margin-top: 12px;
  }
  .payarea-mini {
    font-size: 12px;
    color: rgba(229,229,229,0.62);
  }
  .payarea-empty {
    font-size: 13px;
    color: rgba(229,229,229,0.52);
    border: 1px dashed rgba(229,229,229,0.12);
    border-radius: 14px;
    padding: 18px;
  }
  .payarea-table {
    display: grid;
    gap: 12px;
  }
  .payarea-table-row {
    display: grid;
    gap: 12px;
    grid-template-columns: 1.3fr 0.8fr 0.8fr;
    align-items: center;
    padding: 12px 0;
    border-top: 1px solid rgba(229,229,229,0.08);
  }
  .payarea-table-row:first-child {
    border-top: 0;
    padding-top: 0;
  }
  .payarea-status {
    display: inline-flex;
    align-items: center;
    width: fit-content;
    border-radius: 999px;
    padding: 5px 9px;
    font-size: 11px;
    border: 1px solid rgba(229,229,229,0.1);
    background: rgba(229,229,229,0.06);
  }
  .payarea-status.approved { color: #8ff0b4; }
  .payarea-status.pending { color: #ffd98c; }
  .payarea-status.rejected { color: #ffb1b1; }
  .payarea-muted {
    color: rgba(229,229,229,0.54);
    font-size: 12px;
  }
  .payarea-loading {
    color: rgba(229,229,229,0.55);
    font-size: 13px;
  }
  @media (max-width: 920px) {
    .payarea-grid {
      grid-template-columns: 1fr;
    }
    .payarea-side {
      order: -1;
    }
  }
  @media (max-width: 720px) {
    .payarea-root {
      padding: 22px 12px 44px;
    }
    .payarea-hero {
      align-items: stretch;
    }
    .payarea-back {
      width: 100%;
      text-align: center;
      justify-content: center;
    }
    .payarea-metrics,
    .payarea-form-grid,
    .payarea-table-row {
      grid-template-columns: 1fr;
    }
    .payarea-table-row {
      gap: 8px;
      align-items: flex-start;
    }
    .payarea-item-top {
      flex-direction: column;
      align-items: flex-start;
    }
    .payarea-row {
      flex-direction: column;
    }
    .payarea-row > * {
      width: 100%;
    }
    .payarea-actions > * {
      flex: 1 1 100%;
    }
    .payarea-section {
      padding: 18px;
    }
    .payarea-title {
      font-size: 30px;
    }
    .payarea-balance {
      font-size: 34px;
    }
  }
`;

function formatMoney(value: unknown) {
  const num = typeof value === "number" ? value : Number.parseFloat(String(value ?? 0));
  return `$${(Number.isFinite(num) ? num : 0).toFixed(2)}`;
}

function formatDate(value: string | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function normalizeStatus(value: unknown) {
  const raw = String(value ?? "");
  if (raw === "1") return { label: "Approved", className: "approved" };
  if (raw === "0") return { label: "Pending", className: "pending" };
  return { label: "Rejected", className: "rejected" };
}

export default function PaymentsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next");
  const [profile, setProfile] = useState<PaymentProfile | null>(null);
  const [cards, setCards] = useState<SavedCard[]>([]);
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawItem[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryItem[]>([]);
  const [workerHistory, setWorkerHistory] = useState<WorkerWalletHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [cardResetKey, setCardResetKey] = useState(0);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);

  const [editingBankId, setEditingBankId] = useState<string | null>(null);
  const [bankAccountName, setBankAccountName] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [selectedBankId, setSelectedBankId] = useState("");

  const loadAll = useCallback(async () => {
    const token =
      typeof window === "undefined"
        ? ""
        : window.localStorage.getItem("gumboot_token") || window.localStorage.getItem("token") || "";
    if (!token) {
      router.replace("/auth/login");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const profileResponse = await getPaymentProfile();
      const nextProfile = normalizeProfile(profileResponse.body);
      setProfile(nextProfile);

      const [cardsResponse, banksResponse, withdrawResponse] = await Promise.all([
        getSavedCards(),
        getBankAccounts(),
        getWithdrawList(),
      ]);

      const nextCards = extractCardsFromResponse(cardsResponse);
      const nextBanks = extractBanksFromResponse(banksResponse);
      setCards(nextCards);
      setBanks(nextBanks);
      setWithdrawals(extractWithdrawalsFromResponse(withdrawResponse));

      const defaultBank = nextBanks.find((bank) => String(bank.default ?? 0) === "1") ?? nextBanks[0] ?? null;
      setSelectedBankId(defaultBank?._id ?? "");

      if (isWorkerRole(nextProfile?.role)) {
        const workerResponse = await getWorkerWalletHistory();
        setWorkerHistory(workerResponse.body ?? null);
        setPaymentHistory([]);
      } else {
        const historyResponse = await getPaymentHistory();
        setPaymentHistory(extractPaymentsFromResponse(historyResponse));
        setWorkerHistory(null);
      }
    } catch (nextError) {
      if (nextError instanceof ApiError && (nextError.status === 401 || nextError.status === 403)) {
        router.replace("/auth/login");
        return;
      }
      setError(nextError instanceof Error ? nextError.message : "Failed to load wallet and payment details.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const walletBalance = useMemo(() => {
    if (workerHistory?.total_wallet_amount != null) {
      const total = Number.parseFloat(String(workerHistory.total_wallet_amount));
      return Number.isFinite(total) ? total : getWalletAmount(profile);
    }
    return getWalletAmount(profile);
  }, [profile, workerHistory]);

  const isWorker = isWorkerRole(profile?.role);
  const totalWithdrawn = useMemo(
    () => withdrawals.reduce((sum, item) => sum + Number.parseFloat(String(item.amount ?? 0) || "0"), 0),
    [withdrawals]
  );
  const totalPayments = useMemo(
    () => paymentHistory.reduce((sum, item) => sum + Number.parseFloat(String(item.amount ?? 0) || "0"), 0),
    [paymentHistory]
  );
  const activeCard = useMemo(
    () => cards.find((card) => card.isDefault) ?? cards[0] ?? null,
    [cards]
  );
  const activeBank = useMemo(
    () => banks.find((bank) => String(bank.default ?? 0) === "1") ?? banks[0] ?? null,
    [banks]
  );

  async function runAction(key: string, action: () => Promise<void>) {
    setBusyAction(key);
    setError(null);
    setSuccess(null);
    try {
      await action();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Something went wrong.");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleSaveBank() {
    if (!bankAccountName.trim()) throw new Error("Account name is required.");
    if (!bankName.trim()) throw new Error("Bank name is required.");
    if (bankAccountNumber.replace(/\D/g, "").length < 6) throw new Error("Enter a valid bank account number.");

    if (editingBankId) {
      await editBankAccount({
        Id: editingBankId,
        account_name: bankAccountName.trim(),
        account_number: bankAccountNumber.replace(/\D/g, ""),
        bank_name: bankName.trim(),
      });
      setSuccess("Bank account updated.");
    } else {
      await addBankAccount({
        account_name: bankAccountName.trim(),
        account_number: bankAccountNumber.replace(/\D/g, ""),
        bank_name: bankName.trim(),
      });
      setSuccess("Bank account added.");
    }

    setEditingBankId(null);
    setBankAccountName("");
    setBankName("");
    setBankAccountNumber("");
    await loadAll();
  }

  async function handleWithdraw() {
    if (!withdrawAmount.trim()) throw new Error("Withdrawal amount is required.");
    if (!selectedBankId) throw new Error("Choose a bank account first.");
    await requestWithdraw(withdrawAmount.trim(), selectedBankId);
    setWithdrawAmount("");
    setSuccess("Withdrawal request submitted.");
    await loadAll();
  }

  const workerTransactions = workerHistory?.modifiedTransactions ?? [];

  return (
    <>
      <style>{styles}</style>
      <div className="payarea-root">
        <div className="payarea-shell">
          <div className="payarea-hero">
            <div>
              <p className="payarea-eyebrow">Account</p>
              <h1 className="payarea-title">Wallet & payments</h1>
              <p className="payarea-sub">
                Manage saved payment methods, bank accounts, withdrawal requests, and payment history in one place.
              </p>
            </div>
            <Link className="payarea-back" href="/profile">
              Back to profile
            </Link>
          </div>

          {loading && <div className="payarea-card"><div className="payarea-section"><div className="payarea-loading">Loading wallet, cards, bank accounts, and history…</div></div></div>}
          {error && <div className="payarea-error">{error}</div>}
          {success && <div className="payarea-success">{success}</div>}

          {!loading && (
            <div className="payarea-grid">
              <div className="payarea-main">
                <section className="payarea-card">
                  <div className="payarea-section">
                    <div className="payarea-section-head">
                      <h2 className="payarea-section-title">Wallet balance</h2>
                      <span className="payarea-pill">{isWorker ? "Worker wallet" : "Customer payments"}</span>
                    </div>
                    <p className="payarea-balance">{formatMoney(walletBalance)}</p>
                    <p className="payarea-balance-sub">
                      {isWorker ? "Available from your worker wallet and recorded transactions." : "Your current payment account snapshot."}
                    </p>

                    <div className="payarea-metrics">
                      <div className="payarea-metric">
                        <div className="payarea-metric-label">Saved cards</div>
                        <div className="payarea-metric-value">{cards.length}</div>
                      </div>
                      <div className="payarea-metric">
                        <div className="payarea-metric-label">Bank accounts</div>
                        <div className="payarea-metric-value">{banks.length}</div>
                      </div>
                      <div className="payarea-metric">
                        <div className="payarea-metric-label">{isWorker ? "Withdrawn" : "Paid total"}</div>
                        <div className="payarea-metric-value">{formatMoney(isWorker ? totalWithdrawn : totalPayments)}</div>
                      </div>
                    </div>
                  </div>

                  <div className="payarea-section">
                    <div className="payarea-section-head">
                      <h2 className="payarea-section-title">Withdraw funds</h2>
                      <span className="payarea-pill">{withdrawals.length} request{withdrawals.length === 1 ? "" : "s"}</span>
                    </div>

                    {banks.length === 0 ? (
                      <div className="payarea-banner">Add a bank account before requesting a withdrawal.</div>
                    ) : (
                      <>
                        <div className="payarea-form-grid">
                          <label className="payarea-field">
                            <span className="payarea-label">Amount</span>
                            <input
                              className="payarea-input"
                              inputMode="decimal"
                              placeholder="0.00"
                              value={withdrawAmount}
                              onChange={(e) => setWithdrawAmount(e.target.value.replace(/[^\d.]/g, ""))}
                            />
                          </label>
                          <label className="payarea-field">
                            <span className="payarea-label">Bank account</span>
                            <select className="payarea-select" value={selectedBankId} onChange={(e) => setSelectedBankId(e.target.value)}>
                              {banks.map((bank) => (
                                <option key={bank._id} value={bank._id}>
                                  {bank.account_name || bank.bank_name || "Bank account"} • {maskBankAccount(bank.account_number)}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>
                        <div className="payarea-actions">
                          <button
                            className="payarea-btn primary"
                            disabled={busyAction === "withdraw"}
                            onClick={() => runAction("withdraw", handleWithdraw)}
                          >
                            Request withdrawal
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </section>

                <section className="payarea-card">
                  <div className="payarea-section">
                    <div className="payarea-section-head">
                      <h2 className="payarea-section-title">Transaction history</h2>
                      <span className="payarea-pill">{isWorker ? "Worker ledger" : "Payment history"}</span>
                    </div>

                    {isWorker ? (
                      workerTransactions.length > 0 ? (
                        <div className="payarea-table">
                          {workerTransactions.map((item, index) => (
                            <div className="payarea-table-row" key={item.jobTransaction?._id ?? `worker-${index}`}>
                              <div>
                                <div className="payarea-item-title">{item.jobTransaction?.jobId?.job_title || "Completed job"}</div>
                                <div className="payarea-item-sub">{formatDate(item.jobTransaction?.createdAt)}</div>
                              </div>
                              <div>
                                <div className="payarea-mini">Worker amount</div>
                                <div className="payarea-item-title">{formatMoney(item.workerFinalAmount ?? item.jobTransaction?.amount ?? 0)}</div>
                              </div>
                              <div>
                                <div className="payarea-mini">Admin charge</div>
                                <div className="payarea-item-title">{formatMoney(item.adminCharges ?? 0)}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="payarea-empty">No worker wallet history has been recorded yet.</div>
                      )
                    ) : paymentHistory.length > 0 ? (
                      <div className="payarea-table">
                        {paymentHistory.map((item) => (
                          <div className="payarea-table-row" key={item._id ?? `${item.transactionId}-${item.createdAt}`}>
                            <div>
                              <div className="payarea-item-title">{item.userId?.firstname || "Payment"}</div>
                              <div className="payarea-item-sub">{item.jobId?.job_title || "Job payment"} • {formatDate(item.createdAt)}</div>
                            </div>
                            <div>
                              <div className={`payarea-status ${String(item.transaction_status) === "1" ? "approved" : "pending"}`}>
                                {String(item.transaction_status) === "1" ? "Paid" : "Receive"}
                              </div>
                            </div>
                            <div className="payarea-item-title">{formatMoney(item.amount)}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="payarea-empty">No payment transactions yet.</div>
                    )}
                  </div>
                </section>

                <section className="payarea-card">
                  <div className="payarea-section">
                    <div className="payarea-section-head">
                      <h2 className="payarea-section-title">Withdrawal requests</h2>
                    </div>
                    {withdrawals.length > 0 ? (
                      <div className="payarea-table">
                        {withdrawals.map((item) => {
                          const status = normalizeStatus(item.status);
                          return (
                            <div className="payarea-table-row" key={item._id ?? `${item.createdAt}-${item.amount}`}>
                              <div>
                                <div className="payarea-item-title">{item.userId?.firstname || profile?.firstname || "Account"}</div>
                                <div className="payarea-item-sub">{formatDate(item.createdAt)}</div>
                              </div>
                              <div>
                                <span className={`payarea-status ${status.className}`}>{status.label}</span>
                              </div>
                              <div className="payarea-item-title">{formatMoney(item.amount)}</div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="payarea-empty">No withdrawal requests yet.</div>
                    )}
                  </div>
                </section>
              </div>

              <aside className="payarea-side">
                <section className="payarea-card">
                  <div className="payarea-section">
                    <div className="payarea-section-head">
                      <h2 className="payarea-section-title">{editingCardId ? "Edit card" : "Active card"}</h2>
                      <span className="payarea-pill">{cards.length} on file</span>
                    </div>

                    {cards.length === 0 && (
                      <div className="payarea-banner">
                        A saved Stripe card is required before posting a job. Add one here and the post-job flow will unlock automatically.
                      </div>
                    )}
                    {editingCardId ? (
                      <div className="payarea-banner">
                        Add a replacement card below. We&apos;ll make the new card your default payment method and remove the old one once Stripe saves it.
                      </div>
                    ) : null}

                    {cards.length === 0 || editingCardId ? (
                      <div className="payarea-stripe-shell">
                        <StripeSetupCardForm
                          buttonLabel={editingCardId ? "Replace card" : "Add secure card"}
                          makeDefaultOnSuccess={Boolean(editingCardId)}
                          resetKey={`${cardResetKey}-${editingCardId ?? "new"}`}
                          onSuccess={async () => {
                            if (editingCardId) {
                              await deleteSavedCard(editingCardId);
                              setEditingCardId(null);
                              setSuccess("Card replaced successfully.");
                            } else {
                              setSuccess(nextPath ? "Card added. Taking you back to finish posting." : "Card added.");
                            }
                            setCardResetKey((current) => current + 1);
                            await loadAll();
                            if (nextPath) {
                              router.push(nextPath);
                            }
                          }}
                          onError={(message) => setError(message)}
                        />
                        {editingCardId ? (
                          <div className="payarea-actions">
                            <button
                              className="payarea-btn secondary"
                              onClick={() => {
                                setEditingCardId(null);
                                setError(null);
                                setSuccess(null);
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : null}
                      </div>
                    ) : activeCard ? (
                      <div className="payarea-list" style={{ marginTop: 16 }}>
                        <div className="payarea-item" key={activeCard.id}>
                          <div className="payarea-item-top">
                            <div>
                              <div className="payarea-item-title">
                                {activeCard.brand ? `${activeCard.brand[0].toUpperCase()}${activeCard.brand.slice(1)} ` : ""}
                                •••• {activeCard.last4 || "----"}
                              </div>
                              <div className="payarea-item-sub">
                                Expires {activeCard.exp_month || "—"}/{String(activeCard.exp_year || "").slice(-2) || "—"}
                              </div>
                            </div>
                            <span className="payarea-pill">Default</span>
                          </div>
                          <div className="payarea-row">
                            <button
                              className="payarea-btn secondary"
                              onClick={() => {
                                setEditingCardId(activeCard.id);
                                setCardResetKey((current) => current + 1);
                                setError(null);
                                setSuccess(null);
                              }}
                            >
                              Edit card
                            </button>
                            <button
                              className="payarea-btn danger"
                              disabled={busyAction === `card-delete-${activeCard.id}`}
                              onClick={() => runAction(`card-delete-${activeCard.id}`, async () => {
                                await deleteSavedCard(activeCard.id);
                                if (editingCardId === activeCard.id) {
                                  setEditingCardId(null);
                                }
                                setSuccess("Card deleted.");
                                await loadAll();
                              })}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : <div className="payarea-empty">No saved cards yet.</div>}
                  </div>
                </section>

                <section className="payarea-card">
                  <div className="payarea-section">
                    <div className="payarea-section-head">
                      <h2 className="payarea-section-title">{editingBankId ? "Edit bank account" : "Active bank account"}</h2>
                      <span className="payarea-pill">{banks.length} saved</span>
                    </div>

                    {banks.length === 0 || editingBankId ? (
                      <>
                        <div className="payarea-form-grid">
                          <label className="payarea-field full">
                            <span className="payarea-label">Account name</span>
                            <input className="payarea-input" value={bankAccountName} onChange={(e) => setBankAccountName(e.target.value)} placeholder="Jane Doe" />
                          </label>
                          <label className="payarea-field">
                            <span className="payarea-label">Bank name</span>
                            <input className="payarea-input" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="ANZ" />
                          </label>
                          <label className="payarea-field">
                            <span className="payarea-label">Account number</span>
                            <input
                              className="payarea-input"
                              inputMode="numeric"
                              value={bankAccountNumber}
                              onChange={(e) => setBankAccountNumber(e.target.value.replace(/[^\d]/g, ""))}
                              placeholder="1234567890123456"
                            />
                          </label>
                        </div>
                        <div className="payarea-actions">
                          <button
                            className="payarea-btn primary"
                            disabled={busyAction === "bank-save"}
                            onClick={() => runAction("bank-save", handleSaveBank)}
                          >
                            {editingBankId ? "Save bank" : "Add bank"}
                          </button>
                          {editingBankId ? (
                            <button
                              className="payarea-btn secondary"
                              onClick={() => {
                                setEditingBankId(null);
                                setBankAccountName("");
                                setBankName("");
                                setBankAccountNumber("");
                              }}
                            >
                              Cancel
                            </button>
                          ) : null}
                        </div>
                      </>
                    ) : activeBank ? (
                      <div className="payarea-list" style={{ marginTop: 16 }}>
                        <div className="payarea-item" key={activeBank._id ?? `${activeBank.account_name}-${activeBank.account_number}`}>
                          <div className="payarea-item-top">
                            <div>
                              <div className="payarea-item-title">{activeBank.account_name || activeBank.bank_name || "Bank account"}</div>
                              <div className="payarea-item-sub">{activeBank.bank_name || "Bank"} • {maskBankAccount(activeBank.account_number)}</div>
                            </div>
                            <span className="payarea-pill">Default</span>
                          </div>
                          <div className="payarea-row">
                            <button
                              className="payarea-btn secondary"
                              onClick={() => {
                                setEditingBankId(activeBank._id ?? null);
                                setBankAccountName(activeBank.account_name ?? "");
                                setBankName(activeBank.bank_name ?? "");
                                setBankAccountNumber(activeBank.account_number ?? "");
                              }}
                            >
                              Edit bank
                            </button>
                            <button
                              className="payarea-btn danger"
                              disabled={busyAction === `bank-delete-${activeBank._id}`}
                              onClick={() => runAction(`bank-delete-${activeBank._id}`, async () => {
                                if (!activeBank._id) return;
                                await deleteBankAccount(activeBank._id);
                                setSuccess("Bank account deleted.");
                                if (editingBankId === activeBank._id) {
                                  setEditingBankId(null);
                                  setBankAccountName("");
                                  setBankName("");
                                  setBankAccountNumber("");
                                }
                                await loadAll();
                              })}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="payarea-empty">No saved bank accounts yet.</div>
                    )}
                  </div>
                </section>
              </aside>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
