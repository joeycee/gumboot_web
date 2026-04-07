import { api } from "@/lib/api";
import type { ApiEnvelope } from "@/lib/apiTypes";

export async function addReview(payload: {
  reciver_userId: string;
  rating: number;
  comment: string;
  jobId: string;
}) {
  return api<ApiEnvelope<unknown>>("/add_review", {
    method: "POST",
    body: payload,
  });
}
