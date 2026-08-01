# PWA Splash Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the blank screen shown during a cold PWA/browser load with a CSS-only splash — themed background everywhere, logo and app name only in the installed app.

**Architecture:** The root `<Suspense>` in `app/layout.tsx` currently has no fallback, so nothing paints while `ThemedApp` awaits `connection()` and a Supabase preferences round-trip. Give that boundary a fallback component. Because the fallback renders _outside_ the MUI `ThemeProvider` it wraps, it must be plain HTML plus an inline `<style>` block — no MUI, no client JS. Shared colour literals move to a small constants module so the manifest, the viewport `themeColor`, and the splash cannot drift apart.

**Tech Stack:** Next.js 16 App Router (React Server Components), TypeScript, plain CSS. No new dependencies.

**Spec:** `docs/specs/2026-08-01-pwa-splash-screen-design.md`

## Global Constraints

- **Package manager is Yarn.** Never `npm` or `pnpm`.
- **Prettier style:** no semicolons, single quotes, 2-space indent, 100 char print width, trailing commas (ES5). A PostToolUse hook runs `yarn format && yarn lint:fix` then `yarn tsc --noEmit` after every Edit/Write — expect files to be reformatted after you write them.
- **No test runner exists in this repo.** `package.json` scripts are exactly: `dev`, `build`, `start`, `lint`, `format`, `lint:fix`. Do not add a test framework. Verification is `yarn tsc --noEmit`, `yarn lint`, `yarn build`, and browser checks.
- **Type-check with `yarn tsc --noEmit`**, never `yarn dlx tsc` (fetches a bogus placeholder package).
- **Path alias `@/` maps to the project root.**
- **The splash component must not import from `@mui/material`** or call any MUI hook. It renders outside the `ThemeProvider`.
- **Colour values (exact, do not retype from memory):** light background `#FFF8F6`, dark background `#1a110e`, theme/accent `#8F4C33`, dark-mode text `#f1dfd9`.
- **Work happens on branch `claude/pwa-splash-screen`**, which already exists and already contains the spec commit. Do not push to `main`.

---

### Task 1: Extract shared splash colour constants

Creates the single source of truth for the three colour literals, and rewires the two existing consumers. This is a pure refactor with no behaviour change, so it is verified by diffing the served manifest before and after: the output must be byte-identical.

**Files:**

- Create: `lib/splash-colors.ts`
- Modify: `app/manifest.ts:15-16`
- Modify: `app/layout.tsx:60-63`

**Interfaces:**

- Consumes: nothing (first task).
- Produces: three named exports used by Tasks 2 and 3 —
  `SPLASH_BACKGROUND_LIGHT: string` (`'#FFF8F6'`),
  `SPLASH_BACKGROUND_DARK: string` (`'#1a110e'`),
  `SPLASH_THEME_COLOR: string` (`'#8F4C33'`).

- [ ] **Step 1: Record the current manifest output as a baseline**

Start the dev server if it is not already running (`yarn dev`), then:

```bash
curl -s http://localhost:3000/manifest.webmanifest > "${TMPDIR:-/tmp}/manifest-before.json"
cat "${TMPDIR:-/tmp}/manifest-before.json"
```

Expected: JSON containing `"background_color":"#FFF8F6"` and `"theme_color":"#8F4C33"`. Keep this file; Step 6 diffs against it.

- [ ] **Step 2: Create the constants module**

Create `lib/splash-colors.ts`:

```ts
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
```

- [ ] **Step 3: Rewire `app/manifest.ts`**

Add the import at the top of the file, below the existing `import type { MetadataRoute } from 'next'`:

```ts
import { SPLASH_BACKGROUND_LIGHT, SPLASH_THEME_COLOR } from '@/lib/splash-colors'
```

Then replace these two lines:

```ts
    background_color: '#FFF8F6',
    theme_color: '#8F4C33',
```

with:

```ts
    background_color: SPLASH_BACKGROUND_LIGHT,
    theme_color: SPLASH_THEME_COLOR,
```

Leave the existing explanatory comment block above `export default function manifest()` exactly as it is — it documents the same constraint and is still accurate.

- [ ] **Step 4: Rewire the viewport in `app/layout.tsx`**

Add to the import block near the top:

```ts
import { SPLASH_BACKGROUND_DARK, SPLASH_BACKGROUND_LIGHT } from '@/lib/splash-colors'
```

Then replace the `themeColor` array entries:

```ts
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FFF8F6' },
    { media: '(prefers-color-scheme: dark)', color: '#1a110e' },
  ],
```

with:

```ts
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: SPLASH_BACKGROUND_LIGHT },
    { media: '(prefers-color-scheme: dark)', color: SPLASH_BACKGROUND_DARK },
  ],
```

- [ ] **Step 5: Type-check and lint**

```bash
yarn tsc --noEmit && yarn lint
```

Expected: both exit 0 with no output about these files. If `tsc` reports "Cannot find module '@/lib/splash-colors'", the file was created in the wrong directory — it belongs at the repo root under `lib/`.

- [ ] **Step 6: Verify the manifest output is unchanged**

With the dev server running:

```bash
curl -s http://localhost:3000/manifest.webmanifest > "${TMPDIR:-/tmp}/manifest-after.json"
diff "${TMPDIR:-/tmp}/manifest-before.json" "${TMPDIR:-/tmp}/manifest-after.json" && echo "IDENTICAL"
```

Expected: prints `IDENTICAL` with no diff output. This is the whole point of the task — a refactor that changes the served bytes has changed behaviour and is wrong.

- [ ] **Step 7: Commit**

```bash
git add lib/splash-colors.ts app/manifest.ts app/layout.tsx
git commit -m "refactor(splash): extract shared splash colour constants

The light/dark background and theme colours were hand-copied across
manifest.ts and layout.tsx, and the splash screen needs a third copy.
Move them to lib/splash-colors.ts so they cannot drift.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 2: Build the splash screen component

Creates the component in isolation and proves it renders correctly before wiring it into the layout. Splitting this from Task 3 means a reviewer can reject the visual design without rejecting the layout change, and vice versa.

**Files:**

- Create: `app/splash-screen.tsx`

**Interfaces:**

- Consumes: `SPLASH_BACKGROUND_DARK`, `SPLASH_BACKGROUND_LIGHT`, `SPLASH_THEME_COLOR` from `@/lib/splash-colors` (Task 1).
- Produces: `export default function SplashScreen(): React.JSX.Element` — takes no props. Used by Task 3.

- [ ] **Step 1: Create the component**

Create `app/splash-screen.tsx`. This is a Server Component — do **not** add `'use client'`; it ships no JS.

```tsx
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
```

Three details that are deliberate, not incidental:

- `alt=""` together with `aria-hidden="true"` — the splash carries no information a screen-reader user needs, and Next's route announcer already handles navigation.
- A plain `<img>`, not `next/image`. `next.config.ts` sets `images.unoptimized: true`, so `next/image` emits a plain `<img>` anyway; explicit `width`/`height` prevent layout shift.
- The source asset is 192×192 but renders at 96×96. That 2× is intentional — it keeps the logo crisp on the retina displays every target phone has. Do not "fix" this by swapping in a smaller asset or rendering at 192px.
- `animation: ... both` so the logo holds the `from` state before the animation starts, rather than flashing at full opacity on frame one.

- [ ] **Step 2: Type-check and lint**

```bash
yarn tsc --noEmit && yarn lint
```

Expected: both exit 0. The PostToolUse hook may have reordered the JSX props alphabetically — that is the linter's `react/jsx-sort-props` rule and is expected.

- [ ] **Step 3: Render the component in isolation to verify it visually**

The component cannot be seen yet (nothing renders it), so mount it temporarily. Create `app/splash-preview/page.tsx`:

```tsx
import SplashScreen from '../splash-screen'

export default function SplashPreviewPage() {
  return <SplashScreen />
}
```

Run `yarn dev` and open `http://localhost:3000/splash-preview`.

- [ ] **Step 4: Verify all four visual states**

In Chrome DevTools, use the **Rendering** panel (⋮ → More tools → Rendering):

1. **Browser, light** — default state. Expected: plain `#FFF8F6` background, **no logo, no text**.
2. **Browser, dark** — set "Emulate CSS media feature prefers-color-scheme" to `dark`. Expected: plain `#1a110e` background, still no logo.
3. **Standalone, light** — set prefers-color-scheme back to `light`, then set "Emulate CSS media feature display-mode" to `standalone`. Expected: logo **and** the text "Infinity Nikki Tracker" in terracotta, centred, fading in on reload.
4. **Standalone, dark** — both emulators on. Expected: logo on the dark background with the name in light `#f1dfd9`, clearly legible.

Also set "Emulate CSS media feature prefers-reduced-motion" to `reduce` and reload in standalone mode: the logo must appear immediately with no movement.

If state 1 or 2 shows the logo, the `display: none` default is being overridden — check that `.splash-brand` has `display: none` outside the media query.

- [ ] **Step 5: Delete the preview route**

It was scaffolding, and leaving it ships a stray public route.

```bash
rm -rf app/splash-preview
```

Confirm it is gone: `ls app/splash-preview` should report "No such file or directory".

- [ ] **Step 6: Commit**

```bash
git add app/splash-screen.tsx
git commit -m "feat(splash): add CSS-only splash screen component

Plain HTML + inline <style>, no MUI — it renders outside the
ThemeProvider it will serve as a fallback for. Logo and app name are
gated behind @media (display-mode: standalone) so only the installed
PWA shows them; the browser gets the themed background alone.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 3: Wire the splash into the root Suspense boundary

The one-line change that actually fixes the bug, plus end-to-end verification.

**Files:**

- Modify: `app/layout.tsx:117-119`

**Interfaces:**

- Consumes: `SplashScreen` (default export) from `./splash-screen` (Task 2).
- Produces: nothing consumed by later tasks. This is the final task.

- [ ] **Step 1: Reproduce the blank screen first**

Before changing anything, confirm the bug exists so you can tell the fix worked. In `app/layout.tsx`, temporarily add a delay at the top of the `ThemedApp` function body, immediately after `await connection()`:

> **This edit must not ship.** It adds a 3-second delay to every server render of every page. Step 4 removes it and greps to confirm. If you are interrupted mid-task, remove this line before doing anything else.

```ts
await new Promise((r) => setTimeout(r, 3000))
```

Run `yarn dev`, hard-reload `http://localhost:3000`.

Expected: roughly 3 seconds of **blank page**, then the home page appears. That blank is the bug.

- [ ] **Step 2: Add the fallback**

Add the import to `app/layout.tsx`:

```ts
import SplashScreen from './splash-screen'
```

Then change the boundary from:

```tsx
<Suspense>
  <ThemedApp>{children}</ThemedApp>
</Suspense>
```

to:

```tsx
<Suspense fallback={<SplashScreen />}>
  <ThemedApp>{children}</ThemedApp>
</Suspense>
```

Leave the artificial delay from Step 1 in place for now.

- [ ] **Step 3: Verify the fix with the delay still applied**

Hard-reload `http://localhost:3000`.

Expected: the themed `#FFF8F6` background paints **immediately** and holds for ~3 seconds, then the home page replaces it. No blank frame at any point.

Then enable `display-mode: standalone` emulation in the Rendering panel and reload. Expected: same, but with the logo and name fading in over the background.

- [ ] **Step 4: Remove the artificial delay**

Delete the `await new Promise((r) => setTimeout(r, 3000))` line added in Step 1.

Verify it is gone — this must not ship:

```bash
grep -n "setTimeout" app/layout.tsx
```

Expected: no output.

- [ ] **Step 5: Full verification**

```bash
yarn tsc --noEmit && yarn lint && yarn build
```

Expected: all three succeed. The build must complete without a prerender error — if it fails mentioning `connection()` or dynamic rendering, the fallback has accidentally been made async or dynamic, which it must not be.

Then `yarn start` and load `http://localhost:3000` with network throttling set to "Slow 4G" in the Network panel, to see the splash under realistic conditions.

- [ ] **Step 6: Commit**

```bash
git add app/layout.tsx
git commit -m "fix(splash): show splash screen instead of a blank cold load

The root Suspense boundary had no fallback, so nothing painted while
ThemedApp awaited connection() and the Supabase preferences round-trip.
On an installed PWA this showed as a blank frame between the OS splash
and the home page.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

- [ ] **Step 7: Verify on a real device**

Deploy the branch (a Vercel preview is created automatically on push) and open the preview URL on the phone that has the app installed.

Note: an installed PWA is pinned to the origin it was installed from, so a preview deployment opens in a normal Safari tab and will show the **browser** variant, not the standalone one. To verify the standalone path end-to-end, add the preview URL to the home screen as its own app and launch that.

Expected: no blank frame between the OS splash and the app content.

---

## Out of scope

Stated here so it is not mistaken for an oversight:

- **Faster loading.** `await connection()` and the Supabase round-trip still gate the content. This plan changes only what is painted during that wait.
- **`apple-touch-startup-image` tags.** These control the iOS _native_ launch image, which is a separate flash occurring _before_ the web view takes over. If a white flash remains at launch after this work, that is the cause and it needs its own change.
