/**
 * Export History Manager
 * Handles storage and retrieval of multiple AI export profiles over time
 */

export interface ExportRecord {
  id: string;
  timestamp: number; // Unix timestamp
  source: "chatgpt" | "claude" | "gemini" | "unknown";
  profileJson: any;
  profileText: string;
  fileName?: string; // Original file name if available
}

export interface MergedProfile {
  profile: {
    basic: {
      name: string | null;
      age_range: string | null;
      location: string | null;
      _lastUpdated?: number;
    };
    preferences: {
      likes: string[];
      dislikes: string[];
      tone: string | null;
      _lastUpdated?: number;
    };
    work: {
      roles: string[];
      industries: string[];
      current_focus: string[];
      _lastUpdated?: number;
    };
    goals: {
      short_term: string[];
      long_term: string[];
      _lastUpdated?: number;
    };
    constraints: string[];
    skills: string[];
    communication_style: string[];
  };
  _meta: {
    exportCount: number;
    sources: string[];
    oldestExport: number;
    newestExport: number;
  };
}

const STORAGE_KEY = "continuum_export_history";
const MAX_EXPORTS = 50; // Limit to prevent localStorage overflow

/**
 * Save a new export to history
 */
export function saveExport(record: Omit<ExportRecord, "id" | "timestamp">): ExportRecord {
  const exports = getExportHistory();

  const newRecord: ExportRecord = {
    ...record,
    id: generateId(),
    timestamp: Date.now(),
  };

  // Add to beginning (newest first)
  exports.unshift(newRecord);

  // Keep only the most recent MAX_EXPORTS
  const trimmed = exports.slice(0, MAX_EXPORTS);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));

  return newRecord;
}

/**
 * Get all exports from history
 */
export function getExportHistory(): ExportRecord[] {
  if (typeof window === "undefined") return [];

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (err) {
    console.error("Failed to load export history:", err);
    return [];
  }
}

/**
 * Get a single export by ID
 */
export function getExportById(id: string): ExportRecord | null {
  const exports = getExportHistory();
  return exports.find((e) => e.id === id) || null;
}

/**
 * Delete an export by ID
 */
export function deleteExport(id: string): boolean {
  const exports = getExportHistory();
  const filtered = exports.filter((e) => e.id !== id);

  if (filtered.length === exports.length) {
    return false; // Not found
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

/**
 * Clear all export history
 */
export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Merge multiple exports into a single comprehensive profile
 */
export function mergeExports(exportIds?: string[]): MergedProfile {
  const allExports = getExportHistory();
  const exportsToMerge = exportIds
    ? allExports.filter((e) => exportIds.includes(e.id))
    : allExports;

  if (exportsToMerge.length === 0) {
    // Return empty profile
    return createEmptyProfile();
  }

  // Sort by timestamp (oldest first) so newer data overwrites older
  const sorted = [...exportsToMerge].sort((a, b) => a.timestamp - b.timestamp);

  // Initialize merged profile
  const merged: MergedProfile = createEmptyProfile();

  // Merge each export
  for (const exp of sorted) {
    const profile = exp.profileJson?.profile;
    if (!profile) continue;

    // Merge basic info (take most recent non-null values)
    if (profile.basic) {
      const basic = profile.basic;
      if (basic.name) {
        merged.profile.basic.name = basic.name;
        merged.profile.basic._lastUpdated = exp.timestamp;
      }
      if (basic.age_range) {
        merged.profile.basic.age_range = basic.age_range;
        merged.profile.basic._lastUpdated = exp.timestamp;
      }
      if (basic.location) {
        merged.profile.basic.location = basic.location;
        merged.profile.basic._lastUpdated = exp.timestamp;
      }
    }

    // Merge preferences
    if (profile.preferences) {
      const prefs = profile.preferences;
      merged.profile.preferences.likes = mergeArrays(
        merged.profile.preferences.likes,
        prefs.likes || []
      );
      merged.profile.preferences.dislikes = mergeArrays(
        merged.profile.preferences.dislikes,
        prefs.dislikes || []
      );
      if (prefs.tone) {
        merged.profile.preferences.tone = prefs.tone;
      }
      merged.profile.preferences._lastUpdated = exp.timestamp;
    }

    // Merge work
    if (profile.work) {
      const work = profile.work;
      merged.profile.work.roles = mergeArrays(merged.profile.work.roles, work.roles || []);
      merged.profile.work.industries = mergeArrays(
        merged.profile.work.industries,
        work.industries || []
      );
      merged.profile.work.current_focus = mergeArrays(
        merged.profile.work.current_focus,
        work.current_focus || []
      );
      merged.profile.work._lastUpdated = exp.timestamp;
    }

    // Merge goals
    if (profile.goals) {
      const goals = profile.goals;
      merged.profile.goals.short_term = mergeArrays(
        merged.profile.goals.short_term,
        goals.short_term || []
      );
      merged.profile.goals.long_term = mergeArrays(
        merged.profile.goals.long_term,
        goals.long_term || []
      );
      merged.profile.goals._lastUpdated = exp.timestamp;
    }

    // Merge arrays
    merged.profile.constraints = mergeArrays(
      merged.profile.constraints,
      profile.constraints || []
    );
    merged.profile.skills = mergeArrays(merged.profile.skills, profile.skills || []);
    merged.profile.communication_style = mergeArrays(
      merged.profile.communication_style,
      profile.communication_style || []
    );
  }

  // Set metadata
  merged._meta = {
    exportCount: exportsToMerge.length,
    sources: [...new Set(exportsToMerge.map((e) => e.source))],
    oldestExport: sorted[0].timestamp,
    newestExport: sorted[sorted.length - 1].timestamp,
  };

  return merged;
}

/**
 * Get statistics about export history
 */
export function getHistoryStats() {
  const exports = getExportHistory();

  if (exports.length === 0) {
    return {
      totalExports: 0,
      sources: {} as Record<string, number>,
      oldestExport: null,
      newestExport: null,
    };
  }

  const sources: Record<string, number> = {};
  for (const exp of exports) {
    sources[exp.source] = (sources[exp.source] || 0) + 1;
  }

  return {
    totalExports: exports.length,
    sources,
    oldestExport: Math.min(...exports.map((e) => e.timestamp)),
    newestExport: Math.max(...exports.map((e) => e.timestamp)),
  };
}

// Helper functions

function generateId(): string {
  return `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function mergeArrays(arr1: string[], arr2: string[]): string[] {
  // Remove duplicates (case-insensitive) and return union
  const combined = [...arr1, ...arr2];
  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of combined) {
    const lower = item.toLowerCase().trim();
    if (!seen.has(lower) && item.trim().length > 0) {
      seen.add(lower);
      result.push(item);
    }
  }

  return result;
}

function createEmptyProfile(): MergedProfile {
  return {
    profile: {
      basic: {
        name: null,
        age_range: null,
        location: null,
      },
      preferences: {
        likes: [],
        dislikes: [],
        tone: null,
      },
      work: {
        roles: [],
        industries: [],
        current_focus: [],
      },
      goals: {
        short_term: [],
        long_term: [],
      },
      constraints: [],
      skills: [],
      communication_style: [],
    },
    _meta: {
      exportCount: 0,
      sources: [],
      oldestExport: 0,
      newestExport: 0,
    },
  };
}
