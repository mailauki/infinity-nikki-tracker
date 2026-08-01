# PWA Splash Screen Design

Date: 2026-08-01

## Problem

On a cold launch of the installed PWA (and on a first browser load), the app paints
a blank screen before the home page appears.

The cause is in `app/layout.tsx`. `ThemedApp` is an async Server Component that calls
`await connection()` — opting itself out of prerendering entirely — then awaits
`getUserID()` and `getPreferences()` against Supabase, plus `cookies()` for the drawer
state. It is wrapped in a `<Suspense>` with **no fallback**:

```tsx
<Suspense>
  <ThemedApp>{children}</ThemedApp>
</Suspense>
```

With no fallback, React renders nothing for that subtree until the Supabase round-trip
resolves. Because `ThemedApp` wraps the entire app — theme, nav shell, and page content —
that empty fallback is the blank screen.

There is also no `app/loading.tsx` at the root, so nothing else fills the gap.

On iOS the sequence is: native splash (manifest `background_color` + icon) → hand off to
the web view → **blank** → home page. This design removes the blank step.

## Non-goals

This does not make the app load faster. `await connection()` and the Supabase round-trip
still gate the real content. This is a perceived-performance fix only.

Making the theme resolve without blocking paint (e.g. moving the colour-theme read out of
the render path, or seeding it from a cookie the way the drawer state already is) is a
larger change and is deliberately out of scope.

Adding `apple-touch-startup-image` link tags — which is what controls the iOS _native_
launch image, separate from the manifest — is also out of scope. This design addresses the
gap _after_ the OS splash hands off.

## Design

### 1. `lib/splash-colors.ts` (new)

Three colour values are currently hand-copied across three files:

- `app/layout.tsx:61-62` — `viewport.themeColor` light `#FFF8F6` / dark `#1a110e`
- `app/manifest.ts:15-16` — `background_color: '#FFF8F6'`, `theme_color: '#8F4C33'`
- `lib/theme-presets.ts` — the same values as part of the Terracotta preset

The splash needs a fourth copy. Instead, extract a single module:

```ts
export const SPLASH_BACKGROUND_LIGHT = '#FFF8F6'
export const SPLASH_BACKGROUND_DARK = '#1a110e'
export const SPLASH_THEME_COLOR = '#8F4C33'
```

Consumed by `app/manifest.ts`, the `viewport` export in `app/layout.tsx`, and the splash
component.

These stay as literals rather than being derived from `theme-presets.ts`. The OS reads the
manifest before any app JS runs, so there is exactly one static value available regardless
of which of the four themes the user picked — the existing comment at the top of
`manifest.ts` already documents this constraint. Deriving them would imply a per-user value
that cannot exist at this layer.

### 2. `app/splash-screen.tsx` (new)

Colocated at the route root, per the project's colocation rule: the root layout is its only
consumer.

**It must not use MUI.** The splash renders as the fallback for the very Suspense boundary
that _contains_ `ThemeClientProvider`, so no MUI `ThemeProvider` exists in context at that
point. No `sx` prop, no MUI components, no `useColorScheme()`. Plain HTML plus a `<style>`
block with raw hex values.

This is a constraint, but also the right outcome: zero JS, no hydration wait, paints on the
first frame.

Structure:

- A fixed full-viewport `div` (`position: fixed; inset: 0`), background
  `SPLASH_BACKGROUND_LIGHT`, centring its contents with flexbox. It needs a `z-index`
  high enough to cover the page area while it is mounted; React unmounts it the moment
  the boundary resolves, so it does not need to out-stack the nav or any modal.
- Dark mode via `@media (prefers-color-scheme: dark)` in the `<style>` block, switching to
  `SPLASH_BACKGROUND_DARK`. This matches the existing `viewport.themeColor` entries, so the
  browser chrome and the splash agree.
- Inside, a logo + app-name wrapper that is `display: none` by default and becomes
  `display: flex` under `@media (display-mode: standalone)`. Pure CSS, resolved by the
  browser on the first frame — no JS detection, so there is no flash of the wrong variant.
- The app name is the string `Infinity Nikki Tracker` (matching the manifest `name`, not
  the `short_name`), set below the logo in the inherited font stack at a modest size and
  weight, coloured `SPLASH_THEME_COLOR` in light mode. In dark mode it uses a light neutral
  rather than the theme colour, which does not carry enough contrast against `#1a110e`.
- Logo: `/icons/pwa/icon-192.png` as a plain `<img>` with explicit `width`/`height`.
  Deliberately not `next/image` — `images.unoptimized: true` in `next.config.ts` means
  `next/image` emits a plain `<img>` anyway, and explicit dimensions avoid CLS.
- Fade: a single `@keyframes` on the logo wrapper (~400ms ease-out, opacity plus a small
  translate). The **background paints on frame one**; only the logo and name fade in. This
  softens the handoff from the OS splash without delaying the colour.
- Under `@media (prefers-reduced-motion: reduce)`, the animation is disabled and the logo
  renders at full opacity immediately. The fade is decorative, so removing it costs nothing;
  leaving it in place would violate the same WCAG motion guidance the project's
  `a11y-reviewer` subagent checks for.
- `aria-hidden="true"` on the container. It is a transient visual with no information a
  screen-reader user needs, and announcing it mid-navigation would be noise. Next's built-in
  route announcer already handles navigation announcements.

### 3. `app/layout.tsx` (modified)

Two changes:

- Import the colours from `lib/splash-colors.ts` for the `viewport` export instead of
  inline literals.
- Give the Suspense boundary its fallback:

```tsx
<Suspense fallback={<SplashScreen />}>
  <ThemedApp>{children}</ThemedApp>
</Suspense>
```

### 4. `app/manifest.ts` (modified)

Import `SPLASH_BACKGROUND_LIGHT` and `SPLASH_THEME_COLOR` instead of inline literals.
Keep the existing explanatory comment.

## Resulting behaviour

| Context                       | Result                                                                              |
| ----------------------------- | ----------------------------------------------------------------------------------- |
| Installed PWA, cold launch    | Themed background instantly; logo + app name fade in; continuous from the OS splash |
| Browser, first load           | Themed background instantly; no logo — replaces the white flash                     |
| Dark mode, either context     | `#1a110e` background, matching the existing `themeColor` viewport entry             |
| Subsequent client navigations | Unaffected — this boundary only suspends on the initial server render               |

### Why no skeleton in the browser

A hand-rolled CSS skeleton of the nav + hero was considered and rejected. It cannot reuse
the existing `loading.tsx` skeletons, which are MUI `Skeleton` components and therefore
unavailable at this boundary. That would mean maintaining a second, unstyled copy of the
layout that drifts as the real layout changes, in exchange for a few hundred milliseconds
of perceived gain. A skeleton whose shape is wrong reads worse than a clean background.

## Testing

This repository has no test runner configured in `package.json`, so verification is manual:

1. `yarn tsc --noEmit` and `yarn lint` — both also run automatically via the PostToolUse hooks.
2. `yarn build && yarn start`.
3. In devtools, throttle the network to hold the fallback open long enough to observe it.
4. Confirm the light and dark backgrounds via the devtools colour-scheme emulator.
5. Confirm the standalone variant by emulating `display-mode: standalone` in devtools
   (Rendering panel → "Emulate CSS media feature display-mode"), verifying the logo appears
   there and is absent in normal browser mode.
6. Verify on a real installed iOS PWA that the handoff from the native splash no longer
   shows a blank frame.
