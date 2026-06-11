# Homepage Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the homepage into a landing page that welcomes new users with auth-aware CTAs and gives returning users quick access to Outfits and Eureka Sets.

**Architecture:** `app/hero.tsx` becomes auth-aware by calling `getUserID()` server-side and rendering two CTA variants. A new `components/quick-access.tsx` server component renders two feature cards below the hero. `app/page.tsx` composes them in a `Stack`.

**Tech Stack:** Next.js 15 App Router, MUI v7, Supabase (server client), TypeScript

---

## File Map

| File                          | Action | Responsibility                                                  |
| ----------------------------- | ------ | --------------------------------------------------------------- |
| `app/hero.tsx`                | Modify | Add auth-aware eyebrow + CTAs to gradient overlay               |
| `components/quick-access.tsx` | Create | Two-column card grid linking to Outfits and Eureka Sets         |
| `app/page.tsx`                | Modify | Compose Hero + QuickAccess in a Stack, remove Container wrapper |

---

## Task 1: Update `app/hero.tsx` with auth-aware CTAs

**Files:**

- Modify: `app/hero.tsx`

- [ ] **Step 1: Replace the hero overlay content with auth-aware CTAs**

Replace the entire contents of `app/hero.tsx` with:

```tsx
import { Box, Button, Container, Stack, Typography } from '@mui/material'
import Image from 'next/image'
import Link from 'next/link'

import { getUserID } from '@/hooks/user'

export async function Hero() {
  const user_id = await getUserID()
  const isLoggedIn = !!user_id

  return (
    <Box
      sx={{
        position: 'relative',
        height: {
          xs: `calc(100vh - ${56 * 3 + 6}px)`,
          sm: `calc(100vh - ${64 * 3 + 6}px)`,
        },
      }}
    >
      <Image
        fill
        alt="Infinity Nikki Hero Image"
        className="object-cover object-[70%_center]"
        sizes="100vw"
        src="/hero.jpg"
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          pt: 20,
          pb: 10,
          width: '100%',
          background:
            'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 70%, rgba(0,0,0,0) 100%)',
        }}
      >
        <Stack
          sx={{
            flex: 1,
            color: 'white',
            textAlign: 'center',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 1,
          }}
        >
          {!isLoggedIn && (
            <Typography
              variant="overline"
              sx={{ color: 'rgba(255,255,255,0.7)', letterSpacing: 3 }}
            >
              Welcome to
            </Typography>
          )}
          <Typography noWrap component="h1" variant="h3">
            Infinity Nikki Tracker
          </Typography>
          <Container fixed maxWidth="xs">
            <Typography variant="subtitle1" sx={{ fontSize: 20 }}>
              {isLoggedIn
                ? 'Welcome back — pick up where you left off'
                : 'Track your Eureka outfit collection from your favorite cozy open-world game'}
            </Typography>
          </Container>
          <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
            {isLoggedIn ? (
              <>
                <Button
                  component={Link}
                  href="/profile"
                  variant="contained"
                  sx={{
                    borderRadius: 6,
                    px: 3,
                    bgcolor: 'white',
                    color: 'black',
                    '&:hover': { bgcolor: 'grey.100' },
                  }}
                >
                  My Collection
                </Button>
                <Button
                  component={Link}
                  href="/eureka/missing"
                  variant="outlined"
                  sx={{
                    borderRadius: 6,
                    px: 3,
                    borderColor: 'rgba(255,255,255,0.7)',
                    color: 'white',
                    '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.08)' },
                  }}
                >
                  Missing Items
                </Button>
              </>
            ) : (
              <>
                <Button
                  component={Link}
                  href="/auth/sign-up"
                  variant="contained"
                  sx={{
                    borderRadius: 6,
                    px: 3,
                    bgcolor: 'white',
                    color: 'black',
                    '&:hover': { bgcolor: 'grey.100' },
                  }}
                >
                  Sign Up Free
                </Button>
                <Button
                  component={Link}
                  href="/eureka"
                  variant="outlined"
                  sx={{
                    borderRadius: 6,
                    px: 3,
                    borderColor: 'rgba(255,255,255,0.7)',
                    color: 'white',
                    '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.08)' },
                  }}
                >
                  Browse Sets
                </Button>
              </>
            )}
          </Stack>
        </Stack>
      </Box>
    </Box>
  )
}
```

- [ ] **Step 2: Verify the app compiles**

```bash
yarn tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Start dev server and verify hero renders correctly**

```bash
yarn dev
```

Open `http://localhost:3000`.

- Logged out: hero should show "Welcome to" eyebrow, "Sign Up Free" + "Browse Sets" buttons
- Log in via `/auth/login`, return to `/`: hero should show "Welcome back" subtitle, "My Collection" + "Missing Items" buttons

- [ ] **Step 4: Commit**

```bash
git add app/hero.tsx
git commit -m "feat: add auth-aware CTAs to hero section"
```

---

## Task 2: Create `components/quick-access.tsx`

**Files:**

- Create: `components/quick-access.tsx`

- [ ] **Step 1: Create the QuickAccess server component**

Create `components/quick-access.tsx`:

```tsx
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Container,
  Typography,
} from '@mui/material'
import Link from 'next/link'

const cards = [
  {
    title: 'Outfits',
    subtitle: 'Browse all outfit sets in the game',
    href: '/outfits',
    image: null,
  },
  {
    title: 'Eureka Sets',
    subtitle: 'Track your collection progress',
    href: '/eureka',
    image: '/screenshots/screenshot-eureka-set-dark.png',
  },
]

export function QuickAccess() {
  return (
    <Container sx={{ py: 3 }}>
      <Typography
        variant="overline"
        sx={{ display: 'block', textAlign: 'center', mb: 2, letterSpacing: 2 }}
      >
        Quick Access
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          gap: 2,
        }}
      >
        {cards.map(({ title, subtitle, href, image }) => (
          <Card key={href}>
            <CardActionArea component={Link} href={href} sx={{ height: '100%' }}>
              {image ? (
                <CardMedia
                  component="img"
                  height={160}
                  image={image}
                  alt={title}
                  sx={{ objectPosition: 'top' }}
                />
              ) : (
                <Box
                  sx={{
                    height: 160,
                    background: (theme) =>
                      `linear-gradient(135deg, ${theme.palette.primary.dark ?? theme.palette.primary.main}, ${theme.palette.secondary.dark ?? theme.palette.secondary.main})`,
                  }}
                />
              )}
              <CardContent>
                <Typography variant="h6" component="h2" gutterBottom>
                  {title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {subtitle}
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </Box>
    </Container>
  )
}
```

- [ ] **Step 2: Verify the component compiles**

```bash
yarn tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add components/quick-access.tsx
git commit -m "feat: add QuickAccess component with Outfits and Eureka Sets cards"
```

---

## Task 3: Update `app/page.tsx` to compose Hero + QuickAccess

**Files:**

- Modify: `app/page.tsx`

- [ ] **Step 1: Replace the page content**

Replace the entire contents of `app/page.tsx` with:

```tsx
import { Stack } from '@mui/material'

import { QuickAccess } from '@/components/quick-access'
import { Hero } from './hero'

export default function HomePage() {
  return (
    <Stack>
      <Hero />
      <QuickAccess />
    </Stack>
  )
}
```

- [ ] **Step 2: Verify the app compiles**

```bash
yarn tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Verify the full page in the browser**

With `yarn dev` running, open `http://localhost:3000`.

Check:

- [ ] Hero fills the viewport with background image and gradient
- [ ] CTAs appear at the bottom of the hero (correct variant for auth state)
- [ ] Quick Access section appears below the hero with "Quick Access" label
- [ ] Two cards visible: "Outfits" (gradient placeholder) and "Eureka Sets" (screenshot image)
- [ ] Clicking "Outfits" card navigates to `/outfits`
- [ ] Clicking "Eureka Sets" card navigates to `/eureka`
- [ ] On mobile (resize browser to < 600px): cards stack vertically
- [ ] Dark mode (toggle theme): cards render correctly, gradient placeholder adapts to theme colors

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx
git commit -m "feat: redesign homepage as landing page with hero CTAs and quick access cards"
```
