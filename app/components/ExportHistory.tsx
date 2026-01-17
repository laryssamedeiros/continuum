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
import { ChevronDown, ChevronRight, Check, Trash2, Archive } from "lucide-react";

type ExportHistoryProps = {
  onMergedProfile?: (mergedData: any) => void;
  darkMode?: boolean;
};

export default function ExportHistory({ onMergedProfile, darkMode = true }: ExportHistoryProps) {
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
    return null;
  }

  const sourceBadge = (source: string) => {
    const label = source === "unknown" ? "Unknown" : source.toUpperCase();
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
        darkMode ? "border-white/20" : "border-black/20"
      }`}>
        {label}
      </span>
    );
  };

  return (
    <div className="w-full">
      {/* Toggle Button */}
      <button
        onClick={() => setShowHistory(!showHistory)}
        className={`rounded-2xl px-6 py-4 border-2 transition-all w-full flex items-center justify-between ${
          darkMode
            ? "border-white/20 hover:border-white/40"
            : "border-black/20 hover:border-black/40"
        }`}
      >
        <div className="flex items-center gap-4">
          <Archive className="w-6 h-6" />
          <div className="text-left">
            <p className="font-medium text-lg">Export History</p>
            <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              {stats?.totalExports || 0} saved export{stats?.totalExports !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        {showHistory ? (
          <ChevronDown className="w-5 h-5" />
        ) : (
          <ChevronRight className="w-5 h-5" />
        )}
      </button>

      {/* History Panel */}
      {showHistory && (
        <div className={`mt-4 rounded-2xl p-6 border-2 space-y-6 ${
          darkMode ? "border-white/20" : "border-black/20"
        }`}>
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold">Your Exports</h3>
            <button
              onClick={handleClearAll}
              className={`text-sm transition-all ${
                darkMode ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-black"
              }`}
            >
              Clear All
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={`rounded-xl p-4 border ${
              darkMode ? "border-white/10" : "border-black/10"
            }`}>
              <p className={`text-xs mb-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                Total
              </p>
              <p className="text-3xl font-bold">{stats?.totalExports || 0}</p>
            </div>
            {stats?.sources &&
              Object.entries(stats.sources).map(([source, count]) => (
                <div key={source} className={`rounded-xl p-4 border ${
                  darkMode ? "border-white/10" : "border-black/10"
                }`}>
                  <p className={`text-xs mb-1 capitalize ${
                    darkMode ? "text-gray-400" : "text-gray-600"
                  }`}>
                    {source}
                  </p>
                  <p className="text-3xl font-bold">{count as number}</p>
                </div>
              ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={selectAll}
              className={`text-sm px-4 py-2 rounded-full border transition-all ${
                darkMode
                  ? "border-white/20 hover:bg-white/10"
                  : "border-black/20 hover:bg-black/5"
              }`}
            >
              Select All
            </button>
            <button
              onClick={deselectAll}
              className={`text-sm px-4 py-2 rounded-full border transition-all ${
                darkMode
                  ? "border-white/20 hover:bg-white/10"
                  : "border-black/20 hover:bg-black/5"
              }`}
            >
              Deselect All
            </button>
            <button
              onClick={handleMergeSelected}
              className={`text-sm px-6 py-2 rounded-full font-medium transition-all ${
                darkMode
                  ? "bg-white text-black hover:bg-gray-200"
                  : "bg-black text-white hover:bg-gray-800"
              }`}
            >
              {selectedExports.size > 0
                ? `Merge ${selectedExports.size} Selected`
                : "Merge All"}
            </button>
          </div>

          {/* Export List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {exports.map((exp) => {
              const isSelected = selectedExports.has(exp.id);
              const date = new Date(exp.timestamp);

              return (
                <div
                  key={exp.id}
                  className={`rounded-xl p-4 border-2 transition-all cursor-pointer ${
                    isSelected
                      ? darkMode
                        ? "border-white bg-white/5"
                        : "border-black bg-black/5"
                      : darkMode
                      ? "border-white/20 hover:border-white/40"
                      : "border-black/20 hover:border-black/40"
                  }`}
                  onClick={() => toggleSelect(exp.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      {/* Checkbox */}
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 flex-shrink-0 transition-all ${
                          isSelected
                            ? darkMode
                              ? "bg-white border-white"
                              : "bg-black border-black"
                            : darkMode
                            ? "border-white/30"
                            : "border-black/30"
                        }`}
                      >
                        {isSelected && (
                          <Check className={`w-3 h-3 ${darkMode ? "text-black" : "text-white"}`} />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          {sourceBadge(exp.source)}
                          <span className={`text-xs ${
                            darkMode ? "text-gray-400" : "text-gray-600"
                          }`}>
                            {date.toLocaleDateString()} at {date.toLocaleTimeString()}
                          </span>
                        </div>

                        {exp.fileName && (
                          <p className={`text-sm mb-2 truncate ${
                            darkMode ? "text-gray-300" : "text-gray-700"
                          }`}>
                            {exp.fileName}
                          </p>
                        )}

                        {/* Quick Stats */}
                        <div className={`flex gap-3 text-xs ${
                          darkMode ? "text-gray-400" : "text-gray-600"
                        }`}>
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
                      className={`transition-all flex-shrink-0 ${
                        darkMode
                          ? "text-gray-400 hover:text-white"
                          : "text-gray-600 hover:text-black"
                      }`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Help Text */}
          <div className={`text-sm rounded-xl p-4 border ${
            darkMode ? "border-white/10 bg-white/5" : "border-black/10 bg-black/5"
          }`}>
            <p className="font-medium mb-2">How merging works:</p>
            <ul className={`space-y-1 ml-4 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              <li>• Select exports to combine into one profile</li>
              <li>• Arrays (skills, goals) are merged, duplicates removed</li>
              <li>• Basic info uses most recent values</li>
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
