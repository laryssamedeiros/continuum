"use client";

import { useMemo, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";

type IdentityNodeGraphProps = {
  profileJson: any;
  darkMode: boolean;
};

type GraphViewMode = "simple" | "full";

type TraitNode = {
  id: string;
  label: string;
  group: string; // e.g. "preferences", "work", etc.
  weight: number;
};

type FGNode = {
  id: string;
  label: string;
  group: string;
  weight: number;
};

type FGLink = {
  source: string;
  target: string;
};

const MAX_SIMPLE_TRAITS = 80;
const MAX_FULL_TRAITS = 250;

const CATEGORY_BASE_WEIGHTS: Record<string, number> = {
  basic: 2.0,
  preferences: 1.4,
  goals: 1.4,
  constraints: 1.3,
  work_roles: 1.2,
  work_industries: 0.9,
  work_focus: 1.2,
  skills: 1.2,
  communication: 1.0,
};

function normalizeLabel(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Builds ranked trait nodes from the profile JSON.
 * - Collapses near-duplicates by normalized label
 * - Assigns category-based weights
 * - Filters out super-long "brainstorm sentences"
 */
function buildRankedTraits(profileJson: any): TraitNode[] {
  if (!profileJson || !profileJson.profile) return [];
  const p = profileJson.profile;

  const map = new Map<
    string,
    { label: string; group: string; weight: number }
  >();

  const addTrait = (label: string | null, group: string, baseWeight: number) => {
    if (!label) return;
    const trimmed = label.trim();
    if (!trimmed) return;

    // Skip huge sentences (likely brainstorming / noise)
    if (trimmed.length > 120) return;

    const key = normalizeLabel(trimmed);
    if (!key) return;

    const existing = map.get(key);
    if (existing) {
      existing.weight += baseWeight; // reinforce repeated signals
    } else {
      map.set(key, { label: trimmed, group, weight: baseWeight });
    }
  };

  // ----- Basic -----
  if (p.basic?.name) {
    addTrait(`Name: ${p.basic.name}`, "basic", CATEGORY_BASE_WEIGHTS.basic);
  }
  if (p.basic?.age_range) {
    addTrait(
      `Age range: ${p.basic.age_range}`,
      "basic",
      CATEGORY_BASE_WEIGHTS.basic
    );
  }
  if (p.basic?.location) {
    addTrait(
      `Location: ${p.basic.location}`,
      "basic",
      CATEGORY_BASE_WEIGHTS.basic
    );
  }

  // ----- Preferences -----
  if (Array.isArray(p.preferences?.likes)) {
    for (const item of p.preferences.likes) {
      addTrait(
        `Likes: ${item}`,
        "preferences",
        CATEGORY_BASE_WEIGHTS.preferences
      );
    }
  }
  if (Array.isArray(p.preferences?.dislikes)) {
    for (const item of p.preferences.dislikes) {
      addTrait(
        `Dislikes: ${item}`,
        "preferences",
        CATEGORY_BASE_WEIGHTS.preferences
      );
    }
  }
  if (p.preferences?.tone) {
    addTrait(
      `Tone: ${p.preferences.tone}`,
      "preferences",
      CATEGORY_BASE_WEIGHTS.preferences
    );
  }

  // ----- Work -----
  if (Array.isArray(p.work?.roles)) {
    for (const item of p.work.roles) {
      addTrait(
        `Role: ${item}`,
        "work_roles",
        CATEGORY_BASE_WEIGHTS.work_roles
      );
    }
  }
  if (Array.isArray(p.work?.industries)) {
    for (const item of p.work.industries) {
      addTrait(
        `Industry: ${item}`,
        "work_industries",
        CATEGORY_BASE_WEIGHTS.work_industries
      );
    }
  }
  if (Array.isArray(p.work?.current_focus)) {
    for (const item of p.work.current_focus) {
      addTrait(
        `Focus: ${item}`,
        "work_focus",
        CATEGORY_BASE_WEIGHTS.work_focus
      );
    }
  }

  // ----- Goals -----
  if (Array.isArray(p.goals?.short_term)) {
    for (const item of p.goals.short_term) {
      addTrait(
        `Short-term goal: ${item}`,
        "goals",
        CATEGORY_BASE_WEIGHTS.goals
      );
    }
  }
  if (Array.isArray(p.goals?.long_term)) {
    for (const item of p.goals.long_term) {
      addTrait(
        `Long-term goal: ${item}`,
        "goals",
        CATEGORY_BASE_WEIGHTS.goals
      );
    }
  }

  // ----- Constraints -----
  if (Array.isArray(p.constraints)) {
    for (const item of p.constraints) {
      addTrait(item, "constraints", CATEGORY_BASE_WEIGHTS.constraints);
    }
  }

  // ----- Skills -----
  if (Array.isArray(p.skills)) {
    for (const item of p.skills) {
      addTrait(item, "skills", CATEGORY_BASE_WEIGHTS.skills);
    }
  }

  // ----- Communication style -----
  if (Array.isArray(p.communication_style)) {
    for (const item of p.communication_style) {
      addTrait(
        item,
        "communication",
        CATEGORY_BASE_WEIGHTS.communication
      );
    }
  }

  const traits: TraitNode[] = [];
  let idx = 0;
  for (const { label, group, weight } of map.values()) {
    traits.push({
      id: `trait-${idx++}`,
      label,
      group,
      weight,
    });
  }

  // Sort by weight desc, then by shorter label first
  traits.sort((a, b) => {
    if (b.weight !== a.weight) return b.weight - a.weight;
    return a.label.length - b.label.length;
  });

  return traits;
}

export default function IdentityNodeGraph({
  profileJson,
  darkMode,
}: IdentityNodeGraphProps) {
  const [viewMode, setViewMode] = useState<GraphViewMode>("simple");

  const { nodes, links } = useMemo(() => {
    if (!profileJson || !profileJson.profile) {
      return { nodes: [] as FGNode[], links: [] as FGLink[] };
    }

    const traits = buildRankedTraits(profileJson);

    const limit =
      viewMode === "simple" ? MAX_SIMPLE_TRAITS : MAX_FULL_TRAITS;
    const limitedTraits = traits.slice(0, limit);

    const fgNodes: FGNode[] = [];
    const fgLinks: FGLink[] = [];

    // Root node
    const name = profileJson.profile.basic?.name || "You";

    fgNodes.push({
      id: "root",
      label: name,
      group: "root",
      weight: 999,
    });

    // Category nodes map
    const categoryNodes = new Map<string, FGNode>();

    const ensureCategoryNode = (category: string, label: string) => {
      if (categoryNodes.has(category)) return categoryNodes.get(category)!;
      const node: FGNode = {
        id: `cat-${category}`,
        label,
        group: "category",
        weight: 500,
      };
      categoryNodes.set(category, node);
      fgNodes.push(node);
      // link from root
      fgLinks.push({ source: "root", target: node.id });
      return node;
    };

    for (const trait of limitedTraits) {
      let catLabel = "";
      let catKey = trait.group;

      switch (trait.group) {
        case "basic":
          catLabel = "Basic";
          break;
        case "preferences":
          catLabel = "Preferences";
          break;
        case "goals":
          catLabel = "Goals";
          break;
        case "constraints":
          catLabel = "Constraints";
          break;
        case "work_roles":
        case "work_industries":
        case "work_focus":
          catLabel = "Work";
          catKey = "work";
          break;
        case "skills":
          catLabel = "Skills";
          break;
        case "communication":
          catLabel = "Communication";
          break;
        default:
          catLabel = "Other";
          catKey = "other";
          break;
      }

      const catNode = ensureCategoryNode(catKey, catLabel);

      const traitNode: FGNode = {
        id: trait.id,
        label: trait.label,
        group: trait.group,
        weight: trait.weight,
      };
      fgNodes.push(traitNode);
      fgLinks.push({ source: catNode.id, target: traitNode.id });
    }

    return { nodes: fgNodes, links: fgLinks };
  }, [profileJson, viewMode]);

  const bg = darkMode ? "#020617" : "#ffffff";

  const nodeColor = (node: FGNode) => {
    if (node.group === "root") return "#ffffff";
    if (node.group === "category") return darkMode ? "#38bdf8" : "#0f172a";
    switch (node.group) {
      case "basic":
        return "#f97316";
      case "preferences":
        return "#22c55e";
      case "goals":
        return "#eab308";
      case "constraints":
        return "#f97373";
      case "work_roles":
      case "work_industries":
      case "work_focus":
        return "#6366f1";
      case "skills":
        return "#ec4899";
      case "communication":
        return "#a855f7";
      default:
        return "#9ca3af";
    }
  };

  return (
    <div className="w-full flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">
            Graph view of your identity
          </h2>
          <p className="text-xs opacity-70">
            Drag nodes around. Each node is a stable trait or category in
            your identity graph.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] uppercase tracking-wide opacity-60">
            View
          </span>
          <button
            onClick={() => setViewMode("simple")}
            className={`px-3 py-1 text-xs rounded-full border ${
              viewMode === "simple"
                ? "bg-black text-white border-black"
                : "bg-transparent border-neutral-400 hover:bg-neutral-100"
            }`}
          >
            Simple
          </button>
          <button
            onClick={() => setViewMode("full")}
            className={`px-3 py-1 text-xs rounded-full border ${
              viewMode === "full"
                ? "bg-black text-white border-black"
                : "bg-transparent border-neutral-400 hover:bg-neutral-100"
            }`}
          >
            Full
          </button>
        </div>
      </div>

      <div className="w-full h-[420px] rounded-xl overflow-hidden border border-neutral-800 bg-black/90">
        {nodes.length > 0 && (
          <ForceGraph2D
            graphData={{ nodes, links }}
            backgroundColor={bg}
            nodeLabel={(node: any) => node.label}
            nodeRelSize={5}
            nodeAutoColorBy={(node: any) => node.group}
            linkColor={() =>
              darkMode
                ? "rgba(148,163,184,0.4)"
                : "rgba(148,163,184,0.7)"
            }
            linkWidth={0.5}
            cooldownTicks={80}
            nodeCanvasObject={(node: any, ctx, globalScale) => {
              const n = node as FGNode;
              const label = n.label;
              const fontSize = 10 / globalScale;

              // Draw node
              ctx.beginPath();
              ctx.arc(node.x!, node.y!, 3.2, 0, 2 * Math.PI, false);
              ctx.fillStyle = nodeColor(n);
              ctx.fill();

              // Only draw labels for important nodes to avoid clutter
              const showLabel =
                n.group === "root" ||
                n.group === "category" ||
                (viewMode === "simple" && n.weight >= 1.3);

              if (!showLabel) return;

              ctx.font =
                `${fontSize}px system-ui, -apple-system, BlinkMacSystemFont`;
              ctx.fillStyle = darkMode ? "#e5e7eb" : "#111827";
              ctx.textAlign = "left";
              ctx.textBaseline = "middle";
              ctx.fillText(label, node.x! + 5, node.y! + 0);
            }}
          />
        )}
      </div>
      <p className="text-[11px] opacity-60">
        Simple view shows your strongest ~{MAX_SIMPLE_TRAITS} traits. Full view
        includes more details and may look dense for large imports.
      </p>
    </div>
  );
}

