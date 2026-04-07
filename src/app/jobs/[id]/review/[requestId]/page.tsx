import JobReviewClient from "./job-review-client";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string; requestId: string }>;
}) {
  const { id, requestId } = await params;
  return <JobReviewClient jobId={id} requestId={requestId} />;
}
