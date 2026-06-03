import type { Metadata } from "next";
import { fetchJobShareData } from "@/lib/jobShare";
import { getSiteUrl } from "@/lib/site";
import JobDetailsClient from "./job-details-client";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const share = await fetchJobShareData(id);
  const fallbackOgImagePath = "/og-gumboot-job.svg";
  const canonical = `/jobs/${encodeURIComponent(id)}`;
  const absoluteCanonical = getSiteUrl(canonical);
  const absoluteFallbackOgImage = getSiteUrl(fallbackOgImagePath);

  if (!share) {
    return {
      title: "Job | Gumboot",
      description: "View this local job and send an offer through Gumboot.",
      alternates: { canonical: absoluteCanonical },
      openGraph: {
        title: "Job | Gumboot",
        description: "View this local job and send an offer through Gumboot.",
        type: "website",
        url: absoluteCanonical,
        images: [{ url: absoluteFallbackOgImage, width: 1200, height: 630, alt: "Gumboot job preview" }],
      },
      twitter: {
        card: "summary_large_image",
        title: "Job | Gumboot",
        description: "View this local job and send an offer through Gumboot.",
        images: [absoluteFallbackOgImage],
      },
    };
  }

  const title = share.metadataTitle;
  const description = share.metadataDescription;
  const ogImageUrl = share.imageUrl?.startsWith("https://") ? share.imageUrl : absoluteFallbackOgImage;

  return {
    title,
    description,
    alternates: { canonical: absoluteCanonical },
    openGraph: {
      title,
      description,
      type: "website",
      url: share.url,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${share.title} on Gumboot`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <JobDetailsClient id={id} />;
}
