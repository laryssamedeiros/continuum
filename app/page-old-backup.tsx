"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import FileUploader from "./components/FileUploader";
import ChatSandbox from "./components/ChatSandbox";
import ApiKeyManager from "./components/ApiKeyManager";
import EncryptionManager from "./components/EncryptionManager";

const IdentityNodeGraph = dynamic(
  () => import("./components/IdentityNodeGraph"),
  { ssr: false }
);

type MemoryProfileJson = any;
type ToastType = "success" | "error" | "info";
type ActiveTab =
  | "overview"
  | "preferences"
  | "work"
  | "goals"
  | "skills"
  | "constraints";

type IdentityProfile = {
  id: string;
  name: string;
  profileJson: MemoryProfileJson | null;
  profileText: string | null;
};

type PersonaPreview = {
  title: string;
  tagline: string;
  bestFor: string;
  strengths: string;
  avoid: string;
};

type GraphSection = {
  title: string;
  items: string[];
};

const STORAGE_KEYS = {
  profiles: "continuum.profiles.v1",
  activeProfileId: "continuum.activeProfileId",
  darkMode: "continuum.darkMode",
};

export default function HomePage() {
  // Multiple profiles
  const [profiles, setProfiles] = useState<IdentityProfile[]>([
    {
      id: "profile-1",
      name: "Main profile",
      profileJson: null,
      profileText: null,
    },
  ]);
  const [activeProfileId, setActiveProfileId] = useState<string>("profile-1");

  // Editing + UI state
  const [draftProfile, setDraftProfile] = useState<MemoryProfileJson | null>(
    null
  );
  const [darkMode, setDarkMode] = useState(false);
  const [insightText, setInsightText] = useState<string | null>(null);
  const [memoryScore, setMemoryScore] = useState<number | null>(null);
  const [personaPreview, setPersonaPreview] = useState<PersonaPreview | null>(
    null
  );
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [editMode, setEditMode] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(
    null
  );

  const resultsRef = useRef<HTMLDivElement | null>(null);

  const activeProfile =
    profiles.find((p) => p.id === activeProfileId) ?? profiles[0];
  const activeJson: MemoryProfileJson | null =
    activeProfile?.profileJson ?? null;

  // ----- Local storage: load on mount -----

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const storedProfiles = window.localStorage.getItem(STORAGE_KEYS.profiles);
      const storedActiveId = window.localStorage.getItem(
        STORAGE_KEYS.activeProfileId
      );
      const storedDark = window.localStorage.getItem(STORAGE_KEYS.darkMode);

      if (storedProfiles) {
        const parsed = JSON.parse(storedProfiles) as IdentityProfile[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setProfiles(parsed);
          if (storedActiveId && parsed.some((p) => p.id === storedActiveId)) {
            setActiveProfileId(storedActiveId);
          } else {
            setActiveProfileId(parsed[0].id);
          }
        }
      }

      if (storedDark === "true") setDarkMode(true);
      if (storedDark === "false") setDarkMode(false);
    } catch (e) {
      console.error("Failed to load profiles from storage", e);
    }
  }, []);

  // ----- Local storage: persist profiles / activeId / darkMode -----

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        STORAGE_KEYS.profiles,
        JSON.stringify(profiles)
      );
      window.localStorage.setItem(
        STORAGE_KEYS.activeProfileId,
        activeProfileId
      );
    } catch (e) {
      console.error("Failed to save profiles to storage", e);
    }
  }, [profiles, activeProfileId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        STORAGE_KEYS.darkMode,
        darkMode ? "true" : "false"
      );
    } catch (e) {
      console.error("Failed to save dark mode preference", e);
    }
  }, [darkMode]);

  // ----- Toast helpers -----

  const showToast = (message: string, type: ToastType = "info") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 2500);
  };

  // ----- Profile management -----

  const createNewProfile = () => {
    const index = profiles.length + 1;
    const newProfile: IdentityProfile = {
      id: `profile-${Date.now()}-${index}`,
      name: `Profile ${index}`,
      profileJson: null,
      profileText: null,
    };
    setProfiles((prev) => [...prev, newProfile]);
    setActiveProfileId(newProfile.id);
    setEditMode(false);
    setDraftProfile(null);
    showToast("New profile created.", "success");
  };

  const renameActiveProfile = () => {
    if (!activeProfile) return;
    const newName = window.prompt("Profile name", activeProfile.name);
    if (!newName || !newName.trim()) return;
    setProfiles((prev) =>
      prev.map((p) =>
        p.id === activeProfile.id ? { ...p, name: newName.trim() } : p
      )
    );
    showToast("Profile renamed.", "success");
  };

  const deleteActiveProfile = () => {
    if (!activeProfile || profiles.length === 1) {
      showToast("You need at least one profile.", "info");
      return;
    }
    const confirmed = window.confirm(
      `Delete profile "${activeProfile.name}"? This cannot be undone.`
    );
    if (!confirmed) return;

    setProfiles((prev) => {
      const filtered = prev.filter((p) => p.id !== activeProfile.id);
      const next = filtered.length > 0 ? filtered[0].id : "profile-1";
      setActiveProfileId(next);
      return filtered;
    });
    setEditMode(false);
    setDraftProfile(null);
    showToast("Profile deleted.", "success");
  };

  // ----- Copy / Download helpers -----

  const handleCopyText = async () => {
    if (!activeProfile?.profileText) return;
    try {
      await navigator.clipboard.writeText(activeProfile.profileText);
      showToast("Memory profile text copied.", "success");
    } catch (e) {
      console.error(e);
      showToast("Failed to copy text.", "error");
    }
  };

  const handleCopyJson = async () => {
    if (!activeJson) return;
    try {
      const jsonString = JSON.stringify(activeJson, null, 2);
      await navigator.clipboard.writeText(jsonString);
      showToast("Identity graph JSON copied.", "success");
    } catch (e) {
      console.error(e);
      showToast("Failed to copy JSON.", "error");
    }
  };

  const downloadFile = (filename: string, contents: string, mimeType: string) => {
    const blob = new Blob([contents], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadText = () => {
    if (!activeProfile?.profileText) return;
    downloadFile("memory-profile.txt", activeProfile.profileText, "text/plain");
    showToast("Downloaded memory-profile.txt", "success");
  };

  const handleDownloadJson = () => {
    if (!activeJson) return;
    const jsonString = JSON.stringify(activeJson, null, 2);
    downloadFile("memory-profile.json", jsonString, "application/json");
    showToast("Downloaded memory-profile.json", "success");
  };

  // ----- Personality prompt generators -----

  const handleCopyClaudePrompt = async () => {
    if (!activeJson) return;
    const jsonString = JSON.stringify(activeJson, null, 2);
    const prompt =
      `You are my long-term personal AI assistant in Claude.\n\n` +
      `Below is my identity and preference profile as JSON. Use it to personalize all future responses for me.\n\n` +
      `<identity_profile>\n${jsonString}\n</identity_profile>\n\n` +
      `Rules:\n` +
      `- Do NOT repeat this profile back to me unless I explicitly ask.\n` +
      `- Adapt your tone, examples, and suggestions to match my preferences, goals, constraints, and communication style.\n` +
      `- You may update your internal model of me over time, but never contradict the stable traits in this profile.`;

    try {
      await navigator.clipboard.writeText(prompt);
      showToast("Claude memory prompt copied.", "success");
    } catch (e) {
      console.error(e);
      showToast("Failed to copy Claude prompt.", "error");
    }
  };

  const handleCopyGeminiPrompt = async () => {
    if (!activeJson) return;
    const jsonString = JSON.stringify(activeJson, null, 2);
    const prompt =
      `You are a Google Gemini assistant personalized for me.\n\n` +
      `Here is a JSON description of who I am, how I communicate, what I like, and what I am working toward:\n\n` +
      `[[IDENTITY_PROFILE_JSON]]\n${jsonString}\n[[END_IDENTITY_PROFILE_JSON]]\n\n` +
      `Use this as long-term context when answering questions for me.\n` +
      `Focus on:\n` +
      `- My goals\n` +
      `- My constraints\n` +
      `- My preferred tone and communication style\n` +
      `- My skills and background\n\n` +
      `Do not restate this profile unless I explicitly ask.`;

    try {
      await navigator.clipboard.writeText(prompt);
      showToast("Gemini memory prompt copied.", "success");
    } catch (e) {
      console.error(e);
      showToast("Failed to copy Gemini prompt.", "error");
    }
  };

  const handleCopyOpenAIPrompt = async () => {
    if (!activeJson) return;
    const jsonString = JSON.stringify(activeJson, null, 2);
    const prompt =
      `You are a personalized assistant for this specific user.\n\n` +
      `Here is their long-term memory and identity graph as JSON:\n\n` +
      `<<USER_IDENTITY_PROFILE_JSON>>\n${jsonString}\n<<END_USER_IDENTITY_PROFILE_JSON>>\n\n` +
      `Use this to:\n` +
      `- Tailor tone, suggestions, and explanations to the user\n` +
      `- Respect their constraints and preferences\n` +
      `- Align with their goals and communication style\n\n` +
      `Do not repeat the JSON back. Treat it as a stable, portable identity layer for this user.`;

    try {
      await navigator.clipboard.writeText(prompt);
      showToast("OpenAI / ChatGPT memory prompt copied.", "success");
    } catch (e) {
      console.error(e);
      showToast("Failed to copy OpenAI prompt.", "error");
    }
  };

  // ----- Memory score + insight -----

  const computeMemoryScore = (json: MemoryProfileJson | null) => {
    if (!json || !json.profile)
      return { score: null, strengths: [] as string[], gaps: [] as string[] };

    const p = json.profile;

    type FieldInfo = { label: string; value: any };
    const fields: FieldInfo[] = [
      { label: "basic.name", value: p.basic?.name },
      { label: "basic.age_range", value: p.basic?.age_range },
      { label: "basic.location", value: p.basic?.location },
      { label: "preferences.likes", value: p.preferences?.likes },
      { label: "preferences.dislikes", value: p.preferences?.dislikes },
      { label: "preferences.tone", value: p.preferences?.tone },
      { label: "work.roles", value: p.work?.roles },
      { label: "work.industries", value: p.work?.industries },
      { label: "work.current_focus", value: p.work?.current_focus },
      { label: "goals.short_term", value: p.goals?.short_term },
      { label: "goals.long_term", value: p.goals?.long_term },
      { label: "constraints", value: p.constraints },
      { label: "skills", value: p.skills },
      { label: "communication_style", value: p.communication_style },
    ];

    let filled = 0;
    const strengths: string[] = [];
    const gaps: string[] = [];

    for (const f of fields) {
      const v = f.value;
      const hasValue =
        typeof v === "string"
          ? v.trim().length > 0
          : Array.isArray(v)
          ? v.length > 0
          : v != null;

      if (hasValue) {
        filled += 1;
        strengths.push(f.label);
      } else {
        gaps.push(f.label);
      }
    }

    const score = Math.round((filled / fields.length) * 100);
    return { score, strengths, gaps };
  };

  useMemo(() => {
    if (!activeJson) {
      setMemoryScore(null);
      setInsightText(null);
      return;
    }
    const { score, strengths, gaps } = computeMemoryScore(activeJson);
    if (score === null) {
      setMemoryScore(null);
      setInsightText(null);
      return;
    }
    setMemoryScore(score);

    const strongAreas = strengths
      .map((s) => s.replace(".", " → ").replace("_", " "))
      .join(", ");
    const gapAreas = gaps
      .map((s) => s.replace(".", " → ").replace("_", " "))
      .join(", ");

    const explanation =
      `Your memory profile looks about ${score}% complete.\n\n` +
      (strongAreas
        ? `Strong / well-captured areas: ${strongAreas}.\n`
        : `We don't yet have many strong, well-captured areas.\n`) +
      (gapAreas
        ? `Weaker / missing areas: ${gapAreas}.\n\n`
        : `There are very few obvious gaps — this identity graph is dense.\n\n`) +
      `You can improve this score by importing more chats that show your goals, constraints, preferences, and communication style in different contexts (work, personal, creative, etc.).`;

    setInsightText(explanation);
  }, [activeJson]);

  // ----- Persona preview derivation -----

  useMemo(() => {
    if (!activeJson || !activeJson.profile) {
      setPersonaPreview(null);
      return;
    }
    const p = activeJson.profile;

    const name = p.basic?.name || activeProfile?.name || "This persona";
    const roles: string[] = Array.isArray(p.work?.roles) ? p.work.roles : [];
    const industries: string[] = Array.isArray(p.work?.industries)
      ? p.work.industries
      : [];
    const focus: string[] = Array.isArray(p.work?.current_focus)
      ? p.work.current_focus
      : [];
    const likes: string[] = Array.isArray(p.preferences?.likes)
      ? p.preferences.likes
      : [];
    const goalsShort: string[] = Array.isArray(p.goals?.short_term)
      ? p.goals.short_term
      : [];
    const goalsLong: string[] = Array.isArray(p.goals?.long_term)
      ? p.goals.long_term
      : [];
    const skills: string[] = Array.isArray(p.skills) ? p.skills : [];
    const tone: string | null = p.preferences?.tone ?? null;

    const primaryRole = roles[0];
    const primaryIndustry = industries[0];
    const primaryFocus = focus[0];
    const primaryGoal = goalsShort[0] || goalsLong[0];
    const primaryLike = likes[0];

    const titleParts: string[] = [];
    if (primaryRole) titleParts.push(primaryRole);
    if (primaryIndustry) titleParts.push(primaryIndustry);
    const title =
      titleParts.length > 0
        ? `${name} – ${titleParts.join(" in ")}`
        : `${name} – personalized AI profile`;

    const taglinePieces: string[] = [];
    if (primaryGoal) taglinePieces.push(`focused on "${primaryGoal}"`);
    if (primaryFocus) taglinePieces.push(`currently working on ${primaryFocus}`);
    if (tone) taglinePieces.push(`prefers a ${tone} tone`);
    if (!taglinePieces.length && primaryLike)
      taglinePieces.push(`cares about ${primaryLike}`);
    const tagline =
      taglinePieces.length > 0
        ? taglinePieces.join(" · ")
        : "General-purpose assistant tuned to your preferences.";

    const strengthsParts: string[] = [];
    if (skills.length) strengthsParts.push(`Skills: ${skills.join(", ")}`);
    if (likes.length) strengthsParts.push(`Interests: ${likes.join(", ")}`);
    if (tone) strengthsParts.push(`Tone: ${tone}`);
    const strengthsText =
      strengthsParts.length > 0
        ? strengthsParts.join(" · ")
        : "Good at adapting to your style over time.";

    const bestForParts: string[] = [];
    if (primaryRole)
      bestForParts.push(`supporting you as a ${primaryRole.toLowerCase()}`);
    if (primaryIndustry)
      bestForParts.push(
        `brainstorming in ${primaryIndustry.toLowerCase()} contexts`
      );
    if (primaryGoal)
      bestForParts.push(
        `giving advice that nudges you toward "${primaryGoal}"`
      );
    const bestFor =
      bestForParts.length > 0
        ? bestForParts.join(" · ")
        : "Everyday Q&A, planning, and decision support.";

    const avoid =
      "Avoid using this profile for people who are very different from you — it is tuned to your goals, constraints, and communication style.";

    setPersonaPreview({
      title,
      tagline,
      strengths: strengthsText,
      bestFor,
      avoid,
    });
  }, [activeJson, activeProfile?.name]);

  // --- helpers for cleaning / collapsing traits ---

  const asArray = (v: string) =>
    v
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

  function normalizeWorkRoleLabel(label: string): string {
    // Remove "Role:" prefix, lower-case, and drop some adjectives
    let s = label.toLowerCase().trim();
    s = s.replace(/^role:\s*/, "");
    s = s.replace(/\bsolo\b/g, "");
    s = s.replace(/\bnon-technical\b/g, "");
    s = s.replace(/\bheavy\b/g, "");
    s = s.replace(/\bpower user\b/g, "user");
    s = s.replace(/\(.*?\)/g, ""); // remove parenthetical notes
    s = s.replace(/\s+/g, " ").trim();
    return s;
  }

  // ----- Visual identity graph sections (cleaned & de-duplicated) -----

  const graphSections: GraphSection[] = useMemo(() => {
    if (!activeJson || !activeJson.profile) return [];
    const p = activeJson.profile;
    const sections: GraphSection[] = [];

    const push = (title: string, items: string[], maxItems?: number) => {
      let clean = items
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      if (typeof maxItems === "number" && clean.length > maxItems) {
        clean = clean.slice(0, maxItems);
      }

      if (clean.length) sections.push({ title, items: clean });
    };

    // --- Basic ---
    const basicItems: string[] = [];
    if (p.basic?.name) basicItems.push(`Name: ${p.basic.name}`);
    if (p.basic?.age_range) basicItems.push(`Age: ${p.basic.age_range}`);
    if (p.basic?.location) basicItems.push(`Location: ${p.basic.location}`);
    push("Basic", basicItems, 4);

    // --- Preferences ---
    const prefItems: string[] = [];
    if (Array.isArray(p.preferences?.likes)) {
      for (const x of p.preferences.likes) {
        if (x && x.trim().length > 0) {
          prefItems.push(`Likes: ${x.trim()}`);
        }
      }
    }
    if (Array.isArray(p.preferences?.dislikes)) {
      for (const x of p.preferences.dislikes) {
        if (x && x.trim().length > 0) {
          prefItems.push(`Dislikes: ${x.trim()}`);
        }
      }
    }
    if (p.preferences?.tone) prefItems.push(`Tone: ${p.preferences.tone}`);
    push("Preferences", prefItems, 14);

    // --- Work (collapsed & limited) ---
    const workRoleMap = new Map<string, string>();
    const workIndustrySet = new Set<string>();
    const workFocusSet = new Set<string>();

    if (Array.isArray(p.work?.roles)) {
      for (const role of p.work.roles) {
        if (!role || !role.trim()) continue;
        const raw = `Role: ${role.trim()}`;
        const norm = normalizeWorkRoleLabel(raw);
        if (!norm) continue;

        const existing = workRoleMap.get(norm);
        // Keep the shorter, cleaner label if multiple variants
        if (!existing || raw.length < existing.length) {
          workRoleMap.set(norm, raw);
        }
      }
    }

    if (Array.isArray(p.work?.industries)) {
      for (const ind of p.work.industries) {
        if (!ind || !ind.trim()) continue;
        workIndustrySet.add(`Industry: ${ind.trim()}`);
      }
    }

    if (Array.isArray(p.work?.current_focus)) {
      for (const f of p.work.current_focus) {
        if (!f || !f.trim()) continue;
        workFocusSet.add(`Focus: ${f.trim()}`);
      }
    }

    const workItems: string[] = [];

    // Prioritize roles, then focus, then industries
    for (const value of workRoleMap.values()) {
      workItems.push(value);
    }
    for (const value of workFocusSet.values()) {
      workItems.push(value);
    }
    for (const value of workIndustrySet.values()) {
      workItems.push(value);
    }

    // Cap total work chips so it doesn't explode
    push("Work", workItems, 18);

    // --- Goals ---
    const goalsItems: string[] = [];
    if (Array.isArray(p.goals?.short_term)) {
      for (const g of p.goals.short_term) {
        if (!g || !g.trim()) continue;
        goalsItems.push(`Short-term: ${g.trim()}`);
      }
    }
    if (Array.isArray(p.goals?.long_term)) {
      for (const g of p.goals.long_term) {
        if (!g || !g.trim()) continue;
        goalsItems.push(`Long-term: ${g.trim()}`);
      }
    }
    push("Goals", goalsItems, 14);

    // --- Skills ---
    if (Array.isArray(p.skills)) {
      const skillsSet = new Set<string>();
      for (const s of p.skills) {
        if (!s || !s.trim()) continue;
        skillsSet.add(s.trim());
      }
      push("Skills", Array.from(skillsSet), 18);
    }

    // --- Constraints ---
    if (Array.isArray(p.constraints)) {
      const constraintsSet = new Set<string>();
      for (const c of p.constraints) {
        if (!c || !c.trim()) continue;
        constraintsSet.add(c.trim());
      }
      push("Constraints", Array.from(constraintsSet), 14);
    }

    // --- Communication style ---
    if (Array.isArray(p.communication_style)) {
      const commSet = new Set<string>();
      for (const c of p.communication_style) {
        if (!c || !c.trim()) continue;
        commSet.add(c.trim());
      }
      push("Communication", Array.from(commSet), 10);
    }

    return sections;
  }, [activeJson]);

  // Auto-scroll to results when new profile data arrives
  useEffect(() => {
    if (activeJson && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [activeJson]);

  const mainClasses = darkMode
  ? "min-h-screen w-full flex flex-col items-center px-6 py-12 gap-8 dark-gradient text-slate-50"
  : "min-h-screen w-full flex flex-col items-center px-6 py-12 gap-8 light-gradient text-neutral-900";

const cardClasses = darkMode
  ? "w-full max-w-5xl space-y-4 glass rounded-3xl p-8 shadow-2xl hover-glow transition-smooth animate-fade-in"
  : "w-full max-w-5xl space-y-4 glass-light rounded-3xl p-8 shadow-xl hover-glow transition-smooth animate-fade-in";

const preClasses = darkMode
  ? "bg-[#020617] text-slate-100 p-4 rounded-xl border border-slate-800 whitespace-pre-wrap text-sm"
  : "bg-white text-black p-4 rounded-xl border whitespace-pre-wrap text-sm";

const jsonPreClasses = darkMode
  ? "bg-[#020617] text-slate-100 p-4 rounded-xl border border-slate-800 overflow-auto text-xs"
  : "bg-white text-black p-4 rounded-xl border overflow-auto text-xs";

const badgeClasses = darkMode
  ? "inline-flex items-center rounded-full px-3 py-1 text-[11px] bg-slate-900/80 border border-slate-700 text-slate-100"
  : "inline-flex items-center rounded-full px-3 py-1 text-[11px] bg-neutral-100 border border-neutral-200";

const chipClasses = darkMode
  ? "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] bg-slate-800/90 border border-slate-700 text-slate-100"
  : "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] bg-neutral-100 border border-neutral-200";


  // ----- Edit mode helpers -----

  const updateDraftField = (fieldId: string, rawValue: string) => {
    if (!draftProfile) return;
    const cloned = JSON.parse(JSON.stringify(draftProfile));
    const p = cloned.profile || (cloned.profile = {});

    switch (fieldId) {
      case "basic.name":
        p.basic = p.basic || {};
        p.basic.name = rawValue || null;
        break;
      case "basic.age_range":
        p.basic = p.basic || {};
        p.basic.age_range = rawValue || null;
        break;
      case "basic.location":
        p.basic = p.basic || {};
        p.basic.location = rawValue || null;
        break;
      case "preferences.likes":
        p.preferences = p.preferences || {};
        p.preferences.likes = asArray(rawValue);
        break;
      case "preferences.dislikes":
        p.preferences = p.preferences || {};
        p.preferences.dislikes = asArray(rawValue);
        break;
      case "preferences.tone":
        p.preferences = p.preferences || {};
        p.preferences.tone = rawValue || null;
        break;
      case "work.roles":
        p.work = p.work || {};
        p.work.roles = asArray(rawValue);
        break;
      case "work.industries":
        p.work = p.work || {};
        p.work.industries = asArray(rawValue);
        break;
      case "work.current_focus":
        p.work = p.work || {};
        p.work.current_focus = asArray(rawValue);
        break;
      case "goals.short_term":
        p.goals = p.goals || {};
        p.goals.short_term = asArray(rawValue);
        break;
      case "goals.long_term":
        p.goals = p.goals || {};
        p.goals.long_term = asArray(rawValue);
        break;
      case "skills":
        p.skills = asArray(rawValue);
        break;
      case "constraints":
        p.constraints = asArray(rawValue);
        break;
      case "communication_style":
        p.communication_style = asArray(rawValue);
        break;
      default:
        break;
    }

    setDraftProfile(cloned);
  };

  const toggleEditMode = () => {
    if (!activeJson) return;
    if (!editMode) {
      setDraftProfile(JSON.parse(JSON.stringify(activeJson)));
      setEditMode(true);
    } else {
      setDraftProfile(null);
      setEditMode(false);
    }
  };

  const saveAllEdits = () => {
    if (!draftProfile || !activeProfile) return;
    setProfiles((prev) =>
      prev.map((p) =>
        p.id === activeProfile.id ? { ...p, profileJson: draftProfile } : p
      )
    );
    setDraftProfile(null);
    setEditMode(false);
    showToast("Profile updated.", "success");
  };

  const cancelEdits = () => {
    setDraftProfile(null);
    setEditMode(false);
    showToast("Changes discarded.", "info");
  };

  // ----- Tab content from profileJson / draftProfile -----

  const currentProfile = (() => {
    if (editMode && draftProfile && draftProfile.profile) return draftProfile.profile;
    if (activeJson && activeJson.profile) return activeJson.profile;
    return null;
  })();

  const renderFieldRow = (
    fieldId: string,
    label: string,
    value: string | string[] | null
  ) => {
    const isArray = Array.isArray(value);
    const display =
      isArray && value.length > 0
        ? value.join(", ")
        : !isArray && value
        ? value
        : "N/A";

    return (
      <div className="flex items-start justify-between gap-2 text-sm">
        <div className="flex-1">
          <span className="font-semibold">{label}: </span>
          {!editMode && <span>{display}</span>}
          {editMode && (
            <input
              type="text"
              value={
                isArray
                  ? Array.isArray(value)
                    ? value.join(", ")
                    : ""
                  : typeof value === "string"
                  ? value
                  : ""
              }
              onChange={(e) => updateDraftField(fieldId, e.target.value)}
              className="mt-1 w-full text-xs border rounded px-2 py-1 bg-white"
              placeholder={isArray ? "Comma-separated values" : "Enter value"}
            />
          )}
        </div>
      </div>
    );
  };

  const renderTabContent = () => {
    const p = currentProfile;
    if (!p) return null;

    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-2">
            {renderFieldRow("basic.name", "Name", p.basic?.name ?? null)}
            {renderFieldRow(
              "basic.age_range",
              "Age range",
              p.basic?.age_range ?? null
            )}
            {renderFieldRow(
              "basic.location",
              "Location",
              p.basic?.location ?? null
            )}
            {renderFieldRow(
              "preferences.tone",
              "Tone",
              p.preferences?.tone ?? null
            )}
            {renderFieldRow(
              "communication_style",
              "Communication style",
              Array.isArray(p.communication_style)
                ? p.communication_style
                : null
            )}
          </div>
        );
      case "preferences":
        return (
          <div className="space-y-2">
            {renderFieldRow(
              "preferences.likes",
              "Likes",
              Array.isArray(p.preferences?.likes)
                ? p.preferences.likes
                : null
            )}
            {renderFieldRow(
              "preferences.dislikes",
              "Dislikes",
              Array.isArray(p.preferences?.dislikes)
                ? p.preferences.dislikes
                : null
            )}
            {renderFieldRow(
              "preferences.tone",
              "Tone",
              p.preferences?.tone ?? null
            )}
          </div>
        );
      case "work":
        return (
          <div className="space-y-2">
            {renderFieldRow(
              "work.roles",
              "Roles",
              Array.isArray(p.work?.roles) ? p.work.roles : null
            )}
            {renderFieldRow(
              "work.industries",
              "Industries",
              Array.isArray(p.work?.industries)
                ? p.work.industries
                : null
            )}
            {renderFieldRow(
              "work.current_focus",
              "Current focus",
              Array.isArray(p.work?.current_focus)
                ? p.work.current_focus
                : null
            )}
          </div>
        );
      case "goals":
        return (
          <div className="space-y-2">
            {renderFieldRow(
              "goals.short_term",
              "Short-term goals",
              Array.isArray(p.goals?.short_term)
                ? p.goals.short_term
                : null
            )}
            {renderFieldRow(
              "goals.long_term",
              "Long-term goals",
              Array.isArray(p.goals?.long_term)
                ? p.goals.long_term
                : null
            )}
          </div>
        );
      case "skills":
        return (
          <div className="space-y-2">
            {renderFieldRow(
              "skills",
              "Skills",
              Array.isArray(p.skills) ? p.skills : null
            )}
          </div>
        );
      case "constraints":
        return (
          <div className="space-y-2">
            {renderFieldRow(
              "constraints",
              "Constraints",
              Array.isArray(p.constraints) ? p.constraints : null
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "preferences", label: "Preferences" },
    { id: "work", label: "Work" },
    { id: "goals", label: "Goals" },
    { id: "skills", label: "Skills" },
    { id: "constraints", label: "Constraints" },
  ] as const;

  return (
    <main className={mainClasses}>
      {/* Hero Section */}
      <header className="w-full max-w-5xl flex flex-col items-center text-center mb-8 animate-fade-in">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
            C
          </div>
        </div>
        <h1 className="text-5xl font-bold mb-3 gradient-text">
          Continuum
        </h1>
        <p className="text-lg opacity-80 max-w-2xl mb-6">
          Your AI memory, owned by you, portable everywhere
        </p>
        <div className="flex items-center gap-3">
          <span className={`px-4 py-1.5 rounded-full text-xs font-medium ${
            darkMode
              ? 'glass text-purple-300'
              : 'glass-light text-purple-700'
          }`}>
            ✨ End-to-End Encrypted
          </span>
          <span className={`px-4 py-1.5 rounded-full text-xs font-medium ${
            darkMode
              ? 'glass text-slate-300'
              : 'glass-light text-slate-700'
          }`}>
            🚀 Beta
          </span>
          <button
            onClick={() => setDarkMode((v) => !v)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-smooth ${
              darkMode
                ? 'glass hover:bg-white/10'
                : 'glass-light hover:bg-black/5'
            }`}
          >
            {darkMode ? '☀️ Light' : '🌙 Dark'}
          </button>
        </div>
      </header>

      {/* Profile switcher */}
      {profiles.length > 1 && (
        <section className={`w-full max-w-5xl mb-6 ${cardClasses}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-medium opacity-60">Profiles:</span>
              {profiles.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setActiveProfileId(p.id);
                    setEditMode(false);
                    setDraftProfile(null);
                  }}
                  className={`px-4 py-2 text-sm rounded-xl transition-smooth ${
                    p.id === activeProfileId
                      ? darkMode
                        ? "bg-purple-600 text-white shadow-lg"
                        : "bg-purple-500 text-white shadow-lg"
                      : darkMode
                      ? "glass hover:bg-white/10"
                      : "glass-light hover:bg-black/5"
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <button
                onClick={renameActiveProfile}
                className={`px-3 py-2 rounded-xl transition-smooth ${
                  darkMode ? 'glass hover:bg-white/10' : 'glass-light hover:bg-black/5'
                }`}
              >
                ✏️
              </button>
              <button
                onClick={deleteActiveProfile}
                disabled={profiles.length === 1}
                className={`px-3 py-2 rounded-xl transition-smooth ${
                  profiles.length === 1
                    ? "opacity-30 cursor-not-allowed"
                    : darkMode
                    ? "glass hover:bg-red-500/20 text-red-400"
                    : "glass-light hover:bg-red-500/10 text-red-600"
                }`}
              >
                🗑️
              </button>
              <button
                onClick={createNewProfile}
                className={`px-4 py-2 rounded-xl font-medium transition-smooth ${
                  darkMode
                    ? 'bg-purple-600 hover:bg-purple-500 text-white'
                    : 'bg-purple-500 hover:bg-purple-600 text-white'
                }`}
              >
                + New
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Uploader */}
      <section className="w-full max-w-5xl">
        <FileUploader
          onResult={(data) => {
            if (!activeProfile) return;
            setProfiles((prev) =>
              prev.map((p) =>
                p.id === activeProfile.id
                  ? {
                      ...p,
                      profileText: data.profileText,
                      profileJson: data.profileJson,
                    }
                  : p
              )
            );
            setDraftProfile(null);
            setEditMode(false);
          }}
        />
      </section>

      {/* Results container (for auto-scroll) */}
      <div ref={resultsRef} className="w-full flex flex-col items-center gap-8">
        {/* Memory Profile */}
        {activeProfile?.profileText && (
          <section className={cardClasses}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">Memory Profile</h2>
                {memoryScore !== null && (
                  <span className={badgeClasses}>
                    Memory completeness: {memoryScore}%
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCopyText}
                  className="px-3 py-1 text-xs border rounded-lg hover:bg-neutral-100"
                >
                  Copy
                </button>
                <button
                  onClick={handleDownloadText}
                  className="px-3 py-1 text-xs border rounded-lg hover:bg-neutral-100"
                >
                  Download .txt
                </button>
              </div>
            </div>
            <pre className={preClasses}>{activeProfile.profileText}</pre>
          </section>
        )}

        {/* Structured Identity Graph */}
        {activeJson && (
          <section className={cardClasses}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Structured Identity Graph</h2>
              <div className="flex flex-wrap gap-2 justify-end">
                <button
                  onClick={handleCopyJson}
                  className="px-3 py-1 text-xs border rounded-lg hover:bg-neutral-100"
                >
                  Copy JSON
                </button>
                <button
                  onClick={handleDownloadJson}
                  className="px-3 py-1 text-xs border rounded-lg hover:bg-neutral-100"
                >
                  Download .json
                </button>
              </div>
            </div>
            <pre className={jsonPreClasses}>
              {JSON.stringify(activeJson, null, 2)}
            </pre>

            {/* Personality export buttons */}
            <div className="mt-4 flex flex-wrap gap-2">
              <span className={badgeClasses}>Export as personality prompt</span>
              <button
                onClick={handleCopyClaudePrompt}
                className="px-3 py-1 text-xs border rounded-lg hover:bg-neutral-100"
              >
                Claude
              </button>
              <button
                onClick={handleCopyGeminiPrompt}
                className="px-3 py-1 text-xs border rounded-lg hover:bg-neutral-100"
              >
                Gemini
              </button>
              <button
                onClick={handleCopyOpenAIPrompt}
                className="px-3 py-1 text-xs border rounded-lg hover:bg-neutral-100"
              >
                OpenAI
              </button>
            </div>
          </section>
        )}

        {/* Persona Preview card */}
        {personaPreview && (
          <section className={cardClasses}>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">Persona Preview</h2>
              <span className={badgeClasses}>
                Generated from your identity graph
              </span>
            </div>
            <div className="space-y-2 text-sm">
              <p className="font-semibold">{personaPreview.title}</p>
              <p className="text-xs opacity-80">{personaPreview.tagline}</p>
              <div className="mt-3 space-y-1 text-sm">
                <p>
                  <span className="font-semibold">Best for: </span>
                  {personaPreview.bestFor}
                </p>
                <p>
                  <span className="font-semibold">Strengths: </span>
                  {personaPreview.strengths}
                </p>
                <p>
                  <span className="font-semibold">Note: </span>
                  {personaPreview.avoid}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Visual Identity Graph (force graph) */}
        {activeJson && (
          <section className={cardClasses}>
            <IdentityNodeGraph profileJson={activeJson} darkMode={darkMode} />
          </section>
        )}

        {/* Identity graph by section */}
        {graphSections.length > 0 && (
          <section className={cardClasses}>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">Identity graph by section</h2>
              <span className={badgeClasses}>
                Each group is a node in your identity graph
              </span>
            </div>
            <p className="text-xs opacity-70 mb-3">
              Each group is a node in your identity graph. Chips inside are the
              memories and traits extracted from your AI history.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {graphSections.map((section) => (
                <div
                  key={section.title}
                  className="border border-neutral-200 rounded-xl p-3 bg-neutral-50/70"
                >
                  <p className="text-xs font-semibold mb-2 uppercase tracking-wide">
                    {section.title}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {section.items.map((item, idx) => (
                      <span key={idx} className={chipClasses}>
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Mini Chat Sandbox */}
        {activeJson && (
          <section className={cardClasses}>
            <ChatSandbox profileJson={activeJson} darkMode={darkMode} />
          </section>
        )}

        {/* Tabbed sections (global pencil edit) */}
        {activeJson && (
          <section className={cardClasses}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">Profile Sections</h2>
                {editMode && <span className={badgeClasses}>Editing</span>}
              </div>
              <div className="flex items-center gap-2">
                {editMode && (
                  <>
                    <button
                      onClick={saveAllEdits}
                      className="px-3 py-1 text-xs rounded-full bg-black text-white"
                    >
                      Save changes
                    </button>
                    <button
                      onClick={cancelEdits}
                      className="px-3 py-1 text-xs rounded-full border"
                    >
                      Cancel
                    </button>
                  </>
                )}
                <button
                  onClick={toggleEditMode}
                  className="h-8 w-8 flex items-center justify-center rounded-full border border-neutral-300 hover:bg-neutral-100 text-xs"
                  title={editMode ? "Exit edit mode" : "Edit profile"}
                >
                  ✏️
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1 text-xs rounded-full border transition ${
                    activeTab === tab.id
                      ? "bg-black text-white border-black"
                      : "bg-transparent border-neutral-300 hover:bg-neutral-100"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="space-y-2">{renderTabContent()}</div>
          </section>
        )}

        {/* Insight + score explanation */}
        {insightText && (
          <section className={cardClasses}>
            <h2 className="text-lg font-semibold mb-1">Identity Insight</h2>
            <p className="text-xs opacity-70 mb-2">
              A quick interpretation of how complete and detailed your current
              identity graph looks.
            </p>
            <pre className={preClasses}>{insightText}</pre>
          </section>
        )}

        {/* Encryption Manager */}
        {activeJson && (
          <section className="w-full max-w-4xl">
            <EncryptionManager
              profileJson={activeJson}
              darkMode={darkMode}
              onEncryptionComplete={(encrypted) => {
                showToast("Identity graph encrypted successfully! Your data is now protected.", "success");
                console.log("Encrypted data:", encrypted);
                // You can save this to the server or keep it local-only
              }}
            />
          </section>
        )}

        {/* API Key Management */}
        {activeJson && (
          <section className="w-full max-w-4xl">
            <ApiKeyManager darkMode={darkMode} />
          </section>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50">
          <div
            className={`px-4 py-2 rounded-lg shadow-md text-xs ${
              toast.type === "success"
                ? "bg-emerald-500 text-white"
                : toast.type === "error"
                ? "bg-red-500 text-white"
                : "bg-neutral-800 text-white"
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}
    </main>
  );
}
