"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMe } from "@/lib/useMe";
import { getChatSocket, type SocketLike } from "@/lib/socketClient";
import { uploadFile } from "@/lib/postJob";
import {
  getImageMessageSource,
  isImageMessage,
  normalizeConversation,
  normalizeMessage,
  resolveUserImageUrl,
  type ChatConversation,
  type ChatMessage,
} from "@/lib/messages";
import { buildPublicProfileHref } from "@/lib/publicProfiles";

type MeUser = {
  _id?: string;
  firstname?: string;
  lastname?: string;
  email?: string;
  phone?: string | number;
};

type SelectedImageState = {
  id: string;
  file: File;
  fileName: string;
  previewUrl: string;
};

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');

  .msg-root * { box-sizing: border-box; }
  .msg-root {
    box-sizing: border-box;
    height: calc(100dvh - 56px);
    padding: 16px 12px 16px;
    background:
      radial-gradient(900px 480px at 8% 0%, rgba(91,110,127,0.18), transparent 60%),
      linear-gradient(180deg, #2A3439 0%, #243036 100%);
    color: #E5E5E5;
    font-family: 'DM Sans', sans-serif;
    overflow: hidden;
  }

  .msg-shell {
    max-width: 1180px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
    height: 100%;
    min-height: 0;
  }
  @media (min-width: 960px) {
    .msg-shell {
      grid-template-columns: 320px minmax(0, 1fr);
      align-items: stretch;
    }
  }

  .msg-panel {
    border: 1px solid rgba(229,229,229,0.10);
    border-radius: 18px;
    background: rgba(62,74,81,0.82);
    box-shadow: 0 18px 50px rgba(0,0,0,0.28);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    overflow: hidden;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .msg-panel-header {
    padding: 18px 18px 16px;
    border-bottom: 1px solid rgba(229,229,229,0.08);
  }
  .msg-kicker {
    margin: 0 0 6px;
    font-size: 10px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: rgba(229,229,229,0.40);
  }
  .msg-title {
    margin: 0;
    font-family: 'DM Serif Display', serif;
    font-size: 26px;
    line-height: 1.05;
    font-weight: 400;
  }
  .msg-subtitle {
    margin: 8px 0 0;
    font-size: 12px;
    line-height: 1.6;
    color: rgba(229,229,229,0.48);
  }

  .msg-status {
    margin-top: 10px;
    border-radius: 10px;
    padding: 8px 12px;
    font-size: 12px;
    line-height: 1.5;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .msg-status::before {
    content: '';
    display: inline-block;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .msg-status.error {
    border: 1px solid rgba(183,91,91,0.35);
    background: rgba(183,91,91,0.12);
    color: rgba(255,214,214,0.92);
  }
  .msg-status.error::before { background: #b75b5b; }
  .msg-status.info {
    border: 1px solid rgba(229,229,229,0.10);
    background: rgba(38,166,154,0.08);
    color: rgba(229,229,229,0.65);
  }
  .msg-status.info::before { background: #26A69A; box-shadow: 0 0 0 3px rgba(38,166,154,0.25); animation: pulse-dot 2s infinite; }

  @keyframes pulse-dot {
    0%, 100% { box-shadow: 0 0 0 3px rgba(38,166,154,0.25); }
    50% { box-shadow: 0 0 0 5px rgba(38,166,154,0.10); }
  }

  /* ── Conversation list ── */
  .msg-list {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: rgba(229,229,229,0.12) transparent;
  }
  .msg-list::-webkit-scrollbar { width: 4px; }
  .msg-list::-webkit-scrollbar-thumb { background: rgba(229,229,229,0.12); border-radius: 999px; }

  .msg-list-row {
    width: 100%;
    background: transparent;
    color: inherit;
    padding: 10px 18px;
    border-bottom: 1px solid rgba(229,229,229,0.05);
    transition: background 0.14s ease;
    position: relative;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .msg-list-row:hover { background: rgba(229,229,229,0.04); }
  .msg-list-row.active {
    background: rgba(38,166,154,0.10);
  }
  .msg-list-row.active::before {
    content: '';
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 3px;
    background: linear-gradient(180deg, #26A69A, #1d7a72);
    border-radius: 0 2px 2px 0;
  }
  .msg-list-open {
    flex: 1;
    min-width: 0;
    display: grid;
    grid-template-columns: 40px minmax(0, 1fr) auto;
    gap: 12px;
    align-items: center;
    border: none;
    background: transparent;
    color: inherit;
    text-align: left;
    padding: 3px 0;
    cursor: pointer;
  }
  .msg-list-profile-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 28px;
    border-radius: 999px;
    padding: 0 10px;
    border: 1px solid rgba(229,229,229,0.10);
    background: rgba(229,229,229,0.06);
    color: rgba(229,229,229,0.68);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    text-decoration: none;
    transition: background 0.14s ease, border-color 0.14s ease, color 0.14s ease;
  }
  .msg-list-profile-link:hover {
    background: rgba(229,229,229,0.12);
    border-color: rgba(229,229,229,0.18);
    color: #E5E5E5;
  }

  .msg-list-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    overflow: hidden;
    border: 1px solid rgba(229,229,229,0.10);
    background: linear-gradient(135deg, #3E4A51, #5B6E7F);
    flex-shrink: 0;
    display: grid;
    place-items: center;
  }
  .msg-list-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .msg-list-avatar-fallback {
    font-size: 12px;
    font-weight: 700;
    color: rgba(229,229,229,0.78);
    letter-spacing: 0.03em;
  }
  .msg-list-content {
    min-width: 0;
  }
  .msg-list-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 4px;
  }
  .msg-list-name { font-size: 13px; font-weight: 600; color: #E5E5E5; }
  .msg-list-time { font-size: 10px; color: rgba(229,229,229,0.30); white-space: nowrap; }
  .msg-list-preview {
    font-size: 12px;
    line-height: 1.5;
    color: rgba(229,229,229,0.48);
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .msg-list-badge {
    margin-top: 6px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 22px;
    padding: 4px 7px;
    border-radius: 999px;
    font-size: 10px;
    font-weight: 700;
    color: #fff;
    background: linear-gradient(135deg, #26A69A 0%, #1d7a72 100%);
    box-shadow: 0 6px 18px rgba(38,166,154,0.20);
  }
  .msg-list-meta {
    align-self: start;
    justify-self: end;
  }

  /* ── Thread panel ── */
  .msg-thread {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr) auto;
    height: 100%;
    min-height: 0;
  }

  .msg-thread-header {
    padding: 16px 20px 14px;
    border-bottom: 1px solid rgba(229,229,229,0.08);
    background: rgba(42,52,57,0.25);
    position: sticky;
    top: 0;
    z-index: 2;
    display: flex;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;
  }
  .msg-thread-head-avatar {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    overflow: hidden;
    border: 1px solid rgba(229,229,229,0.10);
    background: linear-gradient(135deg, #3E4A51, #5B6E7F);
    display: grid;
    place-items: center;
    flex-shrink: 0;
  }
  .msg-thread-head-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .msg-thread-head-copy {
    min-width: 0;
  }
  .msg-thread-profile-link {
    display: flex;
    align-items: center;
    gap: 12px;
    color: inherit;
    text-decoration: none;
    min-width: 0;
  }
  .msg-thread-profile-link:hover .msg-thread-name {
    color: #ffffff;
  }
  .msg-thread-name { margin: 0; font-size: 16px; font-weight: 600; color: #E5E5E5; }
  .msg-thread-meta { margin-top: 4px; font-size: 11px; color: rgba(229,229,229,0.40); }

  /* ── Message bubbles area ── */
  .msg-thread-body {
    padding: 16px 18px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-height: 0;
    scrollbar-width: thin;
    scrollbar-color: rgba(229,229,229,0.10) transparent;

    background:
      radial-gradient(ellipse 70% 40% at 80% 10%, rgba(38,166,154,0.07), transparent 60%),
      radial-gradient(ellipse 60% 50% at 20% 90%, rgba(91,110,127,0.09), transparent 60%),
      linear-gradient(180deg, rgba(36,48,54,0.55) 0%, rgba(30,40,46,0.55) 100%);
  }
  .msg-thread-body::-webkit-scrollbar { width: 4px; }
  .msg-thread-body::-webkit-scrollbar-thumb { background: rgba(229,229,229,0.10); border-radius: 999px; }

  .msg-bubble-wrap { display: flex; align-items: flex-end; gap: 8px; }
  .msg-bubble-wrap.mine { justify-content: flex-end; }

  .msg-bubble-wrap:not(.mine) .msg-avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    overflow: hidden;
    background: linear-gradient(135deg, #3E4A51, #5B6E7F);
    border: 1px solid rgba(229,229,229,0.12);
    display: grid;
    place-items: center;
    flex-shrink: 0;
    margin-bottom: 2px;
  }
  .msg-bubble-wrap.mine .msg-avatar { display: none; }
  .msg-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .msg-avatar-fallback {
    font-size: 11px;
    font-weight: 700;
    color: rgba(229,229,229,0.75);
  }

  .msg-bubble {
    max-width: min(72%, 480px);
    border-radius: 16px;
    padding: 10px 13px;
    position: relative;
  }

  .msg-bubble-wrap:not(.mine) .msg-bubble {
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(229,229,229,0.09);
    border-bottom-left-radius: 4px;
  }

  .msg-bubble-wrap.mine .msg-bubble {
    background: linear-gradient(135deg, rgba(38,166,154,0.28), rgba(29,122,114,0.22));
    border: 1px solid rgba(38,166,154,0.30);
    border-bottom-right-radius: 4px;
  }

  .msg-bubble-text {
    font-size: 13px;
    line-height: 1.65;
    color: #E5E5E5;
    white-space: pre-wrap;
    word-break: break-word;
  }
  .msg-bubble-time {
    margin-top: 6px;
    font-size: 10px;
    color: rgba(229,229,229,0.32);
    text-align: right;
  }
  .msg-bubble-wrap:not(.mine) .msg-bubble-time { text-align: left; }

  .msg-bubble-image {
    display: block;
    width: 100%;
    max-width: 300px;
    border-radius: 10px;
    border: 1px solid rgba(229,229,229,0.10);
    background: rgba(42,52,57,0.55);
    object-fit: cover;
    box-shadow: 0 12px 28px rgba(0,0,0,0.18);
    cursor: zoom-in;
  }
  .msg-bubble-image-fallback {
    display: grid;
    place-items: center;
    width: 100%;
    min-height: 140px;
    border-radius: 10px;
    border: 1px dashed rgba(229,229,229,0.16);
    color: rgba(229,229,229,0.40);
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  /* ── Composer ── */
  .msg-compose {
    padding: 12px 16px 16px;
    border-top: 1px solid rgba(229,229,229,0.07);
    background: rgba(36,48,54,0.45);
    position: sticky;
    bottom: 0;
    z-index: 2;
    flex-shrink: 0;
  }
  .msg-compose-tools {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 8px;
  }
  .msg-picker-btn {
    border: 1px solid rgba(229,229,229,0.12);
    background: rgba(229,229,229,0.05);
    color: rgba(229,229,229,0.70);
    border-radius: 10px;
    padding: 7px 11px;
    font: inherit;
    font-size: 11px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    cursor: pointer;
    transition: background 0.14s, border-color 0.14s;
  }
  .msg-picker-btn:hover:not(:disabled) {
    background: rgba(229,229,229,0.09);
    border-color: rgba(229,229,229,0.20);
  }
  .msg-picker-btn:disabled { opacity: 0.35; cursor: not-allowed; }

  .msg-compose-note { font-size: 10px; color: rgba(229,229,229,0.32); }

  .msg-compose-row { display: flex; gap: 8px; align-items: flex-end; }

  .msg-textarea {
    flex: 1;
    min-height: 52px;
    max-height: 120px;
    resize: none;
    border-radius: 12px;
    border: 1px solid rgba(229,229,229,0.12);
    background: rgba(30,40,46,0.70);
    color: #E5E5E5;
    padding: 10px 12px;
    font: inherit;
    font-size: 13px;
    outline: none;
    transition: border-color 0.16s, box-shadow 0.16s;
  }
  .msg-textarea:focus {
    border-color: rgba(38,166,154,0.50);
    box-shadow: 0 0 0 3px rgba(38,166,154,0.10);
  }

  .msg-send {
    border: none;
    border-radius: 12px;
    padding: 0 18px;
    height: 68px;
    font: inherit;
    font-size: 11px;
    letter-spacing: 0.10em;
    text-transform: uppercase;
    background: linear-gradient(135deg, #26A69A 0%, #1d7a72 100%);
    color: #fff;
    font-weight: 700;
    cursor: pointer;
    min-width: 90px;
    position: relative;
    overflow: hidden;
    transition: opacity 0.14s, transform 0.12s;
  }
  .msg-send::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.12), transparent);
  }
  .msg-send:hover:not(:disabled) { transform: translateY(-1px); opacity: 0.92; }
  .msg-send:active:not(:disabled) { transform: translateY(0px); }
  .msg-send:disabled { opacity: 0.35; cursor: not-allowed; }

  /* ── Image staging drawer ── */
  @keyframes staging-in {
    from { opacity: 0; transform: translateY(8px); max-height: 0; }
    to   { opacity: 1; transform: translateY(0);   max-height: 260px; }
  }
  .msg-staging {
    margin-bottom: 10px;
    border-radius: 14px;
    border: 1px solid rgba(38,166,154,0.22);
    background: linear-gradient(135deg, rgba(36,48,54,0.90), rgba(30,42,46,0.88));
    overflow: hidden;
    animation: staging-in 0.22s cubic-bezier(0.22,1,0.36,1) both;
  }
  .msg-staging-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px 8px;
    border-bottom: 1px solid rgba(38,166,154,0.12);
  }
  .msg-staging-title {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #26A69A;
  }
  .msg-staging-clear {
    border: none;
    background: transparent;
    color: rgba(229,229,229,0.40);
    font: inherit;
    font-size: 10px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    cursor: pointer;
    padding: 2px 6px;
    border-radius: 6px;
    transition: color 0.12s, background 0.12s;
  }
  .msg-staging-clear:hover { color: rgba(229,229,229,0.80); background: rgba(229,229,229,0.07); }

  .msg-staging-scroll {
    display: flex;
    gap: 10px;
    padding: 12px 14px 14px;
    overflow-x: auto;
    scrollbar-width: thin;
    scrollbar-color: rgba(229,229,229,0.10) transparent;
  }
  .msg-staging-scroll::-webkit-scrollbar { height: 3px; }
  .msg-staging-scroll::-webkit-scrollbar-thumb { background: rgba(229,229,229,0.10); border-radius: 999px; }

  @keyframes img-pop-in {
    from { opacity: 0; transform: scale(0.88); }
    to   { opacity: 1; transform: scale(1); }
  }
  .msg-staging-item {
    flex-shrink: 0;
    width: 130px;
    border-radius: 12px;
    border: 1px solid rgba(38,166,154,0.18);
    background: rgba(42,52,57,0.60);
    overflow: hidden;
    position: relative;
    animation: img-pop-in 0.18s cubic-bezier(0.22,1,0.36,1) both;
  }
  .msg-staging-thumb {
    display: block;
    width: 100%;
    height: 110px;
    object-fit: cover;
  }
  .msg-staging-footer {
    padding: 6px 8px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    background: rgba(30,40,46,0.60);
    border-top: 1px solid rgba(229,229,229,0.06);
  }
  .msg-staging-name {
    font-size: 10px;
    color: rgba(229,229,229,0.50);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
  }
  .msg-staging-remove {
    border: none;
    background: rgba(183,91,91,0.16);
    color: rgba(255,180,180,0.80);
    border-radius: 6px;
    padding: 3px 6px;
    font: inherit;
    font-size: 10px;
    cursor: pointer;
    flex-shrink: 0;
    transition: background 0.12s;
  }
  .msg-staging-remove:hover { background: rgba(183,91,91,0.30); }

  /* Empty states */
  .msg-empty {
    padding: 18px 20px;
    color: rgba(229,229,229,0.45);
    font-size: 13px;
    line-height: 1.7;
  }
  .msg-empty.center {
    flex: 1;
    display: grid;
    place-items: center;
    text-align: center;
    padding: 24px;
    font-size: 12px;
    color: rgba(229,229,229,0.35);
    letter-spacing: 0.04em;
  }
  /* ── Auth gate ── */
  .msg-auth {
    max-width: 600px; margin: 40px auto 0;
    border: 1px solid rgba(229,229,229,0.10);
    border-radius: 18px;
    background: rgba(62,74,81,0.82);
    padding: 28px; text-align: center;
  }
  .msg-auth-copy { margin: 10px 0 18px; color: rgba(229,229,229,0.62); font-size: 14px; line-height: 1.7; }
  .msg-auth-link {
    display: inline-flex; align-items: center; justify-content: center;
    min-width: 130px; padding: 11px 18px; border-radius: 12px;
    text-decoration: none; color: #fff; background: #26A69A;
    font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
  }

  /* ── Message entrance animation ── */
  @keyframes bubble-in {
    from { opacity: 0; transform: translateY(6px) scale(0.98); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  .msg-bubble-wrap {
    animation: bubble-in 0.18s ease both;
  }
  .msg-lightbox {
    position: fixed;
    inset: 0;
    z-index: 80;
    background:
      radial-gradient(circle at top, rgba(38,166,154,0.12), transparent 28%),
      rgba(11,16,18,0.82);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(8px);
    display: grid;
    place-items: center;
    padding: 20px;
  }
  .msg-lightbox-stage {
    position: relative;
    width: min(94vw, 1120px);
    max-height: min(90vh, 860px);
    display: grid;
    grid-template-rows: minmax(0, 1fr) auto;
    gap: 14px;
    align-items: center;
    justify-items: center;
    padding: 20px 72px 18px;
    border-radius: 28px;
    border: 1px solid rgba(229,229,229,0.08);
    background: linear-gradient(180deg, rgba(42,52,57,0.72), rgba(24,32,36,0.78));
    box-shadow: 0 24px 90px rgba(0,0,0,0.42);
  }
  .msg-lightbox-img {
    max-width: 100%;
    max-height: min(72vh, 760px);
    display: block;
    border-radius: 20px;
    box-shadow: 0 28px 70px rgba(0,0,0,0.34);
    background: rgba(42,52,57,0.8);
    object-fit: contain;
  }
  .msg-lightbox-btn,
  .msg-lightbox-close {
    border: 1px solid rgba(229,229,229,0.16);
    background: rgba(23,32,36,0.76);
    color: #E5E5E5;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    transition: transform 0.16s ease, background 0.16s ease, border-color 0.16s ease, opacity 0.16s ease;
  }
  .msg-lightbox-close {
    position: absolute;
    top: 14px;
    right: 14px;
    width: 44px;
    height: 44px;
    border-radius: 999px;
    font-size: 20px;
    box-shadow: 0 10px 28px rgba(0,0,0,0.25);
  }
  .msg-lightbox-close:hover {
    transform: translateY(-1px);
    background: rgba(32,44,49,0.92);
    border-color: rgba(229,229,229,0.24);
  }
  .msg-lightbox-btn {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 48px;
    height: 48px;
    border-radius: 999px;
    font-size: 24px;
    box-shadow: 0 12px 28px rgba(0,0,0,0.24);
  }
  .msg-lightbox-btn.prev { left: 16px; }
  .msg-lightbox-btn.next { right: 16px; }
  .msg-lightbox-btn:hover:not(:disabled) {
    transform: translateY(-50%) scale(1.04);
    background: rgba(32,44,49,0.92);
    border-color: rgba(229,229,229,0.24);
  }
  .msg-lightbox-btn:disabled {
    opacity: 0.28;
    cursor: not-allowed;
  }
  .msg-lightbox-meta {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .msg-lightbox-meta-card {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    min-height: 40px;
    max-width: min(100%, 720px);
    padding: 10px 14px;
    border-radius: 999px;
    border: 1px solid rgba(229,229,229,0.08);
    background: rgba(23,32,36,0.58);
    box-shadow: 0 10px 24px rgba(0,0,0,0.18);
  }
  .msg-lightbox-count {
    flex-shrink: 0;
    padding: 4px 8px;
    border-radius: 999px;
    background: rgba(38,166,154,0.16);
    color: rgba(229,229,229,0.92);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .msg-lightbox-caption {
    min-width: 0;
    color: rgba(229,229,229,0.72);
    font-size: 12px;
    line-height: 1.4;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  @media (max-width: 820px) {
    .msg-root {
      padding: 10px 10px 10px;
    }
    .msg-shell {
      gap: 12px;
    }
    .msg-panel-header {
      padding: 14px 14px 12px;
    }
    .msg-thread-header {
      padding: 12px 14px;
    }
    .msg-thread-body {
      padding: 12px 14px;
    }
    .msg-compose {
      padding: 10px 12px 12px;
    }
    .msg-list {
      max-height: 220px;
    }
    .msg-lightbox-stage {
      width: 100%;
      max-height: min(92vh, 860px);
      padding: 58px 12px 14px;
      border-radius: 22px;
      gap: 10px;
    }
    .msg-lightbox-img {
      max-height: min(68vh, 620px);
      border-radius: 16px;
    }
    .msg-lightbox-btn {
      top: auto;
      bottom: 70px;
      transform: none;
      width: 44px;
      height: 44px;
      font-size: 22px;
    }
    .msg-lightbox-btn:hover:not(:disabled) {
      transform: scale(1.04);
    }
    .msg-lightbox-btn.prev { left: 12px; }
    .msg-lightbox-btn.next { right: 12px; }
    .msg-lightbox-close {
      top: 10px;
      right: 10px;
    }
    .msg-lightbox-meta-card {
      width: 100%;
      border-radius: 18px;
      justify-content: space-between;
    }
    .msg-lightbox-caption {
      max-width: 100%;
    }
  }
`;

function readUser(user: unknown): MeUser {
  if (!user || typeof user !== "object") return {};
  return user as MeUser;
}

function formatTimestamp(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  const isSameDay = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday ${new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
    }).format(date)}`;
  }
  return new Intl.DateTimeFormat(undefined, {
    ...(isSameDay ? {} : { month: "short", day: "numeric" }),
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function mergeMessages(existing: ChatMessage[], incoming: ChatMessage) {
  if (!incoming._id) return existing;
  if (existing.some((item) => item._id === incoming._id)) return existing;
  return [...existing, incoming].sort((a, b) => {
    const aTime = new Date(a.createdAt ?? 0).getTime();
    const bTime = new Date(b.createdAt ?? 0).getTime();
    return aTime - bTime;
  });
}

function threadMatchesSelection(messages: ChatMessage[], loggedInUserId: string, otherUserId: string) {
  if (!messages.length) return true;
  return messages.every((message) => {
    const participants = [message.sender_id, message.receiver_id];
    return participants.includes(loggedInUserId) && participants.includes(otherUserId);
  });
}

function getInitials(name?: string): string {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

export default function MessagesPage() {
  const { user, loading } = useMe();
  const socketRef = useRef<SocketLike | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const threadBodyRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const selectedOtherUserIdRef = useRef("");
  const selectedImagesRef = useRef<SelectedImageState[]>([]);
  const pendingThreadRequestRef = useRef("");
  const pendingScrollRef = useRef<false | ScrollBehavior>(false);
  const scrollFrameRef = useRef<number | null>(null);
  const userNearBottomRef = useRef(true);
  const sendInFlightRef = useRef(false);

  const me = useMemo(() => readUser(user), [user]);
  const loggedInUserId = me._id ?? "";

  const [socketReady, setSocketReady] = useState(false);
  const [socketError, setSocketError] = useState<string | null>(null);

  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [selectedOtherUserId, setSelectedOtherUserId] = useState<string>("");

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [threadError, setThreadError] = useState<string | null>(null);
  const [composerValue, setComposerValue] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedImages, setSelectedImages] = useState<SelectedImageState[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const selectedConversation = useMemo(
    () => conversations.find((item) => item.otherUserId === selectedOtherUserId) ?? null,
    [conversations, selectedOtherUserId]
  );

  const threadImages = useMemo(
    () =>
      messages
        .map((message) => ({
          id: message._id,
          src: getImageMessageSource(message),
          label: message.fileName || "Shared image",
        }))
        .filter((item) => item.src),
    [messages]
  );

  const activeLightboxImage =
    lightboxIndex !== null && lightboxIndex >= 0 && lightboxIndex < threadImages.length
      ? threadImages[lightboxIndex]
      : null;

  useEffect(() => {
    selectedOtherUserIdRef.current = selectedOtherUserId;
  }, [selectedOtherUserId]);

  useEffect(() => {
    selectedImagesRef.current = selectedImages;
  }, [selectedImages]);

  const releaseImages = useCallback((images: SelectedImageState[]) => {
    images.forEach((image) => URL.revokeObjectURL(image.previewUrl));
  }, []);

  useEffect(() => {
    return () => {
      if (scrollFrameRef.current !== null) {
        cancelAnimationFrame(scrollFrameRef.current);
      }
      releaseImages(selectedImagesRef.current);
    };
  }, [releaseImages]);

  // ── Core imperative scroll helper ──────────────────────────────────────────
  // Double-rAF ensures we wait for both the React commit AND the browser paint
  // before measuring scrollHeight, so the new messages are actually in the DOM.
  const scrollToBottom = useCallback((behavior: ScrollBehavior) => {
    if (scrollFrameRef.current !== null) {
      cancelAnimationFrame(scrollFrameRef.current);
    }
    scrollFrameRef.current = requestAnimationFrame(() => {
      scrollFrameRef.current = requestAnimationFrame(() => {
        const container = threadBodyRef.current;
        if (container) {
          container.scrollTo({ top: container.scrollHeight, behavior });
          userNearBottomRef.current = true;
          pendingScrollRef.current = false;
        }
        scrollFrameRef.current = null;
      });
    });
  }, []);

  const queueScrollToBottom = useCallback((behavior: ScrollBehavior) => {
    pendingScrollRef.current = behavior;
  }, []);

  const refreshConversationList = useCallback(() => {
    if (!socketRef.current || !loggedInUserId) return;
    setConversationsLoading(true);
    socketRef.current.emit("chat_list", { sender_id: loggedInUserId });
  }, [loggedInUserId]);

  const loadThread = useCallback(
    (otherUserId: string) => {
      if (!socketRef.current || !loggedInUserId || !otherUserId) return;
      pendingThreadRequestRef.current = otherUserId;
      setThreadLoading(true);
      setThreadError(null);
      socketRef.current.emit("get_chat", {
        sender_id: loggedInUserId,
        receiver_id: otherUserId,
      });
      socketRef.current.emit("read_unread", {
        sender_id: loggedInUserId,
        receiver_id: otherUserId,
      });
    },
    [loggedInUserId]
  );

  useEffect(() => {
    if (!loggedInUserId) return;
    let disposed = false;
    let removeListeners: (() => void) | null = null;

    getChatSocket()
      .then((client) => {
        if (disposed) return;
        socketRef.current = client;

        const handleConnect = () => {
          if (disposed) return;
          setSocketReady(true);
          setSocketError(null);
          client.emit("connect_user", { userId: loggedInUserId });
          refreshConversationList();
        };
        const handleConnectError = () => {
          if (disposed) return;
          setSocketReady(false);
          setSocketError("Unable to connect to chat right now.");
        };
        const handleChatList = (payload: unknown) => {
          const rows = Array.isArray(payload) ? payload : [];
          const next = rows
            .map((item) => normalizeConversation((item ?? {}) as Record<string, unknown>, loggedInUserId))
            .filter((item) => item.otherUserId);
          setConversations(next);
          setConversationsLoading(false);
        };
        const handleMyChat = (payload: unknown) => {
          const rows = Array.isArray(payload) ? payload : [];
          const next = rows
            .map((item) => normalizeMessage((item ?? {}) as Record<string, unknown>))
            .filter((item) => item._id)
            .sort((a, b) => new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime());
          const activeOtherUserId = selectedOtherUserIdRef.current;
          if (!activeOtherUserId) return;
          if (pendingThreadRequestRef.current !== activeOtherUserId) return;
          if (!threadMatchesSelection(next, loggedInUserId, activeOtherUserId)) return;
          setMessages(next);
          setThreadLoading(false);
          if (sendInFlightRef.current) {
            sendInFlightRef.current = false;
            setSending(false);
          }
          // ── SCROLL FIX ──────────────────────────────────────────────────────
          // Always imperatively scroll when a thread loads. We can't rely solely
          // on the dep-based useEffect below because pendingScrollRef may have
          // already been cleared, or the dep value may not have changed if the
          // same conversation was re-selected. The double-rAF in scrollToBottom
          // guarantees the DOM has painted before we measure scrollHeight.
          scrollToBottom("auto");
        };
        const handleSendMessage = (payload: unknown) => {
          const nextMessage = normalizeMessage((payload ?? {}) as Record<string, unknown>);
          if (!nextMessage._id) return;
          const activeOtherUserId = selectedOtherUserIdRef.current;
          const belongsToSelectedThread =
            activeOtherUserId &&
            [nextMessage.sender_id, nextMessage.receiver_id].includes(activeOtherUserId) &&
            [nextMessage.sender_id, nextMessage.receiver_id].includes(loggedInUserId);
          if (belongsToSelectedThread) {
            if (nextMessage.sender_id === loggedInUserId || userNearBottomRef.current) {
              scrollToBottom("smooth");
            }
            setMessages((current) => mergeMessages(current, nextMessage));
            if (nextMessage.sender_id === activeOtherUserId) {
              client.emit("read_unread", { sender_id: loggedInUserId, receiver_id: activeOtherUserId });
            }
          }
          refreshConversationList();
        };
        const handleReadStatus = (payload: unknown) => {
          const data = (payload ?? {}) as { receiver_id?: string };
          if (!data.receiver_id) return;
          setConversations((current) =>
            current.map((item) =>
              item.otherUserId === data.receiver_id ? { ...item, unreadCount: 0 } : item
            )
          );
        };

        client.on("connect", handleConnect);
        client.on("connect_error", handleConnectError);
        client.on("chat_list", handleChatList);
        client.on("my_chat", handleMyChat);
        client.on("send_message", handleSendMessage);
        client.on("read_data_status", handleReadStatus);

        removeListeners = () => {
          client.off("connect", handleConnect);
          client.off("connect_error", handleConnectError);
          client.off("chat_list", handleChatList);
          client.off("my_chat", handleMyChat);
          client.off("send_message", handleSendMessage);
          client.off("read_data_status", handleReadStatus);
        };
        if (client.connected) handleConnect();
      })
      .catch((error) => {
        if (disposed) return;
        setSocketReady(false);
        setSocketError(error instanceof Error ? error.message : "Unable to start chat");
        setConversationsLoading(false);
      });

    return () => {
      disposed = true;
      removeListeners?.();
      socketRef.current?.emit("update_chat_screen_id", { receiver_id: loggedInUserId, constant_id: null });
    };
  }, [loggedInUserId, refreshConversationList, scrollToBottom]);

  useEffect(() => {
    if (!conversations.length) { setSelectedOtherUserId(""); return; }
    setSelectedOtherUserId((current) => {
      if (current && conversations.some((item) => item.otherUserId === current)) return current;
      return conversations[0]?.otherUserId ?? "";
    });
  }, [conversations]);

  useEffect(() => {
    if (!loggedInUserId || !selectedOtherUserId || !socketRef.current) {
      setMessages([]);
      setLightboxIndex(null);
      releaseImages(selectedImagesRef.current);
      setSelectedImages([]);
      return;
    }
    const constantId = selectedConversation?.constantId ?? null;
    socketRef.current.emit("update_chat_screen_id", { receiver_id: loggedInUserId, constant_id: constantId });
    setSelectedImages((current) => {
      releaseImages(current);
      return [];
    });
    setLightboxIndex(null);
    loadThread(selectedOtherUserId);
  }, [loadThread, loggedInUserId, releaseImages, selectedConversation?.constantId, selectedOtherUserId]);

  // Secondary dep-based scroll — catches smooth scrolls queued by handleSendMessage
  // for the case where the user was already near the bottom.
  useEffect(() => {
    const pendingBehavior = pendingScrollRef.current;
    if (!pendingBehavior) return;
    scrollToBottom(pendingBehavior);
  }, [messages.length, scrollToBottom]);

  const handleThreadScroll = useCallback(() => {
    const container = threadBodyRef.current;
    if (!container) return;
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    userNearBottomRef.current = distanceFromBottom < 96;
  }, []);

  const handlePickImage = useCallback(() => { fileInputRef.current?.click(); }, []);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setLightboxIndex(null);
        return;
      }
      if (event.key === "ArrowLeft") {
        setLightboxIndex((current) => (current === null ? current : Math.max(0, current - 1)));
      }
      if (event.key === "ArrowRight") {
        setLightboxIndex((current) =>
          current === null ? current : Math.min(threadImages.length - 1, current + 1)
        );
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, threadImages.length]);

  const handleImageChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    const nonImage = files.find((file) => !file.type.startsWith("image/"));
    if (nonImage) {
      setThreadError("Only image files are supported in chat right now.");
      event.target.value = "";
      return;
    }
    const nextImages = files.map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
      file,
      fileName: file.name,
      previewUrl: URL.createObjectURL(file),
    }));
    setSelectedImages((current) => [...current, ...nextImages]);
    setThreadError(null);
    event.target.value = "";
  }, []);

  const handleRemoveImage = useCallback((imageId: string) => {
    setSelectedImages((current) => {
      const image = current.find((item) => item.id === imageId);
      if (image) {
        URL.revokeObjectURL(image.previewUrl);
      }
      return current.filter((item) => item.id !== imageId);
    });
  }, []);

  const handleSend = useCallback(async () => {
    if (!socketRef.current || !loggedInUserId || !selectedConversation || sendInFlightRef.current) return;
    const trimmed = composerValue.trim();
    if (!trimmed && !selectedImages.length) return;
    sendInFlightRef.current = true;
    setSending(true);
    setThreadError(null);
    scrollToBottom("smooth");
    try {
      if (trimmed) {
        socketRef.current.emit("send_message", {
          sender_id: loggedInUserId,
          receiver_id: selectedConversation.otherUserId,
          type: "1",
          message: trimmed,
        });
      }

      for (const image of selectedImages) {
        const uploadedPath = await uploadFile(image.file);
        if (!uploadedPath) {
          throw new Error("Image upload did not return a saved path.");
        }
        socketRef.current.emit("send_message", {
          sender_id: loggedInUserId,
          receiver_id: selectedConversation.otherUserId,
          type: "2",
          message: uploadedPath,
          fileName: image.fileName,
        });
      }

      setComposerValue("");
      setSelectedImages((current) => {
        releaseImages(current);
        return [];
      });
      loadThread(selectedConversation.otherUserId);
    } catch (error) {
      setThreadError(error instanceof Error ? error.message : "Unable to send your message.");
    } finally {
      sendInFlightRef.current = false;
      setSending(false);
    }
  }, [composerValue, loadThread, loggedInUserId, releaseImages, scrollToBottom, selectedConversation, selectedImages]);

  if (loading) {
    return (
      <>
        <style>{styles}</style>
        <div className="msg-root">
          <div className="msg-auth">
            <p className="msg-kicker">Messages</p>
            <h1 className="msg-title">Loading your account</h1>
            <p className="msg-auth-copy">Checking your session and getting chat ready.</p>
          </div>
        </div>
      </>
    );
  }

  if (!loggedInUserId) {
    return (
      <>
        <style>{styles}</style>
        <div className="msg-root">
          <div className="msg-auth">
            <p className="msg-kicker">Messages</p>
            <h1 className="msg-title">Sign in to view conversations</h1>
            <p className="msg-auth-copy">
              Chat is tied to your authenticated Gumboot account — we need your session before registering you on the socket.
            </p>
            <Link className="msg-auth-link" href="/auth/login?next=/messages">
              Sign In
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className="msg-root">
        <div className="msg-shell">

          {/* ── Sidebar ── */}
          <aside className="msg-panel">
            <div className="msg-panel-header">
              <p className="msg-kicker">Inbox</p>
              <h1 className="msg-title">Messages</h1>
              <p className="msg-subtitle">Live chat via socket. Support has moved to its own page.</p>
              {socketError ? (
                <div className="msg-status error">{socketError}</div>
              ) : (
                <div className="msg-status info">{socketReady ? "Chat connected" : "Connecting..."}</div>
              )}
            </div>

            <div className="msg-list">
              {conversationsLoading ? (
                <div className="msg-empty">Loading conversations...</div>
              ) : conversations.length === 0 ? (
                <div className="msg-empty">No conversations yet.</div>
              ) : (
                conversations.map((conversation) => (
                  <div
                    key={conversation.otherUserId}
                    className={`msg-list-row ${selectedConversation?.otherUserId === conversation.otherUserId ? "active" : ""}`}
                  >
                    <button
                      className="msg-list-open"
                      type="button"
                      onClick={() => setSelectedOtherUserId(conversation.otherUserId)}
                    >
                      <div className="msg-list-avatar" aria-hidden="true">
                        {conversation.otherUserImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            alt=""
                            src={resolveUserImageUrl(conversation.otherUserImage)}
                            onError={(event) => {
                              event.currentTarget.style.display = "none";
                              const fallback = event.currentTarget.nextElementSibling as HTMLSpanElement | null;
                              if (fallback) fallback.style.display = "grid";
                            }}
                          />
                        ) : null}
                        <span
                          className="msg-list-avatar-fallback"
                          style={{ display: conversation.otherUserImage ? "none" : "grid" }}
                        >
                          {getInitials(conversation.otherUserName)}
                        </span>
                      </div>
                      <div className="msg-list-content">
                        <div className="msg-list-top">
                          <span className="msg-list-name">{conversation.otherUserName}</span>
                          <span className="msg-list-time">{formatTimestamp(conversation.latestMessageAt)}</span>
                        </div>
                        <div className="msg-list-preview">{conversation.latestMessage}</div>
                      </div>
                      <div className="msg-list-meta">
                        {conversation.unreadCount > 0 ? <span className="msg-list-badge">{conversation.unreadCount}</span> : null}
                      </div>
                    </button>
                    <Link
                      className="msg-list-profile-link"
                      href={buildPublicProfileHref({ userId: conversation.otherUserId })}
                    >
                      Profile
                    </Link>
                  </div>
                ))
              )}
            </div>
          </aside>

          {/* ── Thread panel ── */}
          <section className="msg-panel msg-thread">
            <div className="msg-thread-header">
              {selectedConversation ? (
                <Link
                  className="msg-thread-profile-link"
                  href={buildPublicProfileHref({ userId: selectedConversation.otherUserId })}
                >
                  <div className="msg-thread-head-avatar" aria-hidden="true">
                    {selectedConversation.otherUserImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        alt=""
                        src={resolveUserImageUrl(selectedConversation.otherUserImage)}
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                          const fallback = event.currentTarget.nextElementSibling as HTMLSpanElement | null;
                          if (fallback) fallback.style.display = "grid";
                        }}
                      />
                    ) : null}
                    <span
                      className="msg-list-avatar-fallback"
                      style={{ display: selectedConversation.otherUserImage ? "none" : "grid" }}
                    >
                      {getInitials(selectedConversation.otherUserName)}
                    </span>
                  </div>
                  <div className="msg-thread-head-copy">
                    <p className="msg-kicker">Thread</p>
                    <h2 className="msg-thread-name">{selectedConversation.otherUserName}</h2>
                    <p className="msg-thread-meta">
                      Opening this thread marks messages as read via the socket read_unread event.
                    </p>
                  </div>
                </Link>
              ) : (
                <div className="msg-thread-head-copy">
                  <p className="msg-kicker">Thread</p>
                  <h2 className="msg-thread-name">Choose a conversation</h2>
                  <p className="msg-thread-meta">
                    Select a conversation from the inbox to load the full thread.
                  </p>
                </div>
              )}
              {threadError ? <div className="msg-status error" style={{ marginTop: "8px" }}>{threadError}</div> : null}
            </div>

            <div className="msg-thread-body" onScroll={handleThreadScroll} ref={threadBodyRef}>
              {!selectedConversation ? (
                <div className="msg-empty center">Pick a conversation from the left to load messages.</div>
              ) : threadLoading ? (
                <div className="msg-empty center">Loading thread...</div>
              ) : messages.length === 0 ? (
                <div className="msg-empty center">No messages in this thread yet.</div>
              ) : (
                messages.map((message) => {
                  const mine = message.sender_id === loggedInUserId;
                  const mediaUrl = getImageMessageSource(message);
                  const showImage = Boolean(mediaUrl) && isImageMessage(message);
                  const showText = Boolean(message.message) && !showImage;
                  const initials = getInitials(selectedConversation?.otherUserName);
                  const incomingAvatar = selectedConversation?.otherUserImage
                    ? resolveUserImageUrl(selectedConversation.otherUserImage)
                    : "";

                  return (
                    <div key={message._id} className={`msg-bubble-wrap ${mine ? "mine" : ""}`}>
                      {!mine && (
                        <div className="msg-avatar" aria-hidden="true">
                          {incomingAvatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              alt=""
                              src={incomingAvatar}
                              onError={(event) => {
                                event.currentTarget.style.display = "none";
                                const fallback = event.currentTarget.nextElementSibling as HTMLSpanElement | null;
                                if (fallback) fallback.style.display = "grid";
                              }}
                            />
                          ) : null}
                          <span
                            className="msg-avatar-fallback"
                            style={{ display: incomingAvatar ? "none" : "grid" }}
                          >
                            {initials}
                          </span>
                        </div>
                      )}
                      <div className="msg-bubble">
                        {showImage ? (
                          <div className="msg-bubble-image-wrap">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              alt={message.fileName || "Shared image"}
                              className="msg-bubble-image"
                              loading="lazy"
                              onClick={() => {
                                const imageIndex = threadImages.findIndex((item) => item.id === message._id);
                                if (imageIndex >= 0) {
                                  setLightboxIndex(imageIndex);
                                }
                              }}
                              onError={(event) => {
                                event.currentTarget.style.display = "none";
                                const fallback = event.currentTarget.nextElementSibling as HTMLDivElement | null;
                                if (fallback) fallback.style.display = "grid";
                              }}
                              src={mediaUrl}
                            />
                            <div className="msg-bubble-image-fallback" style={{ display: "none" }}>Image unavailable</div>
                          </div>
                        ) : null}
                        {showText ? (
                          <div className="msg-bubble-text">{message.message}</div>
                        ) : null}
                        {!message.message && !showImage ? <div className="msg-bubble-text">(empty message)</div> : null}
                        <div className="msg-bubble-time">{formatTimestamp(message.createdAt)}</div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            <div className="msg-compose">
              {selectedImages.length ? (
                <div className="msg-staging">
                  <div className="msg-staging-header">
                    <span className="msg-staging-title">
                      {selectedImages.length} image{selectedImages.length === 1 ? "" : "s"} staged &amp; ready
                    </span>
                    <button
                      className="msg-staging-clear"
                      type="button"
                      onClick={() =>
                        setSelectedImages((current) => {
                          releaseImages(current);
                          return [];
                        })
                      }
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="msg-staging-scroll">
                    {selectedImages.map((image) => (
                      <div className="msg-staging-item" key={image.id}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          alt={image.fileName}
                          className="msg-staging-thumb"
                          src={image.previewUrl}
                        />
                        <div className="msg-staging-footer">
                          <span className="msg-staging-name">{image.fileName}</span>
                          <button
                            className="msg-staging-remove"
                            type="button"
                            onClick={() => handleRemoveImage(image.id)}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="msg-compose-tools">
                <button className="msg-picker-btn" disabled={!selectedConversation || sending} onClick={handlePickImage} type="button">
                  📎 Add Image
                </button>
                <span className="msg-compose-note">Text &amp; images via socket</span>
              </div>

              <input accept="image/*" hidden multiple onChange={handleImageChange} ref={fileInputRef} type="file" />

              <div className="msg-compose-row">
                <textarea
                  className="msg-textarea"
                  placeholder={selectedConversation ? "Write a message…" : "Select a conversation first"}
                  value={composerValue}
                  onChange={(event) => setComposerValue(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void handleSend();
                    }
                  }}
                  disabled={!selectedConversation || sending}
                />
                <button
                  className="msg-send"
                  type="button"
                  onClick={() => void handleSend()}
                  disabled={!selectedConversation || (!composerValue.trim() && !selectedImages.length) || sending}
                >
                  {sending ? "..." : "Send ↑"}
                </button>
              </div>
            </div>
          </section>

        </div>
        {activeLightboxImage ? (
          <div
            className="msg-lightbox"
            onClick={() => setLightboxIndex(null)}
            role="dialog"
            aria-modal="true"
            aria-label="Image viewer"
          >
            <div className="msg-lightbox-stage" onClick={(event) => event.stopPropagation()}>
              <button
                className="msg-lightbox-close"
                onClick={() => setLightboxIndex(null)}
                type="button"
                aria-label="Close image viewer"
              >
                ×
              </button>
              <button
                className="msg-lightbox-btn prev"
                onClick={() => setLightboxIndex((current) => (current === null ? current : Math.max(0, current - 1)))}
                type="button"
                aria-label="Previous image"
                disabled={lightboxIndex === 0}
              >
                ‹
              </button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="msg-lightbox-img" src={activeLightboxImage.src} alt={activeLightboxImage.label} />
              <button
                className="msg-lightbox-btn next"
                onClick={() =>
                  setLightboxIndex((current) =>
                    current === null ? current : Math.min(threadImages.length - 1, current + 1)
                  )
                }
                type="button"
                aria-label="Next image"
                disabled={lightboxIndex === threadImages.length - 1}
              >
                ›
              </button>
              <div className="msg-lightbox-meta">
                <div className="msg-lightbox-meta-card">
                  <span className="msg-lightbox-count">
                    {lightboxIndex + 1} / {threadImages.length}
                  </span>
                  <span className="msg-lightbox-caption">{activeLightboxImage.label}</span>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
