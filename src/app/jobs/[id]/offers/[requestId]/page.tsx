import OfferReviewClient from "./offer-review-client";

type OfferReviewPageProps = {
  params: Promise<{
    id: string;
    requestId: string;
  }>;
};

export default async function OfferReviewPage({ params }: OfferReviewPageProps) {
  const { id, requestId } = await params;
  return <OfferReviewClient jobId={id} requestId={requestId} />;
}
