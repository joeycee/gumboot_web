"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError } from "@/lib/api";
import { resolveUserImageUrl } from "@/lib/messages";
import {
  getNotificationHref,
  getNotificationJobId,
  getNotificationReadState,
  getNotificationJobStatusLabel,
  getNotificationTypeLabel,
  getNotifications,
  normalizeNotifications,
  resolveNotificationHref,
  updateNotificationRadius,
  updateNotificationStatus,
  type NotificationItem,
} from "@/lib/notifications";
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
  .noti-settings {
    padding: 20px;
    border-bottom: 1px solid rgba(229,229,229,0.08);
    display: grid;
    gap: 14px;
  }
  .noti-settings-grid {
    display: grid;
    gap: 12px;
  }
  .noti-setting-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  .noti-setting-label {
    font-size: 13px;
    font-weight: 600;
    color: #E5E5E5;
  }
  .noti-setting-note {
    margin-top: 4px;
    font-size: 12px;
    line-height: 1.6;
    color: rgba(229,229,229,0.54);
  }
  .noti-toggle {
    position: relative;
    width: 48px;
    height: 28px;
    border-radius: 999px;
    border: 1px solid rgba(229,229,229,0.12);
    background: rgba(229,229,229,0.08);
    cursor: pointer;
    flex-shrink: 0;
  }
  .noti-toggle[data-enabled="true"] {
    background: rgba(38,166,154,0.20);
    border-color: rgba(38,166,154,0.32);
  }
  .noti-toggle::after {
    content: "";
    position: absolute;
    top: 3px;
    left: 3px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #fff;
    transition: transform 0.15s ease;
  }
  .noti-toggle[data-enabled="true"]::after {
    transform: translateX(20px);
  }
  .noti-radius-wrap {
    display: grid;
    gap: 10px;
  }
  .noti-radius-input {
    width: 100%;
  }
  .noti-status {
    border-radius: 12px;
    border: 1px solid rgba(229,229,229,0.08);
    background: rgba(229,229,229,0.05);
    padding: 12px 14px;
    font-size: 12px;
    line-height: 1.6;
    color: rgba(229,229,229,0.7);
  }
  .noti-status.error {
    border-color: rgba(183,91,91,0.35);
    background: rgba(183,91,91,0.12);
    color: rgba(255,214,214,0.92);
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

export default function NotificationsClient() {
  const router = useRouter();
  const { user, raw, loading: meLoading, refresh } = useMe();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notificationRadius, setNotificationRadius] = useState("50");
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsStatus, setSettingsStatus] = useState<string | null>(null);

  const me = user as {
    _id?: string;
    notification_status?: number | string;
    radius?: number | string;
    latitude?: number | string;
    longitude?: number | string;
    address?: string;
    location?: { coordinates?: [number, number] };
  } | null;

  useEffect(() => {
    const source = (me ?? raw ?? null) as {
      notification_status?: number | string;
      radius?: number | string;
    } | null;
    setNotificationsEnabled(String(source?.notification_status ?? "1") !== "0");
    setNotificationRadius(String(source?.radius ?? "50"));
  }, [me, raw]);

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
  }, [loadNotifications, me?._id, meLoading, router]);

  async function handleToggleNotifications() {
    const next = !notificationsEnabled;
    setNotificationsEnabled(next);
    setSettingsStatus(null);
    try {
      await updateNotificationStatus(next);
      await refresh();
      setSettingsStatus(next ? "Notifications enabled." : "Notifications paused.");
    } catch {
      setNotificationsEnabled(!next);
      setSettingsStatus("Unable to update notification settings.");
    }
  }

  function getStoredCoordinates() {
    const source = (me ?? raw ?? null) as {
      latitude?: number | string;
      longitude?: number | string;
      address?: string;
      location?: { coordinates?: [number, number] };
    } | null;
    const latitude = Number(source?.latitude ?? source?.location?.coordinates?.[1]);
    const longitude = Number(source?.longitude ?? source?.location?.coordinates?.[0]);
    return {
      latitude: Number.isFinite(latitude) ? latitude : null,
      longitude: Number.isFinite(longitude) ? longitude : null,
      address: source?.address ?? "",
    };
  }

  async function resolveCoordinates(): Promise<{ latitude: number; longitude: number; address: string }> {
    const stored = getStoredCoordinates();
    if (stored.latitude != null && stored.longitude != null) {
      return {
        latitude: stored.latitude,
        longitude: stored.longitude,
        address: stored.address,
      };
    }

    if (typeof window === "undefined" || !navigator.geolocation) {
      throw new Error("No saved location found and browser geolocation is unavailable.");
    }

    const coords = await new Promise<{ latitude: number; longitude: number }>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        () => reject(new Error("Location permission was denied. Allow location access to save a radius.")),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });

    return { ...coords, address: stored.address };
  }

  async function handleSaveRadius() {
    const radius = Number(notificationRadius);
    if (!Number.isFinite(radius) || radius <= 0) {
      setSettingsStatus("Radius must be greater than 0 km.");
      return;
    }

    setSettingsSaving(true);
    setSettingsStatus(null);
    try {
      const coords = await resolveCoordinates();
      await updateNotificationRadius({
        latitude: coords.latitude,
        longitude: coords.longitude,
        radius,
        address: coords.address,
      });
      await refresh();
      setSettingsStatus(`Notification radius saved at ${radius} km.`);
    } catch (nextError) {
      setSettingsStatus(nextError instanceof Error ? nextError.message : "Unable to save notification radius.");
    } finally {
      setSettingsSaving(false);
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
                <button className="noti-btn" type="button" onClick={loadNotifications}>
                  Refresh
                </button>
              </div>
            </div>

            <div className="noti-settings">
              <div>
                <div className="noti-setting-label">Notification settings</div>
                <div className="noti-setting-note">
                  Manage push alerts and how far from your saved location Gumboot should notify you about nearby jobs.
                </div>
              </div>
              <div className="noti-settings-grid">
                <div className="noti-setting-row">
                  <div>
                    <div className="noti-setting-label">Push alerts</div>
                    <div className="noti-setting-note">
                      {notificationsEnabled ? "You will receive alerts for nearby jobs." : "Notifications are currently paused."}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="noti-toggle"
                    data-enabled={notificationsEnabled ? "true" : "false"}
                    onClick={handleToggleNotifications}
                    aria-label={notificationsEnabled ? "Disable notifications" : "Enable notifications"}
                  />
                </div>
                <div className="noti-radius-wrap">
                  <div>
                    <div className="noti-setting-label">Notification radius</div>
                    <div className="noti-setting-note">{notificationRadius || "50"} km from your saved location</div>
                  </div>
                  <input
                    className="noti-radius-input"
                    type="range"
                    min="1"
                    max="200"
                    step="1"
                    value={notificationRadius}
                    onChange={(event) => setNotificationRadius(event.target.value)}
                  />
                  <div className="noti-actions">
                    <button className="noti-btn" type="button" onClick={handleSaveRadius} disabled={settingsSaving}>
                      {settingsSaving ? "Saving…" : "Save radius"}
                    </button>
                  </div>
                </div>
                {settingsStatus ? (
                  <div className={`noti-status${settingsStatus.toLowerCase().includes("unable") || settingsStatus.toLowerCase().includes("denied") || settingsStatus.toLowerCase().includes("must") ? " error" : ""}`}>
                    {settingsStatus}
                  </div>
                ) : null}
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
                  const typeLabel = getNotificationTypeLabel(item);
                  const statusLabel = getNotificationJobStatusLabel(item);

                  return (
                    <Link
                      className={`noti-row${unread ? " unread" : ""}`}
                      href={href}
                      key={item.notification?._id ?? `${href}-${index}`}
                      onClick={async (event) => {
                        event.preventDefault();
                        const nextHref = await resolveNotificationHref(item);
                        router.push(nextHref);
                      }}
                    >
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
                          {typeLabel ? <span className="noti-pill">{typeLabel}</span> : null}
                          {getNotificationJobId(item) ? <span className="noti-pill">Job update</span> : null}
                          {statusLabel ? <span className="noti-pill">{statusLabel}</span> : null}
                          {unread ? <span className="noti-pill">Unread</span> : null}
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
