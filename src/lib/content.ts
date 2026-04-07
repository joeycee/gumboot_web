import { api } from "@/lib/api";
import type { ApiEnvelope } from "@/lib/apiTypes";

export type CmsEntry = {
  _id?: string;
  title?: string;
  description?: string;
  content?: string;
  body?: string;
};

export type FaqItem = {
  _id?: string;
  question?: string;
  answer?: string;
  title?: string;
  description?: string;
};

export async function fetchAboutPage() {
  return api<ApiEnvelope<CmsEntry>>("/about_us", { auth: false });
}

export async function fetchTermsPage() {
  return api<ApiEnvelope<CmsEntry>>("/terms_conditions", { auth: false });
}

export async function fetchPrivacyPage() {
  return api<ApiEnvelope<CmsEntry>>("/privacy_Policy", { auth: false });
}

export async function fetchFaqs() {
  return api<ApiEnvelope<FaqItem[]>>("/faq_listing", { auth: false });
}

export function getCmsHtml(entry: CmsEntry | null | undefined) {
  return entry?.description?.trim() || entry?.content?.trim() || entry?.body?.trim() || "";
}
