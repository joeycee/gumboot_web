"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

const PROFILE_DRAFT_KEY = "gumboot_signup_profile_setup";

type ProfileDraft = {
  bio: string;
  profilePhotoName: string;
  selfiePhotoName: string;
  idPhotoName: string;
};

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');

  .ps-root * { box-sizing: border-box; margin: 0; padding: 0; }
  .ps-root {
    min-height: 100dvh;
    background: #2A3439;
    color: #E5E5E5;
    font-family: 'DM Sans', sans-serif;
    padding: 34px 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-image:
      radial-gradient(ellipse at 20% 10%, rgba(91,110,127,0.18) 0%, transparent 55%),
      radial-gradient(ellipse at 80% 90%, rgba(38,166,154,0.08) 0%, transparent 50%);
  }
  .ps-card {
    width: 100%;
    max-width: 760px;
    border: 1px solid rgba(229,229,229,0.08);
    border-radius: 18px;
    background: #3E4A51;
    padding: 28px;
  }
  .ps-eyebrow {
    font-size: 10px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: rgba(229,229,229,0.38);
    margin-bottom: 10px;
  }
  .ps-title {
    font-family: 'DM Serif Display', serif;
    font-size: 34px;
    line-height: 1.1;
    margin-bottom: 8px;
  }
  .ps-sub {
    font-size: 13px;
    color: rgba(229,229,229,0.52);
    margin-bottom: 24px;
    line-height: 1.6;
  }
  .ps-label {
    display: block;
    font-size: 10px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(229,229,229,0.36);
    margin-bottom: 6px;
  }
  .ps-field { margin-bottom: 12px; }
  .ps-input,
  .ps-textarea {
    width: 100%;
    background: #2A3439;
    border: 1px solid rgba(229,229,229,0.12);
    border-radius: 10px;
    color: #E5E5E5;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    outline: none;
  }
  .ps-input {
    padding: 11px 12px;
  }
  .ps-textarea {
    min-height: 120px;
    padding: 12px;
    resize: vertical;
  }
  .ps-file-name {
    font-size: 12px;
    color: rgba(229,229,229,0.62);
    margin-top: 6px;
  }
  .ps-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;
  }
  @media (min-width: 760px) {
    .ps-grid { grid-template-columns: 1fr 1fr; }
  }
  .ps-error {
    border: 1px solid rgba(183,91,91,0.42);
    background: rgba(183,91,91,0.12);
    border-radius: 10px;
    padding: 10px 12px;
    color: rgba(245,196,196,0.95);
    font-size: 13px;
    margin-bottom: 12px;
  }
  .ps-actions {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    margin-top: 14px;
  }
  .ps-btn {
    border: none;
    border-radius: 10px;
    padding: 12px 14px;
    font-family: 'DM Sans', sans-serif;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    cursor: pointer;
  }
  .ps-btn-secondary {
    background: rgba(229,229,229,0.1);
    color: #E5E5E5;
  }
  .ps-btn-primary {
    background: #26A69A;
    color: #fff;
    font-weight: 600;
  }
`;

function readDraft(): ProfileDraft {
  if (typeof window === "undefined") {
    return { bio: "", profilePhotoName: "", selfiePhotoName: "", idPhotoName: "" };
  }
  const raw = window.localStorage.getItem(PROFILE_DRAFT_KEY);
  if (!raw) return { bio: "", profilePhotoName: "", selfiePhotoName: "", idPhotoName: "" };
  try {
    const parsed = JSON.parse(raw) as Partial<ProfileDraft>;
    return {
      bio: parsed.bio ?? "",
      profilePhotoName: parsed.profilePhotoName ?? "",
      selfiePhotoName: parsed.selfiePhotoName ?? "",
      idPhotoName: parsed.idPhotoName ?? "",
    };
  } catch {
    return { bio: "", profilePhotoName: "", selfiePhotoName: "", idPhotoName: "" };
  }
}

export default function ProfileSetupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next");
  const [bio, setBio] = useState(() => readDraft().bio);
  const [profilePhotoName, setProfilePhotoName] = useState(
    () => readDraft().profilePhotoName
  );
  const [selfiePhotoName, setSelfiePhotoName] = useState(
    () => readDraft().selfiePhotoName
  );
  const [idPhotoName, setIdPhotoName] = useState(() => readDraft().idPhotoName);
  const [error, setError] = useState<string | null>(null);

  function saveDraft(next: ProfileDraft) {
    window.localStorage.setItem(PROFILE_DRAFT_KEY, JSON.stringify(next));
  }

  function onFileChange(
    event: React.ChangeEvent<HTMLInputElement>,
    setter: (name: string) => void
  ) {
    const file = event.target.files?.[0];
    if (!file) return;
    setter(file.name);
  }

  function handleContinue(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!bio.trim()) {
      setError("Please add a short bio.");
      return;
    }
    if (!profilePhotoName || !selfiePhotoName || !idPhotoName) {
      setError("Please add all 3 photos before continuing.");
      return;
    }
    saveDraft({ bio: bio.trim(), profilePhotoName, selfiePhotoName, idPhotoName });
    router.push(
      nextPath
        ? `/auth/signup/payment-setup?next=${encodeURIComponent(nextPath)}`
        : "/auth/signup/payment-setup"
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className="ps-root">
        <section className="ps-card">
          <p className="ps-eyebrow">Signup • Step 2 of 3</p>
          <h1 className="ps-title">Profile setup</h1>
          <p className="ps-sub">
            Add your public profile and identity files. ID verification is reviewed manually in admin.
          </p>

          {error && <div className="ps-error">{error}</div>}

          <form onSubmit={handleContinue}>
            <div className="ps-field">
              <label className="ps-label">Bio</label>
              <textarea
                className="ps-textarea"
                placeholder="Tell people about your background and the work you do."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>

            <div className="ps-grid">
              <div className="ps-field">
                <label className="ps-label">Profile photo</label>
                <input
                  className="ps-input"
                  type="file"
                  accept="image/*"
                  onChange={(e) => onFileChange(e, setProfilePhotoName)}
                />
                <p className="ps-file-name">{profilePhotoName || "No file selected"}</p>
              </div>
              <div className="ps-field">
                <label className="ps-label">Selfie photo</label>
                <input
                  className="ps-input"
                  type="file"
                  accept="image/*"
                  onChange={(e) => onFileChange(e, setSelfiePhotoName)}
                />
                <p className="ps-file-name">{selfiePhotoName || "No file selected"}</p>
              </div>
            </div>

            <div className="ps-field">
              <label className="ps-label">ID photo</label>
              <input
                className="ps-input"
                type="file"
                accept="image/*"
                onChange={(e) => onFileChange(e, setIdPhotoName)}
              />
              <p className="ps-file-name">{idPhotoName || "No file selected"}</p>
            </div>

            <div className="ps-actions">
              <button
                type="button"
                className="ps-btn ps-btn-secondary"
                onClick={() => router.push("/auth/signup")}
              >
                Back
              </button>
              <button type="submit" className="ps-btn ps-btn-primary">
                Continue
              </button>
            </div>
          </form>
        </section>
      </div>
    </>
  );
}
