"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ApiError } from "@/lib/api";
import { submitIdVerification, updateProfile } from "@/lib/account";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');

  .ps-root * { box-sizing: border-box; margin: 0; padding: 0; }
  .ps-root {
    min-height: calc(100vh - 56px);
    background:
      radial-gradient(ellipse at 20% 10%, rgba(91,110,127,0.18) 0%, transparent 55%),
      radial-gradient(ellipse at 80% 90%, rgba(38,166,154,0.08) 0%, transparent 50%),
      #2A3439;
    color: #E5E5E5;
    font-family: 'DM Sans', sans-serif;
    padding: 34px 20px 72px;
  }
  .ps-card {
    width: 100%;
    max-width: 900px;
    margin: 0 auto;
    border: 1px solid rgba(229,229,229,0.08);
    border-radius: 18px;
    background: rgba(62,74,81,0.85);
    padding: 28px;
    box-shadow: 0 18px 50px rgba(0,0,0,0.28);
  }
  .ps-back {
    display: inline-flex;
    margin-bottom: 18px;
    color: rgba(229,229,229,0.60);
    text-decoration: none;
    font-size: 11px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
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
    color: rgba(229,229,229,0.56);
    margin-bottom: 24px;
    line-height: 1.7;
    max-width: 700px;
  }
  .ps-panel {
    border: 1px solid rgba(229,229,229,0.08);
    border-radius: 16px;
    background: rgba(42,52,57,0.52);
    padding: 16px;
  }
  .ps-panel-title {
    font-size: 11px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(229,229,229,0.42);
    margin-bottom: 14px;
  }
  .ps-field { margin-bottom: 12px; }
  .ps-label {
    display: block;
    font-size: 10px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(229,229,229,0.36);
    margin-bottom: 6px;
  }
  .ps-input,
  .ps-textarea,
  .ps-input {
    width: 100%;
    background: #2A3439;
    border: 1px solid rgba(229,229,229,0.12);
    border-radius: 10px;
    color: #E5E5E5;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    outline: none;
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
  .ps-inline {
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;
  }
  @media (min-width: 640px) {
    .ps-inline { grid-template-columns: 1fr 1fr; }
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
  .ps-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  .ps-error, .ps-success, .ps-note {
    border-radius: 10px;
    padding: 10px 12px;
    font-size: 13px;
    margin-bottom: 12px;
    line-height: 1.6;
  }
  .ps-error {
    border: 1px solid rgba(183,91,91,0.42);
    background: rgba(183,91,91,0.12);
    color: rgba(245,196,196,0.95);
  }
  .ps-success {
    border: 1px solid rgba(38,166,154,0.40);
    background: rgba(38,166,154,0.12);
    color: rgba(229,245,242,0.94);
  }
  .ps-note {
    border: 1px solid rgba(229,229,229,0.10);
    background: rgba(229,229,229,0.05);
    color: rgba(229,229,229,0.68);
  }
  .ps-actions {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    margin-top: 16px;
    flex-wrap: wrap;
  }
`;

function formatFileName(file: File | null) {
  if (!file) return "No file selected";
  return `${file.name} (${Math.round(file.size / 1024)} KB)`;
}

export default function ProfileSetupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next");
  const isSettingsMode = useMemo(() => searchParams.get("mode") === "settings", [searchParams]);

  const [bio, setBio] = useState("");
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [selfiePhoto, setSelfiePhoto] = useState<File | null>(null);
  const [idPhoto, setIdPhoto] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if ((selfiePhoto && !idPhoto) || (!selfiePhoto && idPhoto)) {
      setError("Please upload both the selfie photo and ID photo, or skip for now.");
      return;
    }

    try {
      setSaving(true);

      if (profilePhoto || bio.trim()) {
        await updateProfile({ bio: bio.trim(), image: profilePhoto });
      }

      if (selfiePhoto && idPhoto) {
        await submitIdVerification({
          bio: bio.trim(),
          selfie: selfiePhoto,
          idproof: idPhoto,
        });
      }

      setSuccess(selfiePhoto && idPhoto ? "ID verification details saved." : "You can finish ID verification later.");
      window.setTimeout(() => {
        router.push(
          isSettingsMode
            ? "/profile/settings?saved=1"
            : nextPath
              ? `/auth/signup/payment-setup?next=${encodeURIComponent(nextPath)}`
              : "/auth/signup/payment-setup"
        );
      }, 500);
    } catch (nextError) {
      if (nextError instanceof ApiError && (nextError.status === 401 || nextError.status === 403)) {
        router.replace(`/auth/login?next=${encodeURIComponent("/auth/signup/profile-setup")}`);
        return;
      }
      setError(nextError instanceof Error ? nextError.message : "Unable to save your profile details.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <style>{styles}</style>
      <div className="ps-root">
        <section className="ps-card">
          <Link className="ps-back" href={isSettingsMode ? "/profile/settings" : "/auth/signup"}>
            Back
          </Link>
          <p className="ps-eyebrow">{isSettingsMode ? "Account Verification" : "Signup • Step 2 of 3"}</p>
          <h1 className="ps-title">{isSettingsMode ? "Profile and ID verification" : "Finish your profile"}</h1>
          <p className="ps-sub">
            There is one shared account now. Upload your ID documents here if you have them ready, or skip for now and
            finish it later before posting a job or sending an offer.
          </p>

          {error ? <div className="ps-error">{error}</div> : null}
          {success ? <div className="ps-success">{success}</div> : null}
          <div className="ps-note">
            Identity files stay in memory until you submit. Nothing on this screen is written to browser storage.
          </div>

          <form onSubmit={handleSubmit}>
            <section className="ps-panel">
              <h2 className="ps-panel-title">Identity and profile</h2>
              <div className="ps-field">
                <label className="ps-label">Bio</label>
                <textarea
                  className="ps-textarea"
                  placeholder="Tell people a little about yourself and the kind of jobs you use Gumboot for."
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                />
              </div>

              <div className="ps-inline">
                <div className="ps-field">
                  <label className="ps-label">Profile photo</label>
                  <input
                    className="ps-input"
                    type="file"
                    accept="image/*"
                    onChange={(event) => setProfilePhoto(event.target.files?.[0] ?? null)}
                  />
                  <p className="ps-file-name">{formatFileName(profilePhoto)}</p>
                </div>
                <div className="ps-field">
                  <label className="ps-label">Selfie photo</label>
                  <input
                    className="ps-input"
                    type="file"
                    accept="image/*"
                    onChange={(event) => setSelfiePhoto(event.target.files?.[0] ?? null)}
                  />
                  <p className="ps-file-name">{formatFileName(selfiePhoto)}</p>
                </div>
              </div>

              <div className="ps-field">
                <label className="ps-label">ID photo</label>
                <input
                  className="ps-input"
                  type="file"
                  accept="image/*"
                  onChange={(event) => setIdPhoto(event.target.files?.[0] ?? null)}
                />
                <p className="ps-file-name">{formatFileName(idPhoto)}</p>
              </div>
            </section>

            <div className="ps-actions">
              <button
                className="ps-btn ps-btn-secondary"
                onClick={() => router.push(isSettingsMode ? "/profile/settings" : "/profile")}
                type="button"
              >
                Cancel
              </button>
              {!isSettingsMode ? (
                <button
                  className="ps-btn ps-btn-secondary"
                  disabled={saving}
                  onClick={() => {
                    router.push(
                      nextPath
                        ? `/auth/signup/payment-setup?next=${encodeURIComponent(nextPath)}`
                        : "/auth/signup/payment-setup"
                    );
                  }}
                  type="button"
                >
                  Skip for now
                </button>
              ) : null}
              <button className="ps-btn ps-btn-primary" disabled={saving} type="submit">
                {saving ? "Saving…" : isSettingsMode ? "Save verification" : "Continue"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </>
  );
}
