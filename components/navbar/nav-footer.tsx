'use client'
import { AppBar, Link as Anchor, Stack, Toolbar, Typography } from '@mui/material'
import NextLink from 'next/link'
import CoffeeButton from './coffee-button'
import ThemeSwitcher from './theme-switcher'
import ReportIssueLink from '@/components/feedback/report-issue-link'
import { navLabel } from '@/lib/page-titles'

export default function Footer() {
  return (
    <AppBar
      color="inherit"
      component="footer"
      position="relative"
      sx={{
        border: 0,
        backgroundColor: 'transparent',
        py: 2,
        my: 3,
        flexGrow: 1,
        justifyContent: 'flex-end',
      }}
      variant="outlined"
    >
      <Toolbar>
        <Stack
          direction="row"
          spacing={3}
          sx={{
            flexGrow: 1,
            mx: 1,
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
            rowGap: 1,
          }}
        >
          {/* textSecondary, not textDisabled: this is real content, and MUI's
              disabled token (rgba(0,0,0,0.38)) is only 2.65:1 — below AA. */}
          <Typography color="textSecondary" size="small" variant="body">
            &copy; 2026 mailauki
          </Typography>
          <Stack direction="row" sx={{ gap: 0.5, alignItems: 'center' }}>
            <CoffeeButton />
            <ThemeSwitcher />
          </Stack>
          <ReportIssueLink />
          {/* Legal links live only in the footer — the standard place users look
              for them, and keeping them out of the nav drawer avoids crowding
              the collection routes people actually navigate between. */}
          <Stack component="nav" direction="row" sx={{ gap: 2, alignItems: 'center' }}>
            <Anchor
              color="textSecondary"
              component={NextLink}
              href="/privacy-policy"
              size="small"
              variant="body"
            >
              {navLabel('/privacy-policy')}
            </Anchor>
            <Anchor
              color="textSecondary"
              component={NextLink}
              href="/terms-of-service"
              size="small"
              variant="body"
            >
              {navLabel('/terms-of-service')}
            </Anchor>
          </Stack>
        </Stack>
      </Toolbar>
    </AppBar>
  )
}
