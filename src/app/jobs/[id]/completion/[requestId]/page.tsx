import CompletionReviewClient from "./completion-review-client";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string; requestId: string }>;
}) {
  const { id, requestId } = await params;
  return <CompletionReviewClient jobId={id} requestId={requestId} />;
}
