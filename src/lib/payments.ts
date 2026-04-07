import { api } from "./api";
import type { ApiEnvelope } from "./apiTypes";

type UnknownRecord = Record<string, unknown>;

export type PaymentProfile = {
  _id?: string;
  firstname?: string;
  lastname?: string;
  email?: string;
  role?: string | number;
  wallet_amount?: number | string;
  image?: string;
};

export type SavedCard = {
  id: string;
  brand?: string;
  last4?: string;
  exp_month?: number | null;
  exp_year?: number | null;
  isDefault?: boolean;
};

export type BankAccount = {
  _id?: string;
  workerId?: string;
  account_name?: string;
  bank_name?: string;
  account_number?: string;
  default?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type WithdrawItem = {
  _id?: string;
  userId?: {
    _id?: string;
    firstname?: string;
    lastname?: string;
    email?: string;
    image?: string;
  };
  bank_id?: string;
  amount?: string | number;
  status?: string | number;
  createdAt?: string;
  updatedAt?: string;
};

export type PaymentHistoryItem = {
  _id?: string;
  userId?: {
    _id?: string;
    firstname?: string;
    image?: string;
  };
  jobId?: {
    _id?: string;
    job_title?: string;
    price?: string | number;
  };
  transactionId?: string;
  cancellation_charges?: string | number | null;
  transaction_status?: string | number;
  amount?: string | number;
  createdAt?: string;
  updatedAt?: string;
};

export type WorkerWalletHistory = {
  modifiedTransactions?: Array<{
    jobTransaction?: {
      _id?: string;
      transactionId?: string;
      transaction_status?: string | number;
      amount?: string | number;
      createdAt?: string;
      userId?: {
        _id?: string;
        firstname?: string;
        image?: string;
      };
      jobId?: {
        _id?: string;
        job_title?: string;
        price?: string | number;
        image?: Array<{ url?: string }>;
      };
    };
    jobPrice?: string | number;
    add_Cost?: string | number;
    adminCharges?: string | number;
    workerFinalAmount?: string | number;
  }>;
  total_wallet_amount?: string | number;
};

type ProfileEnvelopeBody =
  | PaymentProfile
  | {
      profiledata?: PaymentProfile;
      userDetail?: PaymentProfile;
      ratingdata?: UnknownRecord;
    };

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export function normalizeProfile(body: ProfileEnvelopeBody | undefined): PaymentProfile | null {
  if (!body || typeof body !== "object") return null;
  const root = body as UnknownRecord;
  const nested = (root.profiledata ?? root.userDetail) as PaymentProfile | undefined;
  return nested ?? (body as PaymentProfile);
}

export function getWalletAmount(profile: PaymentProfile | null | undefined): number {
  const value = profile?.wallet_amount;
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function isWorkerRole(role: unknown): boolean {
  const value = String(role ?? "").trim().toLowerCase();
  return value === "2" || value === "worker";
}

export function maskCardNumber(value: string | number | undefined) {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (!digits) return "No card number";
  return `•••• ${digits.slice(-4)}`;
}

export function formatSavedCardLabel(card: SavedCard) {
  return maskCardNumber(card.last4);
}

export function maskBankAccount(value: string | undefined) {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (!digits) return "No account number";
  return `XXXX-XXXX-XXXX-${digits.slice(-4)}`;
}

export async function getPaymentProfile() {
  return api<ApiEnvelope<ProfileEnvelopeBody>>("/profile", { method: "GET" });
}

export async function getSavedCards() {
  return api<ApiEnvelope<SavedCard[]>>("/billing/payment-methods", { method: "GET" });
}

export async function createCardSetupIntent() {
  return api<ApiEnvelope<{ clientSecret: string; customerId: string; setupIntentId: string }>>(
    "/billing/setup-intent",
    { method: "POST" }
  );
}

export async function setDefaultSavedCard(paymentMethodId: string) {
  return api<ApiEnvelope<SavedCard>>("/billing/default-payment-method", {
    method: "POST",
    body: { paymentMethodId },
  });
}

export async function deleteSavedCard(cardId: string) {
  return api<ApiEnvelope<unknown>>(`/billing/payment-method/${cardId}`, { method: "DELETE" });
}

export async function getBankAccounts() {
  return api<ApiEnvelope<BankAccount[]>>("/bank_list", { method: "GET" });
}

export async function addBankAccount(payload: {
  account_name: string;
  account_number: string;
  bank_name: string;
}) {
  return api<ApiEnvelope<unknown>>("/add_bank", { method: "POST", body: payload });
}

export async function editBankAccount(payload: {
  Id: string;
  account_name: string;
  account_number: string;
  bank_name: string;
}) {
  return api<ApiEnvelope<unknown>>("/edit_bank", { method: "POST", body: payload });
}

export async function deleteBankAccount(id: string) {
  return api<ApiEnvelope<unknown>>("/delete_bank", { method: "DELETE", body: { id } });
}

export async function setDefaultBank(bankId: string) {
  return api<ApiEnvelope<unknown>>("/set_default_bank", { method: "POST", body: { bankId } });
}

export async function getWithdrawList() {
  return api<ApiEnvelope<WithdrawItem[]>>("/withdrawList", { method: "GET" });
}

export async function requestWithdraw(amount: string, bankId: string) {
  return api<ApiEnvelope<unknown>>("/withdrawRequest", {
    method: "POST",
    body: { amount, bank_id: bankId },
  });
}

export async function getPaymentHistory() {
  return api<ApiEnvelope<PaymentHistoryItem[]>>("/transaction_list", { method: "GET" });
}

export async function getWorkerWalletHistory() {
  return api<ApiEnvelope<WorkerWalletHistory>>("/worker_transaction_history", { method: "GET" });
}

export async function recordJobPayment(payload: {
  jobId: string;
  paymentMethodId?: string | null;
}) {
  return api<ApiEnvelope<{ clientSecret: string; paymentIntentId: string; transactionId: string; amount: number; currency: string }>>("/billing/create-payment-intent", {
    method: "POST",
    body: payload,
  });
}

export function extractCardsFromResponse(response: ApiEnvelope<SavedCard[]> | null | undefined) {
  return asArray<SavedCard>(response?.body);
}

export function extractBanksFromResponse(response: ApiEnvelope<BankAccount[]> | null | undefined) {
  return asArray<BankAccount>(response?.body);
}

export function extractWithdrawalsFromResponse(response: ApiEnvelope<WithdrawItem[]> | null | undefined) {
  return asArray<WithdrawItem>(response?.body);
}

export function extractPaymentsFromResponse(response: ApiEnvelope<PaymentHistoryItem[]> | null | undefined) {
  return asArray<PaymentHistoryItem>(response?.body);
}
