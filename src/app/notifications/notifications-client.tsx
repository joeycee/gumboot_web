"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError } from "@/lib/api";
import { resolveUserImageUrl } from "@/lib/messages";
import {
  getNotificationJobId,
  getNotificationReadState,
  getNotificationSenderId,
  getNotifications,
  normalizeNotifications,
  readNotifications,
  updateNotificationStatus,
  type NotificationItem,
} from "@/lib/notifications";
import { buildPublicProfileHref } from "@/lib/publicProfiles";
import { useMe } from "@/lib/useMe";

const styles = `
  .noti-root * { box-sizing: border-box; }
  .noti-root {
    min-height: calc(100vh - 56px);
    padding: 28px 16px 72px;
    background:
      radial-gradient(880px 520px at 10% 0%, rgba(91,110,127,0.18), rgba(0,0,0,0) 58%),
      linear-gradient(180deg, #2A3439, #20282c);
    color: #E5E5E5;
    font-family: 'DM Sans', sans-serif;
  }
  .noti-shell { max-width: 900px; margin: 0 auto; display: grid; gap: 16px; }
  .noti-card {
    border: 1px solid rgba(229,229,229,0.10);
    border-radius: 18px;
    background: rgba(62,74,81,0.82);
    box-shadow: 0 18px 50px rgba(0,0,0,0.28);
    backdrop-filter: blur(10px);
    overflow: hidden;
  }
  .noti-head {
    padding: 20px;
    border-bottom: 1px solid rgba(229,229,229,0.08);
    display: flex;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
    align-items: end;
  }
  .noti-kicker {
    margin: 0 0 6px;
    font-size: 10px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: rgba(229,229,229,0.40);
  }
  .noti-title {
    margin: 0;
    font-family: 'DM Serif Display', serif;
    font-size: 30px;
    font-weight: 400;
  }
  .noti-sub {
    margin: 8px 0 0;
    color: rgba(229,229,229,0.54);
    font-size: 13px;
    line-height: 1.6;
  }
  .noti-actions { display: flex; gap: 10px; flex-wrap: wrap; }
  .noti-btn {
    border: 1px solid rgba(229,229,229,0.12);
    border-radius: 12px;
    background: rgba(229,229,229,0.06);
    color: #E5E5E5;
    padding: 10px 14px;
    font: inherit;
    font-size: 12px;
    cursor: pointer;
  }
  .noti-list { display: grid; }
  .noti-row {
    display: grid;
    grid-template-columns: 52px minmax(0, 1fr) auto;
    gap: 12px;
    padding: 16px 20px;
    border-top: 1px solid rgba(229,229,229,0.08);
    text-decoration: none;
    color: inherit;
    background: transparent;
    transition: background 0.14s ease;
  }
  .noti-row:hover { background: rgba(229,229,229,0.04); }
  .noti-row.unread { background: rgba(38,166,154,0.08); }
  .noti-avatar {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    overflow: hidden;
    border: 1px solid rgba(229,229,229,0.10);
    background: linear-gradient(135deg, #3E4A51, #5B6E7F);
    display: grid;
    place-items: center;
  }
  .noti-avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .noti-fallback { font-size: 16px; font-weight: 700; color: rgba(229,229,229,0.78); }
  .noti-name { font-size: 14px; font-weight: 600; color: #E5E5E5; }
  .noti-msg { margin-top: 4px; font-size: 13px; line-height: 1.65; color: rgba(229,229,229,0.68); }
  .noti-meta { margin-top: 8px; display: flex; gap: 8px; flex-wrap: wrap; }
  .noti-pill {
    display: inline-flex;
    align-items: center;
    min-height: 26px;
    padding: 0 10px;
    border-radius: 999px;
    border: 1px solid rgba(229,229,229,0.08);
    background: rgba(229,229,229,0.05);
    font-size: 11px;
    color: rgba(229,229,229,0.58);
  }
  .noti-time { font-size: 11px; color: rgba(229,229,229,0.36); white-space: nowrap; }
  .noti-empty, .noti-error, .noti-loading {
    padding: 22px 20px;
    color: rgba(229,229,229,0.58);
    font-size: 13px;
    line-height: 1.7;
  }
  .noti-error { color: rgba(255,220,220,0.92); }
`;

function formatTime(value?: string) {
  if (!value) return "Recently";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function getInitials(item?: NotificationItem | null) {
  const first = item?.notification?.sender?.firstname?.trim() ?? "";
  const last = item?.notification?.sender?.lastname?.trim() ?? "";
  return `${first[0] ?? ""}${last[0] ?? ""}`.trim().toUpperCase() || "GB";
}

function getNotificationHref(item: NotificationItem) {
  const jobId = getNotificationJobId(item);
  if (jobId) return `/jobs/${jobId}`;

  const senderId = getNotificationSenderId(item);
  if (senderId) {
    return buildPublicProfileHref({
      userId: senderId,
      kind: "worker",
    });
  }

  return "/notifications";
}

export default function NotificationsClient() {
  const router = useRouter();
  const { user, loading: meLoading } = useMe();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const me = user as { _id?: string } | null;

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getNotifications();
      setItems(normalizeNotifications(response));
    } catch (nextError) {
      if (nextError instanceof ApiError && (nextError.status === 401 || nextError.status === 403)) {
        router.replace("/auth/login");
        return;
      }
      setError(nextError instanceof Error ? nextError.message : "Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (meLoading) return;
    if (!me?._id) {
      router.replace("/auth/login");
      return;
    }
    loadNotifications();
    readNotifications().catch(() => undefined);
  }, [loadNotifications, me?._id, meLoading, router]);

  async function handleToggleNotifications() {
    const next = !notificationsEnabled;
    setNotificationsEnabled(next);
    try {
      await updateNotificationStatus(next);
    } catch {
      setNotificationsEnabled(!next);
    }
  }

  const unreadCount = useMemo(
    () => items.filter((item) => !getNotificationReadState(item)).length,
    [items]
  );

  return (
    <>
      <style>{styles}</style>
      <div className="noti-root">
        <div className="noti-shell">
          <section className="noti-card">
            <div className="noti-head">
              <div>
                <p className="noti-kicker">Notifications</p>
                <h1 className="noti-title">Inbox updates</h1>
                <p className="noti-sub">
                  Application updates, job status changes, and related activity from your Gumboot account.
                </p>
              </div>
              <div className="noti-actions">
                <button className="noti-btn" type="button" onClick={handleToggleNotifications}>
                  {notificationsEnabled ? "Turn notifications off" : "Turn notifications on"}
                </button>
                <button className="noti-btn" type="button" onClick={loadNotifications}>
                  Refresh
                </button>
              </div>
            </div>

            {loading ? <div className="noti-loading">Loading notifications…</div> : null}
            {!loading && error ? <div className="noti-error">{error}</div> : null}
            {!loading && !error && items.length === 0 ? (
              <div className="noti-empty">No notifications yet.</div>
            ) : null}

            {!loading && !error && items.length > 0 ? (
              <div className="noti-list">
                {items.map((item, index) => {
                  const sender = item.notification?.sender;
                  const senderName =
                    [sender?.firstname, sender?.lastname].filter(Boolean).join(" ").trim() || "Gumboot";
                  const senderAvatar = resolveUserImageUrl(sender?.image);
                  const href = getNotificationHref(item);
                  const unread = !getNotificationReadState(item);

                  return (
                    <Link className={`noti-row${unread ? " unread" : ""}`} href={href} key={item.notification?._id ?? `${href}-${index}`}>
                      <div className="noti-avatar" aria-hidden="true">
                        {senderAvatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={senderAvatar} alt={senderName} />
                        ) : (
                          <span className="noti-fallback">{getInitials(item)}</span>
                        )}
                      </div>
                      <div>
                        <div className="noti-name">{senderName}</div>
                        <div className="noti-msg">{item.notification?.message?.trim() || "Notification update"}</div>
                        <div className="noti-meta">
                          {getNotificationJobId(item) ? <span className="noti-pill">Job update</span> : null}
                          {unread ? <span className="noti-pill">Unread</span> : <span className="noti-pill">Read</span>}
                        </div>
                      </div>
                      <div className="noti-time">{formatTime(item.notification?.createdAt)}</div>
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </section>

          {!loading && !error ? (
            <div style={{ color: "rgba(229,229,229,0.54)", fontSize: 12 }}>
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"} in this list.` : "Everything is caught up."}
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
