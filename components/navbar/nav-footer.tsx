'use client'
import {
  Box,
  Card,
  CardContent,
  Divider,
  Link as Anchor,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material'
import NextLink from 'next/link'
import { useEffect, useState } from 'react'
import CoffeeButton from './coffee-button'
import ThemeSwitcher from './theme-switcher'
import ReportIssueLink from '@/components/feedback/report-issue-link'
import { navLabel } from '@/lib/page-titles'
import { createClient } from '@/lib/supabase/client'
import type { PageRoute } from '@/lib/page-titles'

// Column definitions. Routes are listed as page paths and labelled through
// navLabel() rather than hardcoded strings, so a rename in PAGE_NAMES reaches
// the footer for free — the same contract the nav drawer honours.
const COLLECTION_ROUTES: PageRoute[] = ['/outfits', '/eureka', '/makeup', '/momo-cloaks', '/looks']

// Account links point at auth-gated pages, so the whole column is withheld
// from signed-out visitors rather than sending them into a redirect.
const ACCOUNT_ROUTES: PageRoute[] = ['/profile', '/settings']

const SUPPORT_ROUTES: PageRoute[] = ['/about', '/help']

const LEGAL_ROUTES: PageRoute[] = ['/privacy-policy', '/terms-of-service']

function FooterColumn({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <Stack component="nav" sx={{ gap: 1.25 }}>
      <Typography
        color="primary"
        component="h2"
        size="small"
        sx={{ textTransform: 'uppercase', fontWeight: 'bold' }}
        variant="label"
      >
        {heading}
      </Typography>
      <Stack sx={{ gap: 1, alignItems: 'flex-start' }}>{children}</Stack>
    </Stack>
  )
}

function FooterLink({ route }: { route: PageRoute }) {
  return (
    <Anchor
      color="textSecondary"
      component={NextLink}
      href={route}
      size="medium"
      sx={{ '&:hover': { color: 'text.primary' } }}
      underline="hover"
      variant="body"
    >
      {navLabel(route)}
    </Anchor>
  )
}

export default function Footer() {
  // Mirrors NavUser's client-side auth read rather than threading a new prop
  // through LayoutShell (which takes only `children`). undefined = not yet
  // resolved, null = signed out; the Account column stays hidden until we know,
  // so it never flashes in for a signed-out visitor.
  const [userId, setUserId] = useState<string | null | undefined>(undefined)

  useEffect(() => {
    let mounted = true
    const supabase = createClient()

    supabase.auth.getUser().then(({ data }) => {
      if (mounted) setUserId(data.user?.id ?? null)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setUserId(session?.user?.id ?? null)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const isLoggedIn = Boolean(userId)

  return (
    <>
      <Stack sx={{ mt: 6, mb: 2, alignItems: 'center', justifyContent: 'center' }}>
        <ReportIssueLink />
      </Stack>

      <Card component="footer" surface="dim" sx={{ mb: 2 }}>
        <CardContent>
          {/* Columns */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr 1fr', md: '1.4fr 1fr 1fr 1fr' },
              gap: { xs: 3, md: 4 },
              px: { xs: 2, md: 4 },
              py: { xs: 3, md: 4 },
            }}
          >
            {/* Identity — spans both columns on mobile so the blurb isn't squeezed */}
            <Stack sx={{ gap: 0.25, gridColumn: { xs: '1 / -1', md: 'auto' } }}>
              <Typography component="h2" size="large" variant="title">
                Infinity Nikki Tracker
              </Typography>
              <Typography
                color="textSecondary"
                size="large"
                sx={{ maxWidth: '30ch', textWrap: 'pretty' }}
                variant="body"
              >
                Track your outfits, Eureka sets and custom looks in one place.
              </Typography>
            </Stack>

            <FooterColumn heading="Collection">
              {COLLECTION_ROUTES.map((route) => (
                <FooterLink key={route} route={route} />
              ))}
            </FooterColumn>

            {isLoggedIn && (
              <FooterColumn heading="Account">
                {ACCOUNT_ROUTES.map((route) => (
                  <FooterLink key={route} route={route} />
                ))}
              </FooterColumn>
            )}

            <FooterColumn heading="Support">
              {SUPPORT_ROUTES.map((route) => (
                <FooterLink key={route} route={route} />
              ))}
            </FooterColumn>
          </Box>
        </CardContent>

        <Stack>
          <Divider variant="middle" />

          <Toolbar sx={{ flexGrow: 1 }}>
            <Typography color="textSecondary" size="small" sx={{ flexGrow: 1 }} variant="body">
              &copy; 2026 mailauki
            </Typography>

            <Stack direction="row" sx={{ gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Legal links live only in the footer — the standard place users look
									for them, and keeping them out of the nav drawer avoids crowding
									the collection routes people actually navigate between. */}
              <Stack component="nav" direction="row" sx={{ gap: 2, alignItems: 'center' }}>
                {LEGAL_ROUTES.map((route) => (
                  <Anchor
                    key={route}
                    color="textSecondary"
                    component={NextLink}
                    href={route}
                    size="small"
                    sx={{ '&:hover': { color: 'text.primary' } }}
                    underline="hover"
                    variant="body"
                  >
                    {navLabel(route)}
                  </Anchor>
                ))}
              </Stack>

              <Divider flexItem orientation="vertical" sx={{ height: 20, alignSelf: 'center' }} />

              <Stack direction="row" sx={{ gap: 0.5, alignItems: 'center' }}>
                <CoffeeButton />
                <ThemeSwitcher />
              </Stack>
            </Stack>
          </Toolbar>
        </Stack>
      </Card>
    </>
  )
}
