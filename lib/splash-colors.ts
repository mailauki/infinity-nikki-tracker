// Colour literals shared by the web app manifest, the viewport themeColor, and the
// splash fallback in app/splash-screen.tsx.
//
// These are intentionally literals rather than being derived from COLOR_THEME_PRESETS.
// The OS reads the manifest — and the browser applies themeColor — before any app JS
// runs, so only one static value can exist no matter which of the four colour themes
// the user has chosen. They match the Terracotta ('default') preset.
export const SPLASH_BACKGROUND_LIGHT = '#FFF8F6'
export const SPLASH_BACKGROUND_DARK = '#1a110e'
export const SPLASH_THEME_COLOR = '#8F4C33'
