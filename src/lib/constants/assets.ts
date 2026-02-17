/**
 * Asset paths constants
 * Centralized location for all static asset paths
 */

export const LOGOS = {
  // Main logos
  LARGE_LIGHT: "/img/PDSLogo1.png",
  LARGE_DARK: "/img/PDSLogo2.png",

  // Small logo (note: original file had double .png extension - fixed)
  SMALL: "/img/PDSLogo1-xsm.png",

  // Alternative small logo
  SMALL_ALT: "/img/SmallLogo.png",
} as const;

export const ICONS = {
  FAVICON: "/favicon.ico",
} as const;

/**
 * Get logo path based on current theme
 * @param theme - Current theme (light/dark/system)
 * @param size - Logo size (large/small)
 * @returns Path to appropriate logo
 */
export function getLogoPath(
  theme: "light" | "dark" | "system",
  size: "large" | "small" = "large"
): string {
  if (size === "small") {
    return LOGOS.SMALL_ALT;
  }

  // For system theme, default to light logo
  // (could be enhanced to check actual system preference)
  if (theme === "system" || theme === "light") {
    return LOGOS.LARGE_LIGHT;
  }

  return LOGOS.LARGE_DARK;
}
