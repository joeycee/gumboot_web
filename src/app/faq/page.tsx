"use client";

import { FaqView } from "@/components/ContentView";
import { fetchFaqs } from "@/lib/content";

export default function FaqPage() {
  return (
    <FaqView
      title="Frequently Asked Questions"
      subtitle="Answers coming from the backend FAQ listing."
      loadFaqs={async () => (await fetchFaqs()).body ?? []}
    />
  );
}
