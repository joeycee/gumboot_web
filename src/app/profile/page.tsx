"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const PROFILE_ENDPOINT = "https://api.gumboot.app/api/profile";
const API_BASE = "https://api.gumboot.app";
const TOKEN_STORAGE_KEYS = ["gumboot_token", "token"];
const PROFILE_SETUP_DRAFT_KEY = "gumboot_signup_profile_setup";
const PROFILE_CUSTOM_FIELDS_KEY = "gumboot_profile_custom_fields";

type Skill = { _id: string; name: string; image?: string[] };
type RatingData = { count: number; averageRating: number };
type ProfileData = {
  _id: string;
  firstname?: string;
  lastname?: string;
  email?: string;
  image?: string;
  bio?: string;
  skill?: Skill[];
  tools?: Array<{ _id?: string; name?: string } | string>;
  verified_user?: number;
};
type ProfileResponse = {
  success: boolean;
  code: number;
  message: string;
  body: { profiledata: ProfileData; ratingdata: RatingData };
};
type ProfileCustomFields = { skills: string[]; tools: string[] };

const buildImageUrl = (p?: string) =>
  p ? (p.startsWith("http") ? p : `${API_BASE}${p}`) : "/placeholder.png";

function getAuthToken() {
  if (typeof window === "undefined") return null;
  for (const key of TOKEN_STORAGE_KEYS) {
    const val = window.localStorage.getItem(key);
    if (val) return val;
  }
  return null;
}

function isDevLocalSession(token: string | null) {
  const inDevMode =
    process.env.NEXT_PUBLIC_TWILIO_MODE === "development" ||
    process.env.TWILIO_MODE === "development";
  return inDevMode && token === "dev-local-token";
}

function readDevProfileBody(): ProfileResponse["body"] {
  const fallback: ProfileResponse["body"] = {
    profiledata: {
      _id: "dev-local-user",
      firstname: "Dev",
      lastname: "User",
      email: "dev@gumboot.local",
      bio: "Local development profile. API calls are bypassed in dev mode.",
      verified_user: 0,
      skill: [],
      tools: [],
    },
    ratingdata: { count: 0, averageRating: 0 },
  };

  if (typeof window === "undefined") return fallback;
  const raw = window.localStorage.getItem(PROFILE_SETUP_DRAFT_KEY);
  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw) as { bio?: string };
    return {
      ...fallback,
      profiledata: {
        ...fallback.profiledata,
        bio: parsed.bio?.trim() || fallback.profiledata.bio,
      },
    };
  } catch {
    return fallback;
  }
}

function readProfileCustomFields(): ProfileCustomFields {
  if (typeof window === "undefined") return { skills: [], tools: [] };
  const raw = window.localStorage.getItem(PROFILE_CUSTOM_FIELDS_KEY);
  if (!raw) return { skills: [], tools: [] };
  try {
    const parsed = JSON.parse(raw) as Partial<ProfileCustomFields>;
    return {
      skills: Array.isArray(parsed.skills) ? parsed.skills : [],
      tools: Array.isArray(parsed.tools) ? parsed.tools : [],
    };
  } catch {
    return { skills: [], tools: [] };
  }
}

function writeProfileCustomFields(fields: ProfileCustomFields) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PROFILE_CUSTOM_FIELDS_KEY, JSON.stringify(fields));
}

/**
 * NOTE:
 * This component assumes your global :root theme variables exist (recommended).
 * If you haven't added them to globals.css yet, this block includes fallbacks
 * scoped to this component via .pp-root { --var: ... } so it still works.
 */
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');

  .pp-root * { box-sizing: border-box; }

  /* Fallback theme (scoped) */
  .pp-root{
    --bg-0: #2A3439;
    --bg-1: #3E4A51;
    --bg-2: #2F3A40;

    --text-1: #E5E5E5;
    --text-2: rgba(229,229,229,0.72);
    --text-3: rgba(229,229,229,0.48);
    --text-4: rgba(229,229,229,0.28);

    --accent: #5B6E7F;
    --cta: #26A69A;
    --danger: #B75B5B;

    --line: rgba(229,229,229,0.12);
    --line-strong: rgba(229,229,229,0.20);

    --glass-1: rgba(229,229,229,0.06);
    --glass-2: rgba(229,229,229,0.10);
    --glass-3: rgba(229,229,229,0.16);

    --shadow: 0 18px 50px rgba(0,0,0,0.35);
  }

  .pp-root {
    min-height: 100vh;
    padding: 64px 20px 96px;
    font-family: 'DM Sans', sans-serif;
    color: var(--text-1);
    background:
      radial-gradient(900px 560px at 18% 10%, rgba(91,110,127,0.22), rgba(0,0,0,0) 60%),
      linear-gradient(180deg, var(--bg-0), #20282c);
  }

  .pp-container {
    max-width: 760px;
    margin: 0 auto;
    background: rgba(62,74,81,0.70);
    border: 1px solid var(--line);
    border-radius: 18px;
    padding: 44px 44px 52px;
    box-shadow: var(--shadow);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }

  /* Skeleton */
  .pp-skeleton { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 80px 0; }
  .pp-skeleton-avatar {
    width: 96px; height: 96px; border-radius: 50%;
    background: linear-gradient(90deg,
      rgba(229,229,229,0.06) 25%, rgba(229,229,229,0.12) 50%, rgba(229,229,229,0.06) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }
  .pp-skeleton-line {
    border-radius: 10px;
    background: linear-gradient(90deg,
      rgba(229,229,229,0.06) 25%, rgba(229,229,229,0.12) 50%, rgba(229,229,229,0.06) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }
  @keyframes shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  /* Error */
  .pp-error {
    border: 1px solid rgba(183,91,91,0.35);
    background: rgba(183,91,91,0.12);
    border-radius: 16px;
    padding: 28px;
    text-align: center;
  }
  .pp-error-icon { font-size: 30px; margin-bottom: 10px; }
  .pp-error-message {
    color: var(--text-2);
    font-size: 14px;
    margin-bottom: 18px;
    line-height: 1.6;
  }
  .pp-retry-btn {
    background: var(--glass-2);
    border: 1px solid var(--line);
    color: var(--text-1);
    padding: 10px 18px;
    border-radius: 12px;
    font-family: 'DM Sans', sans-serif;
    font-size: 12px;
    font-weight: 800;
    cursor: pointer;
    transition: transform 0.12s, background 0.12s, border-color 0.12s;
    letter-spacing: 0.10em;
    text-transform: uppercase;
  }
  .pp-retry-btn:hover {
    transform: translateY(-1px);
    background: var(--glass-3);
    border-color: var(--line-strong);
  }

  /* Card animation */
  .pp-card { animation: fadeUp 0.5s ease both; }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* Header */
  .pp-header {
    display: flex;
    align-items: flex-start;
    gap: 22px;
    padding-bottom: 26px;
    border-bottom: 1px solid var(--line);
    margin-bottom: 24px;
  }

  .pp-avatar-wrap { position: relative; flex-shrink: 0; }
  .pp-avatar {
    width: 92px;
    height: 92px;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid rgba(91,110,127,0.55);
    background: rgba(229,229,229,0.06);
    display: block;
  }

  .pp-verified-dot {
    position: absolute;
    bottom: 2px; right: 2px;
    width: 22px; height: 22px;
    background: var(--cta);
    border-radius: 50%;
    border: 2px solid rgba(42,52,57,0.85);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    color: #0f172a;
    font-weight: 900;
    box-shadow: 0 10px 18px rgba(0,0,0,0.28);
  }

  .pp-info { flex: 1; min-width: 0; }

  .pp-name {
    font-family: 'DM Serif Display', serif;
    font-size: 30px;
    font-weight: 400;
    color: var(--text-1);
    margin: 0 0 6px;
    line-height: 1.15;
  }

  .pp-email {
    font-size: 13px;
    color: var(--text-3);
    margin: 0 0 12px;
  }

  .pp-rating-row { display: flex; align-items: center; gap: 10px; }

  .pp-stars { display: flex; gap: 2px; }
  .pp-star { font-size: 14px; line-height: 1; }
  .pp-star.filled { color: rgba(229,229,229,0.90); }
  .pp-star.empty  { color: rgba(229,229,229,0.20); }
  .pp-rating-value { font-size: 14px; font-weight: 800; color: var(--text-1); }
  .pp-rating-count { font-size: 12px; color: var(--text-4); }

  /* Bio */
  .pp-bio {
    font-size: 14px;
    line-height: 1.75;
    color: var(--text-2);
    margin: 0;
    font-weight: 400;
  }

  .pp-divider { height: 1px; background: var(--line); margin: 26px 0; }

  /* Section */
  .pp-section-label {
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--text-3);
    margin: 0 0 14px;
  }

  .pp-empty {
    font-size: 13px;
    color: var(--text-4);
    font-style: italic;
    margin: 0;
  }

  /* Skills */
  .pp-skills-grid { display: flex; flex-wrap: wrap; gap: 10px; }

  .pp-skill-chip {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: var(--glass-1);
    border: 1px solid var(--line);
    border-radius: 12px;
    padding: 9px 12px;
    transition: transform 0.12s, background 0.12s, border-color 0.12s;
  }
  .pp-skill-chip:hover {
    transform: translateY(-1px);
    background: var(--glass-2);
    border-color: var(--line-strong);
  }

  .pp-skill-img {
    width: 20px; height: 20px;
    border-radius: 6px;
    object-fit: cover;
    flex-shrink: 0;
    border: 1px solid rgba(229,229,229,0.14);
  }

  .pp-skill-name {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-1);
    white-space: nowrap;
  }

  /* Tools */
  .pp-tools-list { display: flex; flex-wrap: wrap; gap: 8px; }

  .pp-tool-tag {
    font-size: 12px;
    color: var(--text-2);
    background: var(--glass-1);
    border: 1px solid var(--line);
    border-radius: 12px;
    padding: 7px 12px;
    transition: transform 0.12s, background 0.12s, border-color 0.12s, color 0.12s;
  }

  .pp-tool-tag:hover {
    transform: translateY(-1px);
    background: var(--glass-2);
    border-color: var(--line-strong);
    color: var(--text-1);
  }

  .pp-editor-row {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
  }
  .pp-editor-input {
    flex: 1;
    background: rgba(42,52,57,0.9);
    border: 1px solid var(--line);
    border-radius: 10px;
    color: var(--text-1);
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    padding: 10px 12px;
    outline: none;
  }
  .pp-editor-btn {
    border: none;
    border-radius: 10px;
    background: var(--cta);
    color: #ffffff;
    font-family: 'DM Sans', sans-serif;
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 10px 12px;
    cursor: pointer;
  }
  .pp-remove-btn {
    border: none;
    background: transparent;
    color: var(--text-3);
    cursor: pointer;
    font-size: 12px;
    line-height: 1;
    padding: 0 0 0 4px;
  }

  /* Responsive */
  @media (max-width: 560px) {
    .pp-container { padding: 28px 20px 34px; border-radius: 16px; }
    .pp-header { gap: 16px; }
    .pp-avatar { width: 76px; height: 76px; }
    .pp-name { font-size: 26px; }
  }
`;

function RatingStars({ value }: { value: number }) {
  const rounded = Math.max(0, Math.min(5, Math.round(value)));
  return (
    <div className="pp-stars" aria-label={`Rating: ${value.toFixed(1)} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={`pp-star ${i < rounded ? "filled" : "empty"}`}
          aria-hidden="true"
        >
          ★
        </span>
      ))}
    </div>
  );
}

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ProfileResponse["body"] | null>(null);
  const [skillInput, setSkillInput] = useState("");
  const [toolInput, setToolInput] = useState("");
  const [customSkills, setCustomSkills] = useState<string[]>(
    () => readProfileCustomFields().skills
  );
  const [customTools, setCustomTools] = useState<string[]>(
    () => readProfileCustomFields().tools
  );

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = getAuthToken();

      if (isDevLocalSession(token)) {
        setData(readDevProfileBody());
        return;
      }

      if (!token) {
        setError("No auth token found. Please log in first.");
        setData(null);
        return;
      }

      const res = await fetch(PROFILE_ENDPOINT, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      const json = (await res.json()) as Partial<ProfileResponse>;
      if (!res.ok || !json.success || !json.body) {
        throw new Error(json.message || "Failed to load profile");
      }

      setData(json.body);
    } catch (e: unknown) {
      setData(null);
      setError(e instanceof Error ? e.message : "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const profile = data?.profiledata;
  const rating = data?.ratingdata;

  const fullName = useMemo(
    () =>
      [profile?.firstname, profile?.lastname].filter(Boolean).join(" ") || "Unknown User",
    [profile?.firstname, profile?.lastname]
  );

  const displayedSkills = useMemo(() => {
    const apiSkills = (profile?.skill ?? []).map((s) => s.name).filter(Boolean);
    return Array.from(new Set([...apiSkills, ...customSkills]));
  }, [profile?.skill, customSkills]);

  const displayedTools = useMemo(() => {
    const apiTools = (profile?.tools ?? [])
      .map((tool, idx) =>
        typeof tool === "string" ? tool : tool.name || `Tool ${idx + 1}`
      )
      .filter(Boolean);
    return Array.from(new Set([...apiTools, ...customTools]));
  }, [profile?.tools, customTools]);

  function addSkill() {
    const value = skillInput.trim();
    if (!value) return;
    if (displayedSkills.includes(value)) {
      setSkillInput("");
      return;
    }
    const next = [...customSkills, value];
    setCustomSkills(next);
    writeProfileCustomFields({ skills: next, tools: customTools });
    setSkillInput("");
  }

  function addTool() {
    const value = toolInput.trim();
    if (!value) return;
    if (displayedTools.includes(value)) {
      setToolInput("");
      return;
    }
    const next = [...customTools, value];
    setCustomTools(next);
    writeProfileCustomFields({ skills: customSkills, tools: next });
    setToolInput("");
  }

  function removeSkill(name: string) {
    const next = customSkills.filter((s) => s !== name);
    setCustomSkills(next);
    writeProfileCustomFields({ skills: next, tools: customTools });
  }

  function removeTool(name: string) {
    const next = customTools.filter((t) => t !== name);
    setCustomTools(next);
    writeProfileCustomFields({ skills: customSkills, tools: next });
  }

  return (
    <>
      <style>{styles}</style>

      <div className="pp-root">
        <div className="pp-container">
          {loading && (
            <div className="pp-skeleton">
              <div className="pp-skeleton-avatar" />
              <div className="pp-skeleton-line" style={{ width: 200, height: 22 }} />
              <div className="pp-skeleton-line" style={{ width: 140, height: 12 }} />
              <div className="pp-skeleton-line" style={{ width: 360, height: 12, marginTop: 10 }} />
              <div className="pp-skeleton-line" style={{ width: 280, height: 12 }} />
            </div>
          )}

          {!loading && error && (
            <div className="pp-error">
              <div className="pp-error-icon">⚠</div>
              <p className="pp-error-message">{error}</p>
              <button className="pp-retry-btn" onClick={fetchProfile}>
                Try again
              </button>
            </div>
          )}

          {!loading && !error && profile && (
            <div className="pp-card">
              <div className="pp-header">
                <div className="pp-avatar-wrap">
                  <img
                    src={buildImageUrl(profile.image)}
                    alt={fullName}
                    onError={(e) => {
                      e.currentTarget.src = "/globe.svg";
                    }}
                    className="pp-avatar"
                  />

                  {profile.verified_user === 1 && (
                    <div className="pp-verified-dot" title="Verified">
                      ✓
                    </div>
                  )}
                </div>

                <div className="pp-info">
                  <h1 className="pp-name">{fullName}</h1>
                  {profile.email && <p className="pp-email">{profile.email}</p>}

                  <div className="pp-rating-row">
                    <RatingStars value={rating?.averageRating ?? 0} />
                    <span className="pp-rating-value">
                      {(rating?.averageRating ?? 0).toFixed(1)}
                    </span>
                    <span className="pp-rating-count">
                      {rating?.count ?? 0} review{(rating?.count ?? 0) !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              </div>

              <p className="pp-bio">{profile.bio || "No bio added yet."}</p>

              <div className="pp-divider" />

              <div className="pp-section">
                <p className="pp-section-label">Skills</p>
                <div className="pp-editor-row">
                  <input
                    className="pp-editor-input"
                    placeholder="Add a skill (e.g. Plumbing)"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSkill();
                      }
                    }}
                  />
                  <button type="button" className="pp-editor-btn" onClick={addSkill}>
                    Add
                  </button>
                </div>
                {displayedSkills.length > 0 ? (
                  <div className="pp-skills-grid">
                    {displayedSkills.map((skillName) => (
                      <div key={skillName} className="pp-skill-chip">
                        <span className="pp-skill-name">{skillName}</span>
                        {customSkills.includes(skillName) && (
                          <button
                            type="button"
                            className="pp-remove-btn"
                            onClick={() => removeSkill(skillName)}
                            aria-label={`Remove ${skillName}`}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="pp-empty">No skills listed yet.</p>
                )}
              </div>

              <div className="pp-divider" />

              <div className="pp-section">
                <p className="pp-section-label">Tools</p>
                <div className="pp-editor-row">
                  <input
                    className="pp-editor-input"
                    placeholder="Add a tool (e.g. Drill)"
                    value={toolInput}
                    onChange={(e) => setToolInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTool();
                      }
                    }}
                  />
                  <button type="button" className="pp-editor-btn" onClick={addTool}>
                    Add
                  </button>
                </div>
                {displayedTools.length > 0 ? (
                  <div className="pp-tools-list">
                    {displayedTools.map((name) => {
                      return (
                        <span key={name} className="pp-tool-tag">
                          {name}
                          {customTools.includes(name) && (
                            <button
                              type="button"
                              className="pp-remove-btn"
                              onClick={() => removeTool(name)}
                              aria-label={`Remove ${name}`}
                            >
                              ×
                            </button>
                          )}
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <p className="pp-empty">No tools listed yet.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
