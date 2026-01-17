"use client";

import React, { useState, useEffect } from "react";
import {
  getExportHistory,
  deleteExport,
  clearHistory,
  getHistoryStats,
  mergeExports,
  type ExportRecord,
} from "@/lib/exportHistory";

type ExportHistoryProps = {
  onMergedProfile?: (mergedData: any) => void;
};

export default function ExportHistory({ onMergedProfile }: ExportHistoryProps) {
  const [exports, setExports] = useState<ExportRecord[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [selectedExports, setSelectedExports] = useState<Set<string>>(new Set());
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    refreshHistory();
  }, []);

  const refreshHistory = () => {
    const history = getExportHistory();
    const historyStats = getHistoryStats();
    setExports(history);
    setStats(historyStats);
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this export from history?")) {
      deleteExport(id);
      refreshHistory();
      setSelectedExports((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleClearAll = () => {
    if (confirm("Clear all export history? This cannot be undone.")) {
      clearHistory();
      refreshHistory();
      setSelectedExports(new Set());
    }
  };

  const handleMergeSelected = () => {
    const ids = Array.from(selectedExports);
    const merged = mergeExports(ids.length > 0 ? ids : undefined);

    // Convert to format expected by parent component
    const profileText = buildProfileTextFromMerged(merged);

    if (onMergedProfile) {
      onMergedProfile({
        profileText,
        profileJson: merged,
        source: "merged",
      });
    }

    setShowHistory(false);
  };

  const toggleSelect = (id: string) => {
    setSelectedExports((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedExports(new Set(exports.map((e) => e.id)));
  };

  const deselectAll = () => {
    setSelectedExports(new Set());
  };

  if (exports.length === 0) {
    return null; // Don't show if no history
  }

  const sourceBadgeColor = (source: string) => {
    switch (source) {
      case "chatgpt":
        return "bg-green-500/20 text-green-700 border-green-500/30";
      case "claude":
        return "bg-orange-500/20 text-orange-700 border-orange-500/30";
      case "gemini":
        return "bg-blue-500/20 text-blue-700 border-blue-500/30";
      default:
        return "bg-gray-500/20 text-gray-700 border-gray-500/30";
    }
  };

  return (
    <div className="w-full">
      {/* Toggle Button */}
      <button
        onClick={() => setShowHistory(!showHistory)}
        className="glass rounded-2xl px-6 py-3 hover-glow transition-smooth border border-white/20 w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">📚</span>
          <div className="text-left">
            <p className="font-medium">Export History</p>
            <p className="text-xs opacity-70">
              {stats?.totalExports || 0} export{stats?.totalExports !== 1 ? "s" : ""} saved
            </p>
          </div>
        </div>
        <span className="text-xl">{showHistory ? "▼" : "▶"}</span>
      </button>

      {/* History Panel */}
      {showHistory && (
        <div className="mt-4 glass rounded-3xl p-6 border border-white/20 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Your Export History</h3>
            <button
              onClick={handleClearAll}
              className="text-xs text-red-600 hover:text-red-700 transition-all"
            >
              Clear All
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="glass rounded-xl p-3 border border-white/10">
              <p className="text-xs opacity-70">Total Exports</p>
              <p className="text-2xl font-bold">{stats?.totalExports || 0}</p>
            </div>
            {stats?.sources &&
              Object.entries(stats.sources).map(([source, count]) => (
                <div key={source} className="glass rounded-xl p-3 border border-white/10">
                  <p className="text-xs opacity-70 capitalize">{source}</p>
                  <p className="text-2xl font-bold">{count as number}</p>
                </div>
              ))}
          </div>

          {/* Bulk Actions */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={selectAll}
              className="text-xs px-3 py-1.5 rounded-lg glass border border-white/20 hover-glow transition-smooth"
            >
              Select All
            </button>
            <button
              onClick={deselectAll}
              className="text-xs px-3 py-1.5 rounded-lg glass border border-white/20 hover-glow transition-smooth"
            >
              Deselect All
            </button>
            <button
              onClick={handleMergeSelected}
              className="text-xs px-4 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium hover-glow transition-smooth shadow-lg"
            >
              {selectedExports.size > 0
                ? `Merge ${selectedExports.size} Selected`
                : "Merge All"}
            </button>
          </div>

          {/* Export List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {exports.map((exp) => {
              const isSelected = selectedExports.has(exp.id);
              const date = new Date(exp.timestamp);

              return (
                <div
                  key={exp.id}
                  className={`glass rounded-xl p-4 border transition-all cursor-pointer ${
                    isSelected
                      ? "border-purple-500 bg-purple-500/10"
                      : "border-white/20 hover:border-purple-400/50"
                  }`}
                  onClick={() => toggleSelect(exp.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      {/* Checkbox */}
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 transition-all ${
                          isSelected
                            ? "bg-purple-600 border-purple-600"
                            : "border-white/30"
                        }`}
                      >
                        {isSelected && <span className="text-white text-xs">✓</span>}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full border font-medium ${sourceBadgeColor(
                              exp.source
                            )}`}
                          >
                            {exp.source === "unknown" ? "Unknown" : exp.source.toUpperCase()}
                          </span>
                          <span className="text-xs opacity-60">
                            {date.toLocaleDateString()} at {date.toLocaleTimeString()}
                          </span>
                        </div>

                        {exp.fileName && (
                          <p className="text-xs opacity-70 mt-1 truncate">{exp.fileName}</p>
                        )}

                        {/* Quick Stats */}
                        <div className="flex gap-3 mt-2 text-xs opacity-70">
                          {exp.profileJson?.profile?.skills?.length > 0 && (
                            <span>{exp.profileJson.profile.skills.length} skills</span>
                          )}
                          {exp.profileJson?.profile?.preferences?.likes?.length > 0 && (
                            <span>
                              {exp.profileJson.profile.preferences.likes.length} likes
                            </span>
                          )}
                          {exp.profileJson?.profile?.work?.roles?.length > 0 && (
                            <span>{exp.profileJson.profile.work.roles.length} roles</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(exp.id);
                      }}
                      className="text-red-600 hover:text-red-700 transition-all text-xs px-2 py-1"
                      title="Delete export"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Help Text */}
          <div className="text-xs opacity-60 glass rounded-lg p-3 border border-white/10">
            <p className="font-medium mb-1">💡 How it works:</p>
            <ul className="space-y-1 ml-4">
              <li>• Select exports to merge them into one comprehensive profile</li>
              <li>• Skills, goals, and preferences are combined (duplicates removed)</li>
              <li>• Basic info (name, location) uses the most recent value</li>
              <li>• Click "Merge All" to combine everything</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper: Build human-readable profile text from merged profile
function buildProfileTextFromMerged(merged: any): string {
  const p = merged.profile;

  const arr = (v: any) => (Array.isArray(v) ? v : []);
  const orNA = (v: any) =>
    typeof v === "string" && v.trim().length ? v : "N/A";

  return `
Portable AI Memory Profile (Merged)

Basic:
- Name: ${orNA(p.basic?.name)}
- Age range: ${orNA(p.basic?.age_range)}
- Location: ${orNA(p.basic?.location)}

Preferences:
- Likes: ${arr(p.preferences?.likes).join(", ") || "N/A"}
- Dislikes: ${arr(p.preferences?.dislikes).join(", ") || "N/A"}
- Tone: ${orNA(p.preferences?.tone)}

Work:
- Roles: ${arr(p.work?.roles).join(", ") || "N/A"}
- Industries: ${arr(p.work?.industries).join(", ") || "N/A"}
- Current focus: ${arr(p.work?.current_focus).join(", ") || "N/A"}

Goals:
- Short term: ${arr(p.goals?.short_term).join(", ") || "N/A"}
- Long term: ${arr(p.goals?.long_term).join(", ") || "N/A"}

Constraints:
- ${arr(p.constraints).join(", ") || "N/A"}

Skills:
- ${arr(p.skills).join(", ") || "N/A"}

Communication style:
- ${arr(p.communication_style).join(", ") || "N/A"}

---
Merged from ${merged._meta?.exportCount || 0} export(s)
Sources: ${(merged._meta?.sources || []).join(", ")}
`.trim();
}
