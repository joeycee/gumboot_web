"use client";

import { ReactNode, useState } from "react";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,600&display=swap');

  :root{
    --bg-0:#2A3439;
    --bg-1:#3E4A51;
    --bg-2:#2F3A40;

    --text-1:#E5E5E5;
    --text-2:rgba(229,229,229,0.72);
    --text-3:rgba(229,229,229,0.48);
    --text-4:rgba(229,229,229,0.28);

    --accent:#5B6E7F;
    --cta:#26A69A;
    --danger:#B75B5B;

    --line:rgba(229,229,229,0.12);
    --line-strong:rgba(229,229,229,0.20);

    --glass-1:rgba(229,229,229,0.06);
    --glass-2:rgba(229,229,229,0.10);
    --glass-3:rgba(229,229,229,0.16);

    --shadow: 0 18px 50px rgba(0,0,0,0.35);
  }

  .shell-root *{ box-sizing:border-box; }
  .shell-root{
    height:100dvh; width:100%;
    font-family:'DM Sans',sans-serif;
    color:var(--text-1);
    display:flex; flex-direction:column;
    background:
      radial-gradient(900px 600px at 20% 10%, rgba(91,110,127,0.22), rgba(0,0,0,0) 60%),
      linear-gradient(180deg, var(--bg-0), #20282c);
  }

  /* Topbar */
  .shell-topbar{
    height:56px;
    display:flex; align-items:center; justify-content:space-between;
    padding:0 18px;
    background: linear-gradient(180deg, rgba(62,74,81,0.92), rgba(62,74,81,0.72));
    border-bottom:1px solid var(--line);
    box-shadow: 0 8px 30px rgba(0,0,0,0.28);
    z-index:20;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }

  .shell-topbar-left,.shell-topbar-right{ display:flex; align-items:center; gap:10px; }

  .shell-logo{
    font-family:'DM Serif Display',serif;
    font-size:18px; font-weight:400;
    color:var(--text-1);
    letter-spacing:0.01em;
    user-select:none;
  }
  .shell-logo-dot{ color:var(--text-3); }

  .shell-divider-v{
    width:1px; height:16px;
    background:var(--line);
    margin:0 6px;
  }

  .shell-icon-btn{
    font-size:10px;
    font-weight:700;
    letter-spacing:0.10em;
    text-transform:uppercase;
    padding:8px 12px;
    border-radius:12px;

    background: var(--glass-1);
    border: 1px solid var(--line);
    color: var(--text-2);

    cursor:pointer;
    display:flex; align-items:center; gap:8px;
    transition: transform .12s, background .12s, border-color .12s, color .12s;
  }
  .shell-icon-btn:hover{
    transform: translateY(-1px);
    background: var(--glass-2);
    border-color: var(--line-strong);
    color: var(--text-1);
  }
  .shell-icon-btn.active{
    background: rgba(91,110,127,0.28);
    border-color: rgba(91,110,127,0.55);
    color: var(--text-1);
  }

  /* Layout */
  .shell-body{
    flex:1;
    display:flex;
    overflow:hidden;
    position:relative;
    padding:14px;
    gap:14px;
  }

  /* Left panel */
  .shell-left{
    width:360px;
    flex-shrink:0;
    display:flex; flex-direction:column;
    background: rgba(62,74,81,0.60);
    border: 1px solid var(--line);
    border-radius: 18px;
    box-shadow: var(--shadow);
    overflow:hidden;

    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);

    transition: width .22s cubic-bezier(.4,0,.2,1), opacity .18s ease, transform .22s cubic-bezier(.4,0,.2,1);
  }
  .shell-left.collapsed{
    width:0;
    opacity:0;
    pointer-events:none;
    transform: translateX(-8px);
    border-color: transparent;
  }

  /* Center */
  .shell-center{
    flex:1;
    position:relative;
    overflow:hidden;
    border-radius:18px;
    border:1px solid var(--line);
    box-shadow: var(--shadow);
    background: rgba(229,229,229,0.03);
  }

  /* Right drawer */
  .shell-right-overlay{
    position:fixed;
    inset:0;
    top:56px;
    z-index:30;
    pointer-events:none;
  }
  .shell-right-backdrop{
    position:absolute; inset:0;
    background: rgba(0,0,0,0.55);
    opacity:0;
    transition: opacity .22s ease;
    pointer-events:none;
  }
  .shell-right-overlay.open .shell-right-backdrop{
    opacity:1;
    pointer-events:auto;
  }

  .shell-right-panel{
    position:absolute;
    top:14px; right:14px;
    height: calc(100% - 28px);
    width: 360px;

    background: rgba(62,74,81,0.72);
    border: 1px solid var(--line);
    border-radius: 18px;
    box-shadow: var(--shadow);

    overflow:hidden;
    display:flex; flex-direction:column;

    transform: translateX(calc(100% + 28px));
    transition: transform .26s cubic-bezier(.32,.72,0,1);
    pointer-events:auto;

    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }
  .shell-right-overlay.open .shell-right-panel{ transform: translateX(0); }

  .shell-right-header{
    height:56px;
    display:flex; align-items:center; justify-content:space-between;
    padding: 0 18px;
    border-bottom: 1px solid var(--line);
  }
  .shell-right-title{
    font-size:10px;
    font-weight:800;
    letter-spacing:0.14em;
    text-transform:uppercase;
    color: var(--text-3);
  }
  .shell-close-btn{
    width:32px; height:32px;
    border-radius:12px;
    background: var(--glass-1);
    border: 1px solid var(--line);
    color: var(--text-2);
    cursor:pointer;
    transition: transform .12s, background .12s, border-color .12s, color .12s;
  }
  .shell-close-btn:hover{
    transform: translateY(-1px);
    background: var(--glass-2);
    border-color: var(--line-strong);
    color: var(--text-1);
  }

  .shell-right-content{
    flex:1;
    overflow-y:auto;
    scrollbar-width: thin;
    scrollbar-color: rgba(229,229,229,0.18) transparent;
  }
  .shell-right-content::-webkit-scrollbar{ width:4px; }
  .shell-right-content::-webkit-scrollbar-track{ background:transparent; }
  .shell-right-content::-webkit-scrollbar-thumb{ background: rgba(229,229,229,0.18); border-radius:2px; }

  @media (max-width: 900px){
    .shell-body{ padding:10px; gap:10px; }
    .shell-left{ width: 320px; }
    .shell-right-panel{ width: min(360px, calc(100% - 28px)); }
  }
`;

export function Shell({
  left,
  right,
  topRight,
  children,
}: {
  left: ReactNode;
  right: ReactNode;
  topRight?: ReactNode;
  children: ReactNode;
}) {
  const [showLeft, setShowLeft] = useState(true);
  const [showRight, setShowRight] = useState(false);

  return (
    <>
      <style>{styles}</style>
      <div className="shell-root">
        <header className="shell-topbar">
          <div className="shell-topbar-left">
            <span className="shell-logo">
              Gumboot<span className="shell-logo-dot">.</span>
            </span>

            <div className="shell-divider-v" />

            <button
              className={`shell-icon-btn${showLeft ? " active" : ""}`}
              onClick={() => setShowLeft((v) => !v)}
              aria-label="Toggle job list"
            >
              <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                <rect x="4" y="0" width="8" height="1.5" rx="0.75" fill="currentColor" />
                <rect x="4" y="4.25" width="8" height="1.5" rx="0.75" fill="currentColor" />
                <rect x="4" y="8.5" width="8" height="1.5" rx="0.75" fill="currentColor" />
                <circle cx="1" cy="0.75" r="0.75" fill="currentColor" />
                <circle cx="1" cy="5" r="0.75" fill="currentColor" />
                <circle cx="1" cy="9.25" r="0.75" fill="currentColor" />
              </svg>
              Jobs
            </button>
          </div>

          <div className="shell-topbar-right">
            {topRight}
            <button
              className={`shell-icon-btn${showRight ? " active" : ""}`}
              onClick={() => setShowRight(true)}
              aria-label="Open profile"
            >
              <svg width="10" height="12" viewBox="0 0 10 12" fill="none">
                <circle cx="5" cy="3.5" r="2.5" stroke="currentColor" strokeWidth="1.5" />
                <path
                  d="M1 11c0-2.21 1.79-4 4-4s4 1.79 4 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              Profile
            </button>
          </div>
        </header>

        <div className="shell-body">
          <aside className={`shell-left${showLeft ? "" : " collapsed"}`}>{left}</aside>
          <main className="shell-center">{children}</main>
        </div>

        <div className={`shell-right-overlay${showRight ? " open" : ""}`}>
          <div className="shell-right-backdrop" onClick={() => setShowRight(false)} />
          <div className="shell-right-panel">
            <div className="shell-right-header">
              <span className="shell-right-title">Profile</span>
              <button className="shell-close-btn" onClick={() => setShowRight(false)} aria-label="Close profile">
                ✕
              </button>
            </div>
            <div className="shell-right-content">{right}</div>
          </div>
        </div>
      </div>
    </>
  );
}