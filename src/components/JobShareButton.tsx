"use client";

import type { MouseEvent as ReactMouseEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { JobShareContent } from "@/lib/jobShare";

type JobShareButtonProps = {
  share: JobShareContent | null;
  className?: string;
  label?: string;
  compact?: boolean;
  onClick?: (event: ReactMouseEvent<HTMLElement>) => void;
};

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

const ICONS = {
  share: "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/share.svg",
  device: "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/box-arrow-up.svg",
  facebook: "https://cdn.jsdelivr.net/npm/simple-icons@16.21.0/icons/facebook.svg",
  whatsapp: "https://cdn.jsdelivr.net/npm/simple-icons@16.21.0/icons/whatsapp.svg",
  sms: "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/chat-square-text.svg",
  copy: "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/copy.svg",
  close: "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/x-lg.svg",
} as const;

function trackShareEvent(name: string, payload: Record<string, unknown>) {
  if (typeof window === "undefined") return;

  const windowRecord = window as typeof window & {
    gtag?: (...args: unknown[]) => void;
    plausible?: (eventName: string, options?: { props?: Record<string, unknown> }) => void;
    analytics?: { track?: (eventName: string, properties?: Record<string, unknown>) => void };
  };

  windowRecord.gtag?.("event", name, payload);
  windowRecord.plausible?.(name, { props: payload });
  windowRecord.analytics?.track?.(name, payload);
}

async function fallbackCopyToClipboard(value: string) {
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  textarea.style.pointerEvents = "none";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  const success = document.execCommand("copy");
  document.body.removeChild(textarea);
  if (!success) {
    throw new Error("Copy command was not available.");
  }
}

export function JobShareButton({
  share,
  className,
  label = "Share job",
  compact = false,
  onClick,
}: JobShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "success" | "error">("idle");
  const [shareError, setShareError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target) && !panelRef.current?.contains(target)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (copyState === "idle") return;
    const timeout = window.setTimeout(() => setCopyState("idle"), 2200);
    return () => window.clearTimeout(timeout);
  }, [copyState]);

  if (!share) {
    return (
      <button type="button" className={cx("jsb-trigger", compact && "compact", className)} disabled>
        <IconImage src={ICONS.share} alt="" />
        <span>{label}</span>
      </button>
    );
  }

  const shareData = share;

  const nativeShareSupported =
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function" &&
    typeof window !== "undefined";
  const shareUrl = shareData.url;
  const shareMessage = `${shareData.shareText} ${shareUrl}`;
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedMessage = encodeURIComponent(shareMessage);
  const facebookHref = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
  const whatsappHref = `https://wa.me/?text=${encodedMessage}`;
  const smsHref = `sms:?&body=${encodedMessage}`;

  async function handleNativeShare() {
    if (!nativeShareSupported) return;
    setShareError(null);

    try {
      await navigator.share({
        title: shareData.shareTitle,
        text: shareData.shareText,
        url: shareUrl,
      });
      trackShareEvent("job_share_native", { job_id: shareData.id });
      setOpen(false);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      setShareError("We couldn't open your device share menu.");
    }
  }

  async function handleCopyLink() {
    setShareError(null);

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        await fallbackCopyToClipboard(shareUrl);
      }
      setCopyState("success");
      trackShareEvent("job_share_copy_link", { job_id: shareData.id });
    } catch {
      setCopyState("error");
      setShareError("Copy failed. You can still use the other share options.");
    }
  }

  function handleFacebookShare() {
    if (typeof window === "undefined") return;
    window.open(facebookHref, "_blank", "noopener,noreferrer,width=600,height=600");
    handleOptionClick("job_share_facebook");
  }

  function handleOpen(event: ReactMouseEvent<HTMLElement>) {
    event.preventDefault();
    event.stopPropagation();
    onClick?.(event);
    setCopyState("idle");
    setShareError(null);
    setOpen((current) => {
      const next = !current;
      if (next) {
        trackShareEvent("job_share_opened", { job_id: shareData.id });
      }
      return next;
    });
  }

  function handleOptionClick(name: string) {
    trackShareEvent(name, { job_id: shareData.id });
    setOpen(false);
  }

  return (
    <div
      className="jsb-root"
      ref={rootRef}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <button type="button" className={cx("jsb-trigger", compact && "compact", className)} onClick={handleOpen}>
        <IconImage src={ICONS.share} alt="" />
        <span>{label}</span>
      </button>

      {open && typeof document !== "undefined"
        ? createPortal(
            <div className="jsb-overlay" onClick={() => setOpen(false)} aria-hidden="true">
              <div
                ref={panelRef}
                className="jsb-panel"
                role="dialog"
                aria-modal="true"
                aria-label="Share job"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="jsb-panel-head">
                  <div>
                    <div className="jsb-panel-label">Share job</div>
                    <div className="jsb-panel-title">{shareData.title}</div>
                  </div>
                  <button type="button" className="jsb-close" onClick={() => setOpen(false)} aria-label="Close share options">
                    <IconImage src={ICONS.close} alt="" />
                  </button>
                </div>

                {nativeShareSupported ? (
                  <button type="button" className="jsb-primary" onClick={handleNativeShare}>
                    <IconImage src={ICONS.device} alt="" />
                    <span>Share via device</span>
                  </button>
                ) : null}

                <div className="jsb-options">
                  <button type="button" className="jsb-option" onClick={handleFacebookShare}>
                    <IconImage src={ICONS.facebook} alt="" invert />
                    <span>Share on Facebook</span>
                  </button>
                  <a className="jsb-option" href={whatsappHref} target="_blank" rel="noreferrer" onClick={() => handleOptionClick("job_share_whatsapp")}>
                    <IconImage src={ICONS.whatsapp} alt="" invert />
                    <span>WhatsApp</span>
                  </a>
                  <a className="jsb-option" href={smsHref} onClick={() => handleOptionClick("job_share_sms")}>
                    <IconImage src={ICONS.sms} alt="" />
                    <span>SMS</span>
                  </a>
                  <button type="button" className="jsb-option" onClick={handleCopyLink}>
                    <IconImage src={ICONS.copy} alt="" />
                    <span>{copyState === "success" ? "Link copied" : "Copy link"}</span>
                  </button>
                </div>

                {shareError ? <div className="jsb-feedback error">{shareError}</div> : null}
                {copyState === "error" ? <div className="jsb-feedback error">Copy failed. Try another option.</div> : null}
                {copyState === "success" ? <div className="jsb-feedback">Link copied</div> : null}
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}

function IconImage({ src, alt, invert = false }: { src: string; alt: string; invert?: boolean }) {
  return (
    <img
      className={cx("jsb-icon", invert && "invert")}
      src={src}
      alt={alt}
      aria-hidden={alt ? undefined : "true"}
    />
  );
}
