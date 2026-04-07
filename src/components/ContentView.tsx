"use client";

import { useEffect, useState } from "react";
import type { FaqItem } from "@/lib/content";

const styles = `
  .cv-root * { box-sizing: border-box; }
  .cv-root {
    min-height: calc(100vh - 56px);
    padding: 32px 16px 72px;
    background:
      radial-gradient(900px 520px at 10% 0%, rgba(91,110,127,0.18), rgba(0,0,0,0) 58%),
      linear-gradient(180deg, #2A3439, #20282c);
    color: #E5E5E5;
    font-family: 'DM Sans', sans-serif;
  }
  .cv-shell { max-width: 920px; margin: 0 auto; display: grid; gap: 16px; }
  .cv-card {
    border: 1px solid rgba(229,229,229,0.10);
    border-radius: 18px;
    background: rgba(62,74,81,0.82);
    box-shadow: 0 18px 50px rgba(0,0,0,0.28);
    backdrop-filter: blur(10px);
    padding: 24px;
  }
  .cv-title {
    margin: 0;
    font-family: 'DM Serif Display', serif;
    font-size: 34px;
    line-height: 1.05;
    font-weight: 400;
  }
  .cv-sub {
    margin: 10px 0 0;
    color: rgba(229,229,229,0.62);
    line-height: 1.6;
  }
  .cv-content {
    color: rgba(229,229,229,0.76);
    line-height: 1.9;
    white-space: pre-wrap;
    font-size: 14px;
  }
  .cv-faq-list { display: grid; gap: 12px; }
  .cv-faq-item {
    border: 1px solid rgba(229,229,229,0.10);
    border-radius: 14px;
    background: rgba(42,52,57,0.52);
    padding: 16px;
  }
  .cv-faq-question {
    font-size: 15px;
    font-weight: 600;
    color: #F0F0F0;
  }
  .cv-faq-answer {
    margin-top: 8px;
    color: rgba(229,229,229,0.66);
    line-height: 1.7;
  }
`;

function stripHtml(value: string) {
  if (typeof window === "undefined") {
    return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }
  const parser = new DOMParser();
  const parsed = parser.parseFromString(value, "text/html");
  parsed.querySelectorAll("script,style").forEach((node) => node.remove());
  return parsed.body.textContent?.replace(/\s+\n/g, "\n").trim() ?? "";
}

export function ContentView({
  title,
  subtitle,
  loadContent,
}: {
  title: string;
  subtitle: string;
  loadContent: () => Promise<string>;
}) {
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const next = await loadContent();
        if (!cancelled) setContent(stripHtml(next));
      } catch (nextError) {
        if (!cancelled) {
          setError(nextError instanceof Error ? nextError.message : "Unable to load content.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadContent]);

  return (
    <>
      <style>{styles}</style>
      <div className="cv-root">
        <div className="cv-shell">
          <section className="cv-card">
            <h1 className="cv-title">{title}</h1>
            <p className="cv-sub">{subtitle}</p>
          </section>
          <section className="cv-card">
            {error ? <div className="cv-content">{error}</div> : <div className="cv-content">{content || "Loading…"}</div>}
          </section>
        </div>
      </div>
    </>
  );
}

export function FaqView({
  title,
  subtitle,
  loadFaqs,
}: {
  title: string;
  subtitle: string;
  loadFaqs: () => Promise<FaqItem[]>;
}) {
  const [items, setItems] = useState<FaqItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const next = await loadFaqs();
        if (!cancelled) setItems(next);
      } catch (nextError) {
        if (!cancelled) setError(nextError instanceof Error ? nextError.message : "Unable to load FAQs.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadFaqs]);

  return (
    <>
      <style>{styles}</style>
      <div className="cv-root">
        <div className="cv-shell">
          <section className="cv-card">
            <h1 className="cv-title">{title}</h1>
            <p className="cv-sub">{subtitle}</p>
          </section>
          <section className="cv-card">
            {error ? <div className="cv-content">{error}</div> : null}
            {!error && items.length === 0 ? <div className="cv-content">Loading…</div> : null}
            <div className="cv-faq-list">
              {items.map((item) => (
                <article className="cv-faq-item" key={item._id}>
                  <div className="cv-faq-question">{item.question || item.title || "Question"}</div>
                  <div className="cv-faq-answer">{stripHtml(item.answer || item.description || "")}</div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
