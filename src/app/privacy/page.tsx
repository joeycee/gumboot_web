"use client";

import { ContentView } from "@/components/ContentView";
import { fetchPrivacyPage, getCmsHtml } from "@/lib/content";

export default function PrivacyPage() {
  return (
    <ContentView
      title="Privacy Policy"
      subtitle="Privacy policy content pulled from the backend CMS."
      loadContent={async () => getCmsHtml((await fetchPrivacyPage()).body)}
    />
  );
}
