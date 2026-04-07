"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ApiError, clearAuthToken } from "@/lib/api";
import { changeRole, deleteAccount, updateProfile } from "@/lib/account";
import { useMe } from "@/lib/useMe";

type MeUser = {
  _id?: string;
  firstname?: string;
  lastname?: string;
  email?: string;
  bio?: string;
  role?: string | number;
};

const styles = `
  .pset-root * { box-sizing: border-box; }
  .pset-root {
    min-height: calc(100vh - 56px);
    padding: 28px 16px 72px;
    background:
      radial-gradient(880px 520px at 10% 0%, rgba(91,110,127,0.18), rgba(0,0,0,0) 58%),
      linear-gradient(180deg, #2A3439, #20282c);
    color: #E5E5E5;
    font-family: 'DM Sans', sans-serif;
  }
  .pset-shell { max-width: 980px; margin: 0 auto; display: grid; gap: 16px; }
  .pset-card {
    border: 1px solid rgba(229,229,229,0.10);
    border-radius: 18px;
    background: rgba(62,74,81,0.82);
    box-shadow: 0 18px 50px rgba(0,0,0,0.28);
    backdrop-filter: blur(10px);
    padding: 22px;
  }
  .pset-eyebrow {
    margin: 0 0 8px;
    font-size: 10px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: rgba(229,229,229,0.40);
  }
  .pset-title {
    margin: 0;
    font-family: 'DM Serif Display', serif;
    font-size: 34px;
    line-height: 1.05;
    font-weight: 400;
  }
  .pset-sub {
    margin: 10px 0 0;
    color: rgba(229,229,229,0.62);
    line-height: 1.7;
    font-size: 14px;
    max-width: 720px;
  }
  .pset-grid {
    display: grid;
    gap: 16px;
    grid-template-columns: 1fr;
  }
  @media (min-width: 900px) {
    .pset-grid { grid-template-columns: 1.1fr 0.9fr; }
  }
  .pset-section-title {
    margin: 0 0 14px;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: rgba(229,229,229,0.36);
  }
  .pset-field { margin-bottom: 12px; }
  .pset-label {
    display: block;
    font-size: 10px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(229,229,229,0.42);
    margin-bottom: 6px;
  }
  .pset-input, .pset-textarea, .pset-select {
    width: 100%;
    border-radius: 12px;
    border: 1px solid rgba(229,229,229,0.12);
    background: #2A3439;
    color: #E5E5E5;
    padding: 12px 13px;
    font: inherit;
    outline: none;
  }
  .pset-textarea { min-height: 120px; resize: vertical; }
  .pset-row { display: grid; gap: 12px; grid-template-columns: 1fr; }
  @media (min-width: 640px) {
    .pset-row { grid-template-columns: 1fr 1fr; }
  }
  .pset-actions { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 14px; }
  .pset-btn, .pset-linkbtn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: none;
    border-radius: 12px;
    padding: 12px 15px;
    font: inherit;
    font-size: 12px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    cursor: pointer;
    text-decoration: none;
  }
  .pset-btn.primary, .pset-linkbtn.primary { background: #26A69A; color: #fff; font-weight: 600; }
  .pset-btn.secondary, .pset-linkbtn.secondary {
    background: rgba(229,229,229,0.08);
    color: #E5E5E5;
    border: 1px solid rgba(229,229,229,0.12);
  }
  .pset-btn.danger {
    background: rgba(183,91,91,0.16);
    color: #ffe0e0;
    border: 1px solid rgba(183,91,91,0.34);
  }
  .pset-status {
    border-radius: 12px;
    padding: 12px 14px;
    font-size: 13px;
    line-height: 1.6;
    margin-bottom: 14px;
  }
  .pset-status.error {
    border: 1px solid rgba(183,91,91,0.38);
    background: rgba(183,91,91,0.14);
    color: rgba(255,220,220,0.92);
  }
  .pset-status.success {
    border: 1px solid rgba(38,166,154,0.34);
    background: rgba(38,166,154,0.12);
    color: rgba(229,245,242,0.94);
  }
  .pset-list { display: grid; gap: 10px; }
  .pset-item {
    border: 1px solid rgba(229,229,229,0.10);
    border-radius: 14px;
    background: rgba(42,52,57,0.52);
    padding: 14px;
  }
  .pset-item-title {
    font-size: 14px;
    font-weight: 600;
    color: #F0F0F0;
  }
  .pset-item-copy {
    margin-top: 6px;
    color: rgba(229,229,229,0.62);
    line-height: 1.6;
    font-size: 13px;
  }
`;

export default function ProfileSettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useMe();
  const me = (user ?? null) as MeUser | null;

  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [role, setRole] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(searchParams.get("saved") ? "Saved successfully." : null);

  useEffect(() => {
    if (!me) return;
    setFirstname(me.firstname ?? "");
    setLastname(me.lastname ?? "");
    setEmail(me.email ?? "");
    setBio(me.bio ?? "");
    setRole(String(me.role ?? ""));
  }, [me]);

  useEffect(() => {
    if (loading) return;
    if (!me?._id) {
      router.replace("/auth/login?next=/profile/settings");
    }
  }, [loading, me?._id, router]);

  async function handleSaveProfile(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      setSaving(true);
      await updateProfile({
        firstname,
        lastname,
        email,
        bio,
        image,
      });
      setSuccess("Profile updated.");
      setImage(null);
    } catch (nextError) {
      if (nextError instanceof ApiError && (nextError.status === 401 || nextError.status === 403)) {
        router.replace("/auth/login?next=/profile/settings");
        return;
      }
      setError(nextError instanceof Error ? nextError.message : "Unable to update profile.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRoleChange() {
    if (!role) return;
    setError(null);
    setSuccess(null);
    try {
      setSaving(true);
      await changeRole(role);
      setSuccess("Role updated.");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to change role.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAccount() {
    const confirmed = window.confirm("Delete this account permanently?");
    if (!confirmed) return;
    setError(null);
    setSuccess(null);
    try {
      setSaving(true);
      await deleteAccount();
      clearAuthToken();
      router.replace("/");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to delete account.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <style>{styles}</style>
      <div className="pset-root">
        <div className="pset-shell">
          <section className="pset-card">
            <p className="pset-eyebrow">Profile Settings</p>
            <h1 className="pset-title">Manage your account</h1>
            <p className="pset-sub">
              Update your profile details, switch role, and jump into worker verification, payments, reconnects, and job management from one place.
            </p>
          </section>

          {error ? <div className="pset-status error">{error}</div> : null}
          {success ? <div className="pset-status success">{success}</div> : null}

          <div className="pset-grid">
            <form className="pset-card" onSubmit={handleSaveProfile}>
              <h2 className="pset-section-title">Edit profile</h2>
              <div className="pset-row">
                <div className="pset-field">
                  <label className="pset-label">First name</label>
                  <input className="pset-input" value={firstname} onChange={(e) => setFirstname(e.target.value)} />
                </div>
                <div className="pset-field">
                  <label className="pset-label">Last name</label>
                  <input className="pset-input" value={lastname} onChange={(e) => setLastname(e.target.value)} />
                </div>
              </div>
              <div className="pset-field">
                <label className="pset-label">Email</label>
                <input className="pset-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="pset-field">
                <label className="pset-label">Bio</label>
                <textarea className="pset-textarea" value={bio} onChange={(e) => setBio(e.target.value)} />
              </div>
              <div className="pset-field">
                <label className="pset-label">Profile photo</label>
                <input className="pset-input" type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] ?? null)} />
              </div>
              <div className="pset-actions">
                <button className="pset-btn primary" disabled={saving} type="submit">
                  {saving ? "Saving…" : "Save profile"}
                </button>
              </div>
            </form>

            <section className="pset-card">
              <h2 className="pset-section-title">Account controls</h2>
              <div className="pset-field">
                <label className="pset-label">Role</label>
                <select className="pset-select" value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="1">Employer</option>
                  <option value="2">Worker</option>
                </select>
              </div>
              <div className="pset-actions">
                <button className="pset-btn secondary" disabled={saving} onClick={handleRoleChange} type="button">
                  Update role
                </button>
                <button className="pset-btn danger" disabled={saving} onClick={handleDeleteAccount} type="button">
                  Delete account
                </button>
              </div>

              <div className="pset-list" style={{ marginTop: 20 }}>
                <div className="pset-item">
                  <div className="pset-item-title">Worker setup</div>
                  <div className="pset-item-copy">Upload identity documents, manage skills, and add tools.</div>
                  <div className="pset-actions">
                    <Link className="pset-linkbtn secondary" href="/auth/signup/profile-setup?mode=settings">
                      Open worker setup
                    </Link>
                  </div>
                </div>
                <div className="pset-item">
                  <div className="pset-item-title">Payment setup</div>
                  <div className="pset-item-copy">Add or refresh bank and card details without storing drafts locally.</div>
                  <div className="pset-actions">
                    <Link className="pset-linkbtn secondary" href="/auth/signup/payment-setup?mode=settings">
                      Open billing setup
                    </Link>
                  </div>
                </div>
                <div className="pset-item">
                  <div className="pset-item-title">Reconnect list</div>
                  <div className="pset-item-copy">Manage workers you want to reconnect with later.</div>
                  <div className="pset-actions">
                    <Link className="pset-linkbtn secondary" href="/profile/reconnect">
                      Open reconnects
                    </Link>
                  </div>
                </div>
                <div className="pset-item">
                  <div className="pset-item-title">Job management</div>
                  <div className="pset-item-copy">Edit, cancel, or delete your jobs and review completed work.</div>
                  <div className="pset-actions">
                    <Link className="pset-linkbtn secondary" href="/jobs/manage">
                      Open jobs
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
