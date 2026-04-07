import { api } from "@/lib/api";
import type { ApiEnvelope } from "@/lib/apiTypes";

export type JobInterestItem = {
  _id?: string;
  status?: string | number;
  type?: string | number;
  workerId?: {
    _id?: string;
    firstname?: string;
    lastname?: string;
    image?: string;
    bio?: string;
    role?: string | number;
  };
};

export async function createJobInterest(payload: {
  workerId: string;
  status?: string | number;
  type?: string | number;
}) {
  return api<ApiEnvelope<unknown>>("/jobInterested", {
    method: "POST",
    body: payload,
  });
}

export async function updateJobInterest(payload: {
  jobinterestId: string;
  status?: string | number;
  type?: string | number;
}) {
  return api<ApiEnvelope<unknown>>("/updatejobInterested", {
    method: "POST",
    body: payload,
  });
}

export async function deleteJobInterest(interestId: string) {
  return api<ApiEnvelope<unknown>>("/deleteInterest", {
    method: "DELETE",
    body: { interestId },
  });
}

export async function getReconnectList() {
  return api<ApiEnvelope<JobInterestItem[]>>("/ReConnectJob_listing");
}
