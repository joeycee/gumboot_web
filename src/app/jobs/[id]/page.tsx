import type { Metadata } from "next";
import { fetchJobShareData } from "@/lib/jobShare";
import JobDetailsClient from "./job-details-client";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const share = await fetchJobShareData(id);
  const ogImagePath = `/jobs/${encodeURIComponent(id)}/opengraph-image`;
  const canonical = `/jobs/${encodeURIComponent(id)}`;

  if (!share) {
    return {
      title: "Job | Gumboot",
      description: "Browse this job on Gumboot.",
      alternates: { canonical },
      openGraph: {
        title: "Job | Gumboot",
        description: "Browse this job on Gumboot.",
        type: "article",
        url: canonical,
        images: [{ url: ogImagePath, width: 1200, height: 630, alt: "Gumboot job preview" }],
      },
      twitter: {
        card: "summary_large_image",
        title: "Job | Gumboot",
        description: "Browse this job on Gumboot.",
        images: [ogImagePath],
      },
    };
  }

  const title = `${share.title} | Gumboot`;

  return {
    title,
    description: share.shareDescription,
    alternates: { canonical },
    openGraph: {
      title,
      description: share.shareDescription,
      type: "article",
      url: canonical,
      images: [
        {
          url: ogImagePath,
          width: 1200,
          height: 630,
          alt: `${share.title} on Gumboot`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: share.shareDescription,
      images: [ogImagePath],
    },
  };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <JobDetailsClient id={id} />;
}
