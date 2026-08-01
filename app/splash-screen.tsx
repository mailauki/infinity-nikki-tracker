import {
  SPLASH_BACKGROUND_DARK,
  SPLASH_BACKGROUND_LIGHT,
  SPLASH_THEME_COLOR,
} from '@/lib/splash-colors'

// Fallback for the root Suspense boundary in app/layout.tsx, which suspends while
// ThemedApp awaits connection() and the Supabase preferences round-trip. Without it
// the app paints nothing on a cold load.
//
// This renders OUTSIDE the MUI ThemeProvider it is a fallback for, so it cannot use
// MUI, `sx`, or useColorScheme(). Plain HTML and a <style> block only — which also
// means zero JS and a first-frame paint.
//
// The logo and app name are shown only in the installed PWA, via
// @media (display-mode: standalone). In a normal browser tab only the themed
// background paints, which removes the white flash without pretending to be a
// layout skeleton that would drift from the real one.
export default function SplashScreen() {
  return (
    <div aria-hidden="true" className="splash-root">
      <style>{css}</style>
      <div className="splash-brand">
        {/* Source is 192x192 rendered at 96x96 — the 2x keeps it crisp on the retina
            displays every target phone has. */}
        {/* eslint-disable-next-line @next/next/no-img-element -- next.config.ts sets
            images.unoptimized, so next/image emits a plain <img> regardless; using it
            here would only add a client component to a fallback that must ship no JS. */}
        <img alt="" className="splash-logo" height={96} src="/icons/pwa/icon-192.png" width={96} />
        <p className="splash-name">Infinity Nikki Tracker</p>
      </div>
    </div>
  )
}

const css = `
.splash-root {
  position: fixed;
  inset: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${SPLASH_BACKGROUND_LIGHT};
}
.splash-brand {
  display: none;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  animation: splash-fade 400ms ease-out both;
}
.splash-logo {
  width: 96px;
  height: 96px;
  border-radius: 22%;
}
.splash-name {
  margin: 0;
  font-size: 1rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  color: ${SPLASH_THEME_COLOR};
}
@media (display-mode: standalone) {
  .splash-brand { display: flex; }
}
@media (prefers-color-scheme: dark) {
  .splash-root { background: ${SPLASH_BACKGROUND_DARK}; }
  .splash-name { color: #f1dfd9; }
}
@keyframes splash-fade {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: none; }
}
@media (prefers-reduced-motion: reduce) {
  .splash-brand { animation: none; }
}
`
