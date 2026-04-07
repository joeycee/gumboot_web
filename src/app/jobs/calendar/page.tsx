"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import {
  normalizeAppliedCalendarEvents,
  normalizePostedCalendarEvents,
  type CalendarEvent,
  type CalendarScope,
} from "@/lib/calendar";
import { useMe } from "@/lib/useMe";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Serif+Display&display=swap');

  .jc-root * { box-sizing: border-box; margin: 0; padding: 0; }

  .jc-root {
    height: calc(100dvh - 56px);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    font-family: 'DM Sans', sans-serif;
    color: #E5E5E5;
    background: #161C20;
  }

  /* ── TOP BAR ─────────────────────────────────────────── */
  .jc-topbar {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px;
    height: 58px;
    border-bottom: 1px solid rgba(255,255,255,0.07);
    background: rgba(22,28,32,0.96);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    gap: 16px;
  }

  .jc-topbar-left {
    display: flex;
    align-items: baseline;
    gap: 10px;
  }

  .jc-topbar-title {
    font-family: 'DM Serif Display', serif;
    font-size: 20px;
    font-weight: 400;
    color: #F4F4F4;
    line-height: 1;
  }

  .jc-topbar-sub {
    font-size: 12px;
    color: rgba(229,229,229,0.36);
    letter-spacing: 0.01em;
  }

  .jc-toggle {
    display: inline-flex;
    padding: 3px;
    border-radius: 999px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.09);
    gap: 2px;
  }

  .jc-toggle-btn {
    border: none;
    background: transparent;
    color: rgba(229,229,229,0.46);
    padding: 7px 16px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.10em;
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.15s ease;
    font-family: 'DM Sans', sans-serif;
  }

  .jc-toggle-btn.active {
    color: #fff;
    background: linear-gradient(135deg, #26A69A 0%, #1a7a6e 100%);
    box-shadow: 0 4px 14px rgba(38,166,154,0.28);
  }

  /* ── MAIN BODY ───────────────────────────────────────── */
  .jc-body {
    flex: 1 1 0;
    min-height: 0;
    display: grid;
    grid-template-columns: 300px 1fr;
  }

  /* ── SIDEBAR ─────────────────────────────────────────── */
  .jc-sidebar {
    border-right: 1px solid rgba(255,255,255,0.07);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: rgba(18,23,27,0.70);
  }

  .jc-sidebar-head {
    flex: 0 0 auto;
    padding: 18px 18px 14px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }

  .jc-sidebar-date {
    font-family: 'DM Serif Display', serif;
    font-size: 22px;
    font-weight: 400;
    color: #F4F4F4;
    line-height: 1.1;
  }

  .jc-sidebar-scope {
    margin-top: 5px;
    font-size: 11px;
    color: rgba(229,229,229,0.38);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .jc-sidebar-body {
    flex: 1 1 0;
    overflow-y: auto;
    padding: 14px 14px 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    scrollbar-width: thin;
    scrollbar-color: rgba(255,255,255,0.12) transparent;
  }

  .jc-sidebar-body::-webkit-scrollbar { width: 4px; }
  .jc-sidebar-body::-webkit-scrollbar-track { background: transparent; }
  .jc-sidebar-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 99px; }

  .jc-card {
    display: block;
    text-decoration: none;
    color: inherit;
    padding: 14px 16px;
    border-radius: 14px;
    border: 1px solid rgba(255,255,255,0.09);
    background: rgba(255,255,255,0.04);
    transition: all 0.15s ease;
  }

  .jc-card:hover {
    transform: translateY(-1px);
    border-color: rgba(38,166,154,0.30);
    background: rgba(38,166,154,0.07);
  }

  .jc-card-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 10px;
  }

  .jc-card-title {
    font-size: 14px;
    font-weight: 600;
    color: #F0F0F0;
    line-height: 1.35;
  }

  .jc-card-type {
    margin-top: 3px;
    font-size: 10px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(229,229,229,0.32);
  }

  .jc-badge {
    flex-shrink: 0;
    padding: 4px 8px;
    border-radius: 999px;
    background: rgba(38,166,154,0.14);
    border: 1px solid rgba(38,166,154,0.26);
    color: #7DD6CB;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .jc-card-row {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
  }

  .jc-card-field { flex: 1 1 80px; }

  .jc-card-label {
    margin-bottom: 2px;
    font-size: 9px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgba(229,229,229,0.28);
  }

  .jc-card-value {
    font-size: 12px;
    color: rgba(229,229,229,0.68);
    line-height: 1.4;
  }

  .jc-empty {
    margin: auto;
    padding: 28px 16px;
    text-align: center;
    border-radius: 14px;
    border: 1px dashed rgba(255,255,255,0.10);
    color: rgba(229,229,229,0.36);
    font-size: 13px;
    background: rgba(255,255,255,0.02);
  }

  .jc-status {
    margin: 12px;
    border-radius: 12px;
    padding: 11px 14px;
    font-size: 12px;
    line-height: 1.6;
    border: 1px solid rgba(229,229,229,0.10);
    background: rgba(30,37,41,0.54);
    color: rgba(229,229,229,0.68);
  }

  .jc-status.error {
    border-color: rgba(183,91,91,0.35);
    background: rgba(183,91,91,0.12);
    color: rgba(255,214,214,0.92);
  }

  .jc-login-link { color: #7DD6CB; text-decoration: none; }

  /* ── CALENDAR PANEL ──────────────────────────────────── */
  .jc-cal-panel {
    display: flex;
    flex-direction: column;
    padding: 20px 22px 16px;
    overflow: hidden;
  }

  .jc-cal-head {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
  }

  .jc-month-title {
    font-family: 'DM Serif Display', serif;
    font-size: 26px;
    font-weight: 400;
    color: #F4F4F4;
    line-height: 1;
  }

  .jc-month-meta {
    margin-top: 4px;
    font-size: 11px;
    color: rgba(229,229,229,0.38);
  }

  .jc-nav {
    display: inline-flex;
    gap: 6px;
  }

  .jc-nav-btn {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.10);
    background: rgba(255,255,255,0.04);
    color: #E5E5E5;
    cursor: pointer;
    font-size: 15px;
    transition: all 0.14s ease;
    font-family: 'DM Sans', sans-serif;
  }

  .jc-nav-btn:hover {
    background: rgba(255,255,255,0.09);
    border-color: rgba(255,255,255,0.20);
    transform: translateY(-1px);
  }

  /* Calendar grid — fills remaining space exactly */
  .jc-cal-grid-wrap {
    flex: 1 1 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .jc-weekdays {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 6px;
    margin-bottom: 6px;
  }

  .jc-weekday {
    padding: 0 4px;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: rgba(229,229,229,0.28);
  }

  .jc-grid {
    flex: 1 1 0;
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    grid-template-rows: repeat(6, minmax(0, 1fr));
    gap: 6px;
    min-height: 0;
  }

  .jc-day {
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,0.07);
    background: rgba(255,255,255,0.025);
    padding: 8px 9px;
    text-align: left;
    cursor: pointer;
    transition: all 0.14s ease;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-height: 0;
  }

  .jc-day:hover {
    border-color: rgba(255,255,255,0.14);
    background: rgba(255,255,255,0.055);
    transform: translateY(-1px);
  }

  .jc-day.muted {
    opacity: 0.30;
  }

  .jc-day.selected {
    border-color: rgba(38,166,154,0.50);
    background: rgba(38,166,154,0.10);
    box-shadow: inset 0 0 0 1px rgba(38,166,154,0.20);
  }

  .jc-day.today .jc-day-number {
    color: #26A69A;
  }

  .jc-day-number {
    font-size: 12px;
    font-weight: 700;
    color: #D0D0D0;
    line-height: 1;
    flex-shrink: 0;
  }

  .jc-dot-row {
    display: flex;
    flex-wrap: wrap;
    gap: 3px;
    flex-shrink: 0;
  }

  .jc-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #26A69A;
    opacity: 0.80;
  }

  .jc-day-pill {
    display: block;
    width: 100%;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    font-size: 9px;
    color: rgba(229,229,229,0.55);
    line-height: 1.3;
    flex-shrink: 0;
  }

  /* ── RESPONSIVE ──────────────────────────────────────── */
  @media (max-width: 860px) {
    .jc-body {
      grid-template-columns: 240px 1fr;
    }
  }

  @media (max-width: 640px) {
    .jc-body {
      grid-template-columns: 1fr;
      grid-template-rows: 1fr 1fr;
    }
    .jc-sidebar {
      border-right: none;
      border-bottom: 1px solid rgba(255,255,255,0.07);
    }
  }
`;

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const DISPLAY_DATE = new Intl.DateTimeFormat("en-NZ", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

const MONTH_FORMAT = new Intl.DateTimeFormat("en-NZ", {
  month: "long",
  year: "numeric",
});

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(dateKey: string | null) {
  if (!dateKey) return "Select a date";
  const date = new Date(`${dateKey}T12:00:00`);
  return Number.isNaN(date.getTime()) ? dateKey : DISPLAY_DATE.format(date);
}

function buildCalendarDays(monthDate: Date) {
  const monthStart = startOfMonth(monthDate);
  const firstGridDate = new Date(monthStart);
  firstGridDate.setDate(monthStart.getDate() - monthStart.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const cellDate = new Date(firstGridDate);
    cellDate.setDate(firstGridDate.getDate() + index);
    return {
      date: cellDate,
      dateKey: formatDateKey(cellDate),
      inMonth: cellDate.getMonth() === monthDate.getMonth(),
    };
  });
}

function getSelectedDateFallback(events: CalendarEvent[], monthDate: Date, currentDateKey: string) {
  if (events.some((e) => e.dateKey === currentDateKey)) return currentDateKey;
  const prefix = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}-`;
  const hit = events.find((e) => e.dateKey?.startsWith(prefix));
  return hit?.dateKey ?? currentDateKey;
}

export default function JobsCalendarPage() {
  const { user, loading: loadingMe } = useMe();
  const hasUser = Boolean(user);
  const [scope, setScope] = useState<CalendarScope>("posted");
  const [monthDate, setMonthDate] = useState(() => startOfMonth(new Date()));
  const [selectedDateKey, setSelectedDateKey] = useState(() => formatDateKey(new Date()));
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loadingMe) return;
    if (!hasUser) { setError(null); setLoading(false); setEvents([]); return; }

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const payload =
          scope === "posted"
            ? await api<unknown>("/user_job_listing?page=1&perPage=200")
            : await api<unknown>("/my_requested_jobs", {
                method: "POST",
                body: { page: 1, perPage: 200, search: "" },
              });

        const normalized =
          scope === "posted"
            ? normalizePostedCalendarEvents(payload)
            : normalizeAppliedCalendarEvents(payload);

        if (!cancelled) setEvents(normalized);
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : "Failed to load calendar jobs.";
        const isEmpty = message.includes("No job requests found") || message.includes("No jobs found for your request.");
        if (!cancelled) {
          if (isEmpty) { setEvents([]); setError(null); }
          else setError(message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [hasUser, loadingMe, scope, user]);

  useEffect(() => {
    setSelectedDateKey((cur) => getSelectedDateFallback(events, monthDate, cur));
  }, [events, monthDate]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of events) {
      if (!e.dateKey) continue;
      const list = map.get(e.dateKey) ?? [];
      list.push(e);
      map.set(e.dateKey, list);
    }
    return map;
  }, [events]);

  const monthDays = useMemo(() => buildCalendarDays(monthDate), [monthDate]);
  const selectedEvents = useMemo(
    () => (selectedDateKey ? eventsByDate.get(selectedDateKey) ?? [] : []),
    [eventsByDate, selectedDateKey]
  );
  const monthLabel = useMemo(() => MONTH_FORMAT.format(monthDate), [monthDate]);
  const monthCount = useMemo(() => {
    const prefix = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}-`;
    return events.filter((e) => e.dateKey?.startsWith(prefix)).length;
  }, [events, monthDate]);
  const todayKey = useMemo(() => formatDateKey(new Date()), []);

  return (
    <>
      <style>{styles}</style>
      <div className="jc-root">

        {/* TOP BAR */}
        <header className="jc-topbar">
          <div className="jc-topbar-left">
            <span className="jc-topbar-title">Jobs Calendar</span>
            <span className="jc-topbar-sub">Operations</span>
          </div>

          <div className="jc-toggle" role="tablist" aria-label="Calendar source">
            <button
              type="button" role="tab"
              aria-selected={scope === "posted"}
              className={`jc-toggle-btn ${scope === "posted" ? "active" : ""}`}
              onClick={() => setScope("posted")}
            >Posted</button>
            <button
              type="button" role="tab"
              aria-selected={scope === "applied"}
              className={`jc-toggle-btn ${scope === "applied" ? "active" : ""}`}
              onClick={() => setScope("applied")}
            >Applied</button>
          </div>
        </header>

        {/* BODY */}
        <div className="jc-body">

          {/* SIDEBAR — selected-date event list */}
          <aside className="jc-sidebar">
            <div className="jc-sidebar-head">
              <div className="jc-sidebar-date">{formatDisplayDate(selectedDateKey)}</div>
              <div className="jc-sidebar-scope">
                {scope === "posted" ? "Jobs posted by you" : "Jobs you applied for"}
              </div>
            </div>

            <div className="jc-sidebar-body">
              {loading && (
                <div className="jc-status">Loading…</div>
              )}
              {!loading && error && (
                <div className="jc-status error">{error}</div>
              )}
              {!loading && !error && !hasUser && !loadingMe && (
                <div className="jc-status">
                  Please <Link className="jc-login-link" href="/auth/login">log in</Link> to view your calendar.
                </div>
              )}
              {!loading && !error && hasUser && selectedEvents.length === 0 && (
                <div className="jc-empty">
                  No {scope === "posted" ? "posted" : "applied"} jobs on this date.
                </div>
              )}

              {selectedEvents.map((event) => (
                <Link key={`${event.scope}-${event.id}`} href={event.href} className="jc-card">
                  <div className="jc-card-top">
                    <div>
                      <div className="jc-card-title">{event.title}</div>
                      <div className="jc-card-type">{event.jobTypeName ?? "General job"}</div>
                    </div>
                    <span className="jc-badge">{event.statusLabel}</span>
                  </div>
                  <div className="jc-card-row">
                    <div className="jc-card-field">
                      <div className="jc-card-label">Time</div>
                      <div className="jc-card-value">{event.timeLabel ?? "—"}</div>
                    </div>
                    <div className="jc-card-field">
                      <div className="jc-card-label">Location</div>
                      <div className="jc-card-value">{event.locationText ?? "—"}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </aside>

          {/* CALENDAR PANEL */}
          <div className="jc-cal-panel">
            <div className="jc-cal-head">
              <div>
                <div className="jc-month-title">{monthLabel}</div>
                <div className="jc-month-meta">
                  {monthCount} job{monthCount === 1 ? "" : "s"} this month
                </div>
              </div>
              <div className="jc-nav">
                <button
                  type="button" className="jc-nav-btn" aria-label="Previous month"
                  onClick={() => setMonthDate((d) => addMonths(d, -1))}
                >←</button>
                <button
                  type="button" className="jc-nav-btn" aria-label="Next month"
                  onClick={() => setMonthDate((d) => addMonths(d, 1))}
                >→</button>
              </div>
            </div>

            <div className="jc-cal-grid-wrap">
              <div className="jc-weekdays">
                {WEEKDAY_LABELS.map((label) => (
                  <div key={label} className="jc-weekday">{label}</div>
                ))}
              </div>

              <div className="jc-grid">
                {monthDays.map((day) => {
                  const dayEvents = eventsByDate.get(day.dateKey) ?? [];
                  const count = dayEvents.length;
                  const isSelected = day.dateKey === selectedDateKey;
                  const isToday = day.dateKey === todayKey;

                  return (
                    <button
                      key={day.dateKey}
                      type="button"
                      className={[
                        "jc-day",
                        day.inMonth ? "" : "muted",
                        isSelected ? "selected" : "",
                        isToday ? "today" : "",
                      ].filter(Boolean).join(" ")}
                      onClick={() => setSelectedDateKey(day.dateKey)}
                    >
                      <div className="jc-day-number">{day.date.getDate()}</div>
                      {count > 0 && (
                        <div className="jc-dot-row">
                          {dayEvents.slice(0, 4).map((e) => (
                            <span key={e.id} className="jc-dot" />
                          ))}
                        </div>
                      )}
                      {count > 0 && (
                        <span className="jc-day-pill">
                          {dayEvents[0].title}
                          {count > 1 ? ` +${count - 1}` : ""}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
