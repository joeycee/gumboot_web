"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ApiError } from "@/lib/api";
import { addTool, getSkillList, getToolsList, submitIdVerification, updateProfile, type SkillOption, type ToolOption } from "@/lib/account";

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
  .ps-grid {
    display: grid;
    gap: 18px;
    grid-template-columns: 1fr;
  }
  @media (min-width: 860px) {
    .ps-grid { grid-template-columns: 1.15fr 0.85fr; }
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
  .ps-select {
    width: 100%;
    background: #2A3439;
    border: 1px solid rgba(229,229,229,0.12);
    border-radius: 10px;
    color: #E5E5E5;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    outline: none;
  }
  .ps-input, .ps-select { padding: 11px 12px; }
  .ps-textarea {
    min-height: 120px;
    padding: 12px;
    resize: vertical;
  }
  .ps-select { min-height: 132px; }
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
  .ps-addtool {
    display: flex;
    gap: 8px;
    margin-top: 10px;
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

function getSelectedValues(event: React.ChangeEvent<HTMLSelectElement>) {
  return Array.from(event.target.selectedOptions).map((option) => option.value);
}

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
  const [skills, setSkills] = useState<SkillOption[]>([]);
  const [tools, setTools] = useState<ToolOption[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [newToolName, setNewToolName] = useState("");
  const [loadingLists, setLoadingLists] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addingTool, setAddingTool] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingLists(true);
        const [skillRes, toolRes] = await Promise.all([getSkillList(), getToolsList()]);
        if (cancelled) return;
        setSkills(Array.isArray(skillRes.body) ? skillRes.body : []);
        setTools(Array.isArray(toolRes.body) ? toolRes.body : []);
      } catch (nextError) {
        if (cancelled) return;
        setError(nextError instanceof Error ? nextError.message : "Unable to load worker setup lists.");
      } finally {
        if (!cancelled) setLoadingLists(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleAddTool() {
    if (!newToolName.trim()) return;
    try {
      setAddingTool(true);
      setError(null);
      const response = await addTool(newToolName.trim());
      const addedTool = response.body;
      if (addedTool && typeof addedTool === "object") {
        const option = addedTool as ToolOption;
        setTools((current) => {
          const next = [...current, option];
          return next.sort((a, b) => String(a.tool_name ?? "").localeCompare(String(b.tool_name ?? "")));
        });
        if (option._id) {
          setSelectedTools((current) => Array.from(new Set([...current, option._id ?? ""])));
        }
      }
      setNewToolName("");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to add tool.");
    } finally {
      setAddingTool(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!bio.trim()) {
      setError("Please add a short bio.");
      return;
    }
    if (!selfiePhoto || !idPhoto) {
      setError("Please upload both the selfie photo and ID photo.");
      return;
    }

    try {
      setSaving(true);

      if (profilePhoto) {
        await updateProfile({ bio: bio.trim(), image: profilePhoto });
      }

      await submitIdVerification({
        bio: bio.trim(),
        selfie: selfiePhoto,
        idproof: idPhoto,
        skillIds: selectedSkills,
        toolIds: selectedTools,
      });

      setSuccess("Profile details saved.");
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
          <p className="ps-eyebrow">{isSettingsMode ? "Worker Setup" : "Signup • Step 2 of 3"}</p>
          <h1 className="ps-title">{isSettingsMode ? "Verification and worker setup" : "Profile setup"}</h1>
          <p className="ps-sub">
            Your profile photo is uploaded separately from identity documents, and files stay in memory until you submit.
            Nothing on this screen is written to browser storage.
          </p>

          {error ? <div className="ps-error">{error}</div> : null}
          {success ? <div className="ps-success">{success}</div> : null}
          <div className="ps-note">
            Select any existing skills or tools you already use. If a tool is missing, you can add it before saving.
          </div>

          <form onSubmit={handleSubmit}>
            <div className="ps-grid">
              <section className="ps-panel">
                <h2 className="ps-panel-title">Identity and bio</h2>
                <div className="ps-field">
                  <label className="ps-label">Bio</label>
                  <textarea
                    className="ps-textarea"
                    placeholder="Tell people about your background, experience, and what kind of work you do."
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

              <section className="ps-panel">
                <h2 className="ps-panel-title">Skills and tools</h2>
                {loadingLists ? <div className="ps-note">Loading lists…</div> : null}

                <div className="ps-field">
                  <label className="ps-label">Skills</label>
                  <select
                    className="ps-select"
                    multiple
                    value={selectedSkills}
                    onChange={(event) => setSelectedSkills(getSelectedValues(event))}
                  >
                    {skills.map((skill) => (
                      <option key={skill._id} value={skill._id}>
                        {skill.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="ps-field">
                  <label className="ps-label">Tools</label>
                  <select
                    className="ps-select"
                    multiple
                    value={selectedTools}
                    onChange={(event) => setSelectedTools(getSelectedValues(event))}
                  >
                    {tools.map((tool) => (
                      <option key={tool._id} value={tool._id}>
                        {tool.tool_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="ps-field">
                  <label className="ps-label">Add a missing tool</label>
                  <div className="ps-addtool">
                    <input
                      className="ps-input"
                      value={newToolName}
                      onChange={(event) => setNewToolName(event.target.value)}
                      placeholder="Example: Wet saw"
                    />
                    <button className="ps-btn ps-btn-secondary" disabled={addingTool || !newToolName.trim()} onClick={handleAddTool} type="button">
                      {addingTool ? "Adding…" : "Add tool"}
                    </button>
                  </div>
                </div>
              </section>
            </div>

            <div className="ps-actions">
              <button
                className="ps-btn ps-btn-secondary"
                onClick={() => router.push(isSettingsMode ? "/profile/settings" : "/profile")}
                type="button"
              >
                Cancel
              </button>
              <button className="ps-btn ps-btn-primary" disabled={saving || loadingLists} type="submit">
                {saving ? "Saving…" : isSettingsMode ? "Save worker setup" : "Continue"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </>
  );
}
