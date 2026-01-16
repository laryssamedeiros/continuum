// lib/ingest/mergeProfiles.ts

export type ProfileJson = any;

function toCleanArray(value: any): string[] {
  if (!value) return [];
  if (!Array.isArray(value)) return [];
  return value
    .map((v) => String(v).trim())
    .filter((v) => v.length > 0);
}

function mergeArrays(a: any, b: any): string[] {
  const merged = [...toCleanArray(a), ...toCleanArray(b)];
  const unique = Array.from(new Set(merged));
  return unique;
}

function pickString(existing: any, incoming: any): string | null {
  const e =
    typeof existing === "string" && existing.trim().length > 0 ? existing : null;
  const i =
    typeof incoming === "string" && incoming.trim().length > 0 ? incoming : null;
  return e ?? i ?? null;
}

export function createEmptyProfileJson(): ProfileJson {
  return {
    profile: {
      basic: {
        name: null,
        age_range: null,
        location: null,
      },
      preferences: {
        likes: [] as string[],
        dislikes: [] as string[],
        tone: null as string | null,
      },
      work: {
        roles: [] as string[],
        industries: [] as string[],
        current_focus: [] as string[],
      },
      goals: {
        short_term: [] as string[],
        long_term: [] as string[],
      },
      constraints: [] as string[],
      skills: [] as string[],
      communication_style: [] as string[],
    },
  };
}

/**
 * Merge multiple partial profiles into a single unified profile.
 * - Strings: take the first non-null, non-empty
 * - Arrays: union + deduplicate
 */
export function mergeProfileJsons(list: ProfileJson[]): ProfileJson {
  if (!list || !list.length) return createEmptyProfileJson();

  const result = createEmptyProfileJson();

  for (const item of list) {
    if (!item || !item.profile) continue;
    const p = item.profile;

    // Basic
    result.profile.basic.name = pickString(
      result.profile.basic.name,
      p.basic?.name
    );
    result.profile.basic.age_range = pickString(
      result.profile.basic.age_range,
      p.basic?.age_range
    );
    result.profile.basic.location = pickString(
      result.profile.basic.location,
      p.basic?.location
    );

    // Preferences
    result.profile.preferences.likes = mergeArrays(
      result.profile.preferences.likes,
      p.preferences?.likes
    );
    result.profile.preferences.dislikes = mergeArrays(
      result.profile.preferences.dislikes,
      p.preferences?.dislikes
    );
    result.profile.preferences.tone = pickString(
      result.profile.preferences.tone,
      p.preferences?.tone
    );

    // Work
    result.profile.work.roles = mergeArrays(
      result.profile.work.roles,
      p.work?.roles
    );
    result.profile.work.industries = mergeArrays(
      result.profile.work.industries,
      p.work?.industries
    );
    result.profile.work.current_focus = mergeArrays(
      result.profile.work.current_focus,
      p.work?.current_focus
    );

    // Goals
    result.profile.goals.short_term = mergeArrays(
      result.profile.goals.short_term,
      p.goals?.short_term
    );
    result.profile.goals.long_term = mergeArrays(
      result.profile.goals.long_term,
      p.goals?.long_term
    );

    // Constraints, skills, comms
    result.profile.constraints = mergeArrays(
      result.profile.constraints,
      p.constraints
    );
    result.profile.skills = mergeArrays(result.profile.skills, p.skills);
    result.profile.communication_style = mergeArrays(
      result.profile.communication_style,
      p.communication_style
    );
  }

  return result;
}
