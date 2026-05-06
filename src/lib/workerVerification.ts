export type WorkerVerificationStatusValue = "verified" | "unverified";

export type WorkerVerificationSubject = {
  role?: string | number | null;
  admin_verification_status?: string | null;
};

export function getWorkerVerificationStatus(
  subject: WorkerVerificationSubject | null | undefined
): WorkerVerificationStatusValue | null {
  if (!subject) return null;
  if (String(subject.role ?? "") !== "2") return null;
  return subject.admin_verification_status === "verified" ? "verified" : "unverified";
}

export function getWorkerVerificationLabel(status: WorkerVerificationStatusValue | null | undefined) {
  if (status === "verified") return "Verified";
  if (status === "unverified") return "Unverified";
  return "";
}
