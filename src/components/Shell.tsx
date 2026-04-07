"use client";

import React, { ReactNode, useEffect, useId, useMemo, useRef, useState } from "react";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,600&display=swap');

  :root{
    --bg-0:#232B2F;
    --bg-1:#2E383E;
    --bg-2:#1E2529;

    --text-1:#F2F2F2;
    --text-2:rgba(242,242,242,0.74);
    --text-3:rgba(242,242,242,0.50);
    --text-4:rgba(242,242,242,0.28);

    --accent:#6E879A;
    --cta:#2EC4B6;
    --danger:#D46A6A;

    --line:rgba(242,242,242,0.10);
    --line-strong:rgba(242,242,242,0.18);

    --glass-1:rgba(242,242,242,0.05);
    --glass-2:rgba(242,242,242,0.09);
    --glass-3:rgba(242,242,242,0.14);

    --shadow: 0 18px 55px rgba(0,0,0,0.42);
    --shadow-soft: 0 10px 30px rgba(0,0,0,0.30);

    --r-lg: 18px;
    --gap: 14px;
  }

  .shell-root *{ box-sizing:border-box; }
  .shell-root{
    height: 100%;
    width: 100%;
    overflow: hidden;                 /* ✅ stops popovers altering outer layout */
    font-family:'DM Sans',sans-serif;
    color:var(--text-1);
    display:flex;
    flex-direction:column;
    background:
      radial-gradient(900px 600px at 18% 8%, rgba(110,135,154,0.22), rgba(0,0,0,0) 60%),
      radial-gradient(700px 500px at 95% 15%, rgba(46,196,182,0.10), rgba(0,0,0,0) 55%),
      linear-gradient(180deg, var(--bg-0), var(--bg-2));
  }

  .shell-body{
    flex:1;
    min-height: 0;                    /* ✅ critical for map in flex */
    display:flex;
    overflow:hidden;
    position:relative;
    padding:var(--gap);
    gap:var(--gap);
  }

  .shell-utility{
    position:absolute;
    top:18px;
    left:18px;
    display:flex;
    gap:10px;
    z-index:20;
    align-items:flex-start;
    padding:8px;
    border-radius:16px;
    background: rgba(30,37,41,0.45);
    border: 1px solid rgba(242,242,242,0.06);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    box-shadow: var(--shadow-soft);
  }

  .shell-icon-btn{
    font-size:10px;
    font-weight:700;
    letter-spacing:0.12em;
    text-transform:uppercase;
    padding:9px 12px;
    border-radius:13px;
    background: var(--glass-1);
    border: 1px solid var(--line);
    color: var(--text-2);
    cursor:pointer;
    display:flex;
    align-items:center;
    gap:8px;
    transition: transform .14s ease, background .14s ease, border-color .14s ease, color .14s ease, box-shadow .14s ease;
    user-select:none;
  }
  .shell-icon-btn:hover{
    transform: translateY(-1px);
    background: var(--glass-2);
    border-color: var(--line-strong);
    color: var(--text-1);
    box-shadow: 0 10px 22px rgba(0,0,0,0.28);
  }
  .shell-icon-btn.active{
    background: rgba(110,135,154,0.22);
    border-color: rgba(110,135,154,0.55);
    color: var(--text-1);
  }

  .shell-filter-wrap{ position:relative; }
  .shell-filter-panel{
    position:absolute;
    top:48px;
    left:0;
    width:280px;
    border: 1px solid rgba(242,242,242,0.10);
    border-radius: 16px;
    background: rgba(46,56,62,0.92);
    box-shadow: var(--shadow);
    padding: 12px;
    display:flex;
    flex-direction:column;
    gap:12px;
    z-index:30;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }
  .shell-filter-title{
    font-family:'DM Serif Display', serif;
    font-size:16px;
    margin:2px 2px 0;
  }
  .shell-filter-sub{ font-size:12px; color: var(--text-3); margin:-6px 2px 0; }
  .shell-filter-label{
    font-size:9px;
    font-weight:700;
    letter-spacing:0.12em;
    text-transform:uppercase;
    color: var(--text-3);
    margin-bottom:6px;
    display:block;
  }
  .shell-filter-select,
  .shell-filter-input{
    width:100%;
    border: 1px solid rgba(242,242,242,0.12);
    border-radius:12px;
    background: rgba(30,37,41,0.70);
    color: var(--text-1);
    font-size:12px;
    padding:9px 10px;
    outline:none;
  }
  .shell-filter-row{ display:grid; grid-template-columns:1fr 1fr; gap:10px; }
  .shell-filter-actions{ display:flex; gap:10px; justify-content:space-between; align-items:center; }
  .shell-clear-btn{
    flex:1;
    border:1px solid rgba(242,242,242,0.12);
    border-radius:12px;
    background: rgba(242,242,242,0.06);
    color: var(--text-2);
    padding:9px 10px;
    font-size:11px;
    font-weight:700;
    letter-spacing:0.10em;
    text-transform:uppercase;
    cursor:pointer;
  }
  .shell-apply-hint{ font-size:11px; color: var(--text-4); white-space:nowrap; padding-right:2px; }

  .shell-left{
    width:420px;
    flex-shrink:0;
    min-height: 0;                   /* ✅ */
    display:flex;
    flex-direction:column;
    border-radius: var(--r-lg);
    border: 1px solid var(--line);
    background: rgba(46,56,62,0.58);
    box-shadow: var(--shadow);
    overflow:hidden;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    transition: width .22s cubic-bezier(.4,0,.2,1), opacity .18s ease, transform .22s cubic-bezier(.4,0,.2,1);
  }
  .shell-left.collapsed{
    width:0;
    opacity:0;
    pointer-events:none;
    transform: translateX(-10px);
    border-color: transparent;
  }

  .shell-center{
    flex:1;
    min-width: 0;                    /* ✅ prevents "skinny" flex weirdness */
    min-height: 0;                   /* ✅ */
    position:relative;
    overflow:hidden;
    border-radius: var(--r-lg);
    border: 1px solid var(--line);
    box-shadow: var(--shadow);
    background:
      radial-gradient(700px 520px at 20% 15%, rgba(242,242,242,0.06), rgba(0,0,0,0) 60%),
      rgba(242,242,242,0.03);
  }

  .shell-center-inner{
    position:absolute;
    inset:0;
    padding:12px;
    display:flex;                    /* ✅ so children can fill height */
    min-height:0;
    min-width:0;
  }

  .shell-center-content{
    flex:1;
    min-height:0;
    min-width:0;
    display:flex;
  }

  @media (max-width: 980px){
    :root{ --gap: 10px; }
    .shell-body{ padding:var(--gap); gap:var(--gap); }
    .shell-left{ width: 380px; }
  }

  @media (max-width: 760px){
    .shell-body{
      padding: 8px;
      gap: 8px;
    }
    .shell-left{ width: 100%; position:absolute; inset: calc(10px + 52px) 8px 8px 8px; z-index:25; }
    .shell-left.collapsed{ width:100%; transform: translateX(-10px); opacity:0; }
    .shell-utility{
      left:8px;
      right:8px;
      top:8px;
      gap:8px;
      justify-content:space-between;
      padding:6px;
    }
    .shell-icon-btn{
      flex:1;
      justify-content:center;
      min-height:40px;
      padding:10px 12px;
    }
    .shell-filter-wrap{
      position: static;
      flex: 1;
      display: flex;
    }
    .shell-filter-panel{
      position: fixed;
      top: 64px;
      left: 12px;
      right: 12px;
      width: auto;
      max-height: calc(100dvh - 88px);
      overflow-y: auto;
    }
    .shell-center-inner{
      padding:8px;
    }
  }
`;

function sanitizeMoneyInput(v: string) {
  const cleaned = v.replace(/[^\d.]/g, "");
  const parts = cleaned.split(".");
  if (parts.length <= 1) return cleaned;
  return `${parts[0]}.${parts.slice(1).join("")}`;
}

export function Shell({
  left,
  jobTypes,
  selectedJobType,
  onSelectedJobTypeChange,
  minPrice,
  maxPrice,
  onMinPriceChange,
  onMaxPriceChange,
  onClearFilters,
  children,
}: {
  left: ReactNode;
  jobTypes: string[];
  selectedJobType: string;
  onSelectedJobTypeChange: (value: string) => void;
  minPrice: string;
  maxPrice: string;
  onMinPriceChange: (value: string) => void;
  onMaxPriceChange: (value: string) => void;
  onClearFilters: () => void;
  children: ReactNode;
}) {
  const [showLeft, setShowLeft] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const filterWrapRef = useRef<HTMLDivElement | null>(null);
  const filtersId = useId();

  const jobTypeOptions = useMemo(() => Array.from(new Set(jobTypes)).filter(Boolean), [jobTypes]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(max-width: 760px)");
    const sync = () => setShowLeft(!media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!showFilters) return;

    const onDown = (e: MouseEvent | TouchEvent) => {
      const el = filterWrapRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) setShowFilters(false);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowFilters(false);
    };

    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown, { passive: true });
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [showFilters]);

  return (
    <>
      <style>{styles}</style>

      <div className="shell-root">
        <div className="shell-body">
          <div className="shell-utility">
            <button
              type="button"
              className={`shell-icon-btn${showLeft ? " active" : ""}`}
              onClick={() => setShowLeft((v) => !v)}
              aria-label="Toggle job list"
            >
              <svg width="12" height="10" viewBox="0 0 12 10" fill="none" aria-hidden="true">
                <rect x="4" y="0" width="8" height="1.5" rx="0.75" fill="currentColor" />
                <rect x="4" y="4.25" width="8" height="1.5" rx="0.75" fill="currentColor" />
                <rect x="4" y="8.5" width="8" height="1.5" rx="0.75" fill="currentColor" />
                <circle cx="1" cy="0.75" r="0.75" fill="currentColor" />
                <circle cx="1" cy="5" r="0.75" fill="currentColor" />
                <circle cx="1" cy="9.25" r="0.75" fill="currentColor" />
              </svg>
              Jobs
            </button>

            <div className="shell-filter-wrap" ref={filterWrapRef}>
              <button
                type="button"
                className={`shell-icon-btn${showFilters ? " active" : ""}`}
                onClick={() => setShowFilters((v) => !v)}
                aria-label="Toggle filters"
                aria-expanded={showFilters}
                aria-controls={filtersId}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M1 2h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M3 6h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M5 10h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                Filter
              </button>

              {showFilters && (
                <div id={filtersId} className="shell-filter-panel" role="dialog" aria-label="Job filters">
                  <div>
                    <div className="shell-filter-title">Filters</div>
                    <div className="shell-filter-sub">Narrow the jobs on the map.</div>
                  </div>

                  <div>
                    <label className="shell-filter-label" htmlFor={`${filtersId}-type`}>
                      Job Type
                    </label>
                    <select
                      id={`${filtersId}-type`}
                      className="shell-filter-select"
                      value={selectedJobType}
                      onChange={(e) => onSelectedJobTypeChange(e.target.value)}
                    >
                      <option value="">All job types</option>
                      {jobTypeOptions.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="shell-filter-row">
                    <div>
                      <label className="shell-filter-label" htmlFor={`${filtersId}-min`}>
                        Min $
                      </label>
                      <input
                        id={`${filtersId}-min`}
                        className="shell-filter-input"
                        inputMode="decimal"
                        placeholder="0"
                        value={minPrice}
                        onChange={(e) => onMinPriceChange(sanitizeMoneyInput(e.target.value))}
                      />
                    </div>

                    <div>
                      <label className="shell-filter-label" htmlFor={`${filtersId}-max`}>
                        Max $
                      </label>
                      <input
                        id={`${filtersId}-max`}
                        className="shell-filter-input"
                        inputMode="decimal"
                        placeholder="500"
                        value={maxPrice}
                        onChange={(e) => onMaxPriceChange(sanitizeMoneyInput(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="shell-filter-actions">
                    <button
                      type="button"
                      className="shell-clear-btn"
                      onClick={() => {
                        onClearFilters();
                        setShowFilters(false);
                      }}
                    >
                      Clear
                    </button>
                    <div className="shell-apply-hint">Esc to close</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <aside className={`shell-left${showLeft ? "" : " collapsed"}`}>{left}</aside>

          <main className="shell-center">
            <div className="shell-center-inner">
              <div className="shell-center-content">{children}</div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
