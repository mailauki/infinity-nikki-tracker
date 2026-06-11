# Homepage Landing Page Redesign

**Date:** 2026-06-03
**Status:** Approved

## Context

The current homepage is a single full-bleed hero image with a title and subtitle — no calls to action, no navigation shortcuts. The redesign turns it into a proper landing page that:

1. **Welcomes new users** with a clear value proposition and sign-up CTA
2. **Gives returning users quick access** to the two primary sections: Outfits and Eureka Sets

## Design

### Hero Section (full-bleed, auth-aware)

The existing `app/hero.tsx` full-bleed background image with gradient overlay is kept. The overlay content is replaced with auth-aware copy and CTA buttons.

**Logged-out state:**

- Eyebrow: "Welcome to" (small, uppercase, muted)
- Title: "Infinity Nikki Tracker" (h3)
- Subtitle: "Track your Eureka outfit collection from your favorite cozy open-world game"
- Primary CTA: **Sign Up Free** → `/auth/sign-up`
- Secondary CTA: **Browse Sets** → `/eureka`

**Logged-in state:**

- Title: "Infinity Nikki Tracker" (h3, no eyebrow)
- Subtitle: "Welcome back — pick up where you left off"
- Primary CTA: **My Collection** → `/profile`
- Secondary CTA: **Missing Items** → `/eureka/missing`

Both buttons use MUI `Button` with `variant="contained"` (primary, rounded) and `variant="outlined"` (secondary, white border on dark bg).

### Quick Access Section

A two-column card grid below the hero, always visible regardless of auth state. Implemented as a new `QuickAccess` server component rendered in `app/page.tsx`.

**Outfits card:**

- Image: placeholder gradient (no screenshot exists yet — swap in later)
- Title: "Outfits"
- Subtitle: "Browse all outfit sets in the game"
- Links to: `/outfits`

**Eureka Sets card:**

- Image: `public/screenshots/screenshot-eureka-set-dark.png` / `screenshot-eureka-set-light.png` (theme-aware via `useColorScheme` or static dark version)
- Title: "Eureka Sets"
- Subtitle: "Track your collection progress"
- Links to: `/eureka`

Cards use MUI `Card` with `borderRadius: 12` (already set in global theme), a fixed-height image area (`CardMedia`), and `CardContent` with title + subtitle. The whole card is wrapped in a Next.js `Link` for navigation.

### Layout

`app/page.tsx` changes from a single `<Hero />` in a `Container` to a `Stack` with:

1. `<Hero />` — full-bleed, no container wrapper
2. `<QuickAccess />` — new server component, padded `Container`

The `Container disableGutters` wrapper is removed since the hero needs to be truly full-bleed and the quick access section manages its own padding.

## Files to Create / Modify

| File                          | Change                                                                              |
| ----------------------------- | ----------------------------------------------------------------------------------- |
| `app/page.tsx`                | Replace single Hero wrapper with Stack of Hero + QuickAccess                        |
| `app/hero.tsx`                | Add auth-aware CTAs to the gradient overlay; fetch `getUserID()` to determine state |
| `components/quick-access.tsx` | New server component — two-column MUI Card grid                                     |

## Auth Pattern

`app/hero.tsx` becomes a server component (it already has no client-side interactivity). It calls `getUserID()` from `hooks/user.ts` to get `user_id` (null if logged out) and conditionally renders the two CTA variants. No new hooks needed.

## Image Handling

The Eureka Sets card image uses a standard `<img>` or MUI `CardMedia` pointing to `/screenshots/screenshot-eureka-set-dark.png`. Since both light and dark screenshots exist, the card can use the dark version as a static default (the screenshot is dark-themed and readable on the dark card background). If theme-awareness is desired later, a client component wrapper using `useColorScheme` can swap the src — out of scope for this iteration.

The Outfits card uses a CSS gradient placeholder (`background: linear-gradient(...)`) styled to match the app's warm brown palette. When an outfits screenshot is available, swap `CardMedia` src in.

## Verification

1. Run `yarn dev` and open `http://localhost:3000`
2. **Logged out:** hero shows "Welcome to" eyebrow, "Sign Up Free" + "Browse Sets" buttons; quick access cards visible below
3. **Logged in:** hero shows "Welcome back" subtitle, "My Collection" + "Missing Items" buttons; same cards below
4. **CTA routes:** Sign Up → `/auth/sign-up`, Browse Sets → `/eureka`, My Collection → `/profile`, Missing Items → `/eureka/missing`
5. **Card links:** Outfits card → `/outfits`, Eureka Sets card → `/eureka`
6. **Responsive:** cards stack to single column on mobile (`xs`), two columns on `sm`+
7. **Dark mode:** cards render correctly in both light and dark themes
