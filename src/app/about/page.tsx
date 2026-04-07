"use client";

import { ContentView } from "@/components/ContentView";
import { fetchAboutPage, getCmsHtml } from "@/lib/content";

export default function AboutPage() {
  return (
    <ContentView
      title="About Gumboot"
      subtitle="Company information pulled from the backend CMS."
      loadContent={async () => getCmsHtml((await fetchAboutPage()).body)}
    />
  );
}
