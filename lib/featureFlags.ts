/**
 * Feature Flags for Continuum
 *
 * Central place to control feature visibility.
 * Set to `false` to hide features from users.
 */

export const featureFlags = {
  // Monetization features
  SHOW_PRICING: false, // Set to true when ready to launch Pro tier
  ENABLE_STRIPE: false, // Set to true when Stripe is configured

  // Future features
  SHOW_CLOUD_BACKUP: false,
  SHOW_BROWSER_EXTENSION: false,
  SHOW_API_ACCESS: false,
  SHOW_TEAM_FEATURES: false,
} as const;

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: keyof typeof featureFlags): boolean {
  return Boolean(featureFlags[feature]);
}

/**
 * Get all enabled features
 */
export function getEnabledFeatures(): string[] {
  return Object.entries(featureFlags)
    .filter(([_, enabled]) => enabled)
    .map(([feature]) => feature);
}
