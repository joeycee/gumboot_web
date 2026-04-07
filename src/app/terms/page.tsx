"use client";

import { ContentView } from "@/components/ContentView";
import { fetchTermsPage, getCmsHtml } from "@/lib/content";

export default function TermsPage() {
  return (
    <ContentView
      title="Terms and Conditions"
      subtitle="Terms content pulled from the backend CMS."
      loadContent={async () => getCmsHtml((await fetchTermsPage()).body)}
    />
  );
}
