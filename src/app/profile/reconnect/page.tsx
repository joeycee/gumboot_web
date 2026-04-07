"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { deleteJobInterest, getReconnectList, updateJobInterest, type JobInterestItem } from "@/lib/interests";
import { resolveUserImageUrl } from "@/lib/messages";
import { buildPublicProfileHref } from "@/lib/publicProfiles";

const styles = `
  .re-root * { box-sizing: border-box; }
  .re-root {
    min-height: calc(100vh - 56px);
    padding: 28px 16px 72px;
    background:
      radial-gradient(880px 520px at 10% 0%, rgba(91,110,127,0.18), rgba(0,0,0,0) 58%),
      linear-gradient(180deg, #2A3439, #20282c);
    color: #E5E5E5;
    font-family: 'DM Sans', sans-serif;
  }
  .re-shell { max-width: 960px; margin: 0 auto; display: grid; gap: 16px; }
  .re-card {
    border: 1px solid rgba(229,229,229,0.10);
    border-radius: 18px;
    background: rgba(62,74,81,0.82);
    box-shadow: 0 18px 50px rgba(0,0,0,0.28);
    backdrop-filter: blur(10px);
    padding: 22px;
  }
  .re-title {
    margin: 0;
    font-family: 'DM Serif Display', serif;
    font-size: 32px;
    font-weight: 400;
  }
  .re-sub {
    margin-top: 10px;
    color: rgba(229,229,229,0.62);
    line-height: 1.6;
  }
  .re-list { display: grid; gap: 12px; }
  .re-item {
    display: grid;
    gap: 12px;
    grid-template-columns: 56px 1fr auto;
    align-items: center;
    border: 1px solid rgba(229,229,229,0.10);
    border-radius: 14px;
    background: rgba(42,52,57,0.52);
    padding: 14px;
  }
  .re-avatar {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    overflow: hidden;
    background: rgba(229,229,229,0.08);
  }
  .re-avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .re-name { font-size: 15px; font-weight: 600; }
  .re-bio { margin-top: 6px; color: rgba(229,229,229,0.60); line-height: 1.5; font-size: 13px; }
  .re-actions { display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end; }
  .re-btn, .re-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    padding: 10px 12px;
    font: inherit;
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    text-decoration: none;
    cursor: pointer;
    border: 1px solid rgba(229,229,229,0.12);
    background: rgba(229,229,229,0.08);
    color: #E5E5E5;
  }
  .re-status {
    border-radius: 12px;
    padding: 12px 14px;
    font-size: 13px;
    line-height: 1.6;
  }
  .re-status.error {
    border: 1px solid rgba(183,91,91,0.38);
    background: rgba(183,91,91,0.14);
    color: rgba(255,220,220,0.92);
  }
`;

export default function ReconnectPage() {
  const [items, setItems] = useState<JobInterestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const response = await getReconnectList();
      setItems(Array.isArray(response.body) ? response.body : []);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to load reconnect list.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function toggleStatus(item: JobInterestItem) {
    try {
      await updateJobInterest({
        jobinterestId: item._id ?? "",
        status: String(item.status ?? "1") === "1" ? 0 : 1,
        type: item.type ?? 1,
      });
      await load();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to update reconnect preference.");
    }
  }

  async function remove(item: JobInterestItem) {
    try {
      await deleteJobInterest(item._id ?? "");
      await load();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to remove reconnect preference.");
    }
  }

  return (
    <>
      <style>{styles}</style>
      <div className="re-root">
        <div className="re-shell">
          <section className="re-card">
            <h1 className="re-title">Reconnect workers</h1>
            <p className="re-sub">This list comes from the backend job-interest endpoints so you can keep or remove workers you want to hire again.</p>
          </section>
          {error ? <div className="re-status error">{error}</div> : null}
          <section className="re-card">
            <div className="re-list">
              {loading ? <div>Loading reconnects…</div> : null}
              {!loading && items.length === 0 ? <div>No saved workers yet.</div> : null}
              {items.map((item) => {
                const worker = item.workerId;
                const enabled = String(item.status ?? "1") === "1";
                return (
                  <article className="re-item" key={item._id}>
                    <div className="re-avatar">
                      {worker?.image ? <img alt={worker.firstname || "Worker"} src={resolveUserImageUrl(worker.image)} /> : null}
                    </div>
                    <div>
                      <div className="re-name">{[worker?.firstname, worker?.lastname].filter(Boolean).join(" ") || "Worker"}</div>
                      <div className="re-bio">{worker?.bio?.trim() || "No bio available."}</div>
                    </div>
                    <div className="re-actions">
                      {worker?._id ? <Link className="re-link" href={buildPublicProfileHref({ userId: worker._id })}>Profile</Link> : null}
                      <button className="re-btn" onClick={() => toggleStatus(item)} type="button">
                        {enabled ? "Pause" : "Resume"}
                      </button>
                      <button className="re-btn" onClick={() => remove(item)} type="button">
                        Remove
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
