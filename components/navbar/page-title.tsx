'use client'

import { resolveNavLabel } from '@/lib/page-titles'
import { Typography } from '@mui/material'
import { usePathname } from 'next/navigation'

export default function PageTitle() {
  const pathname = usePathname()
  // Resolution lives in lib/page-titles.ts so the app bar, `metadata.title`,
  // and PageShell's h1 all read the same registry instead of each deriving a
  // name of its own.
  const pageTitle = resolveNavLabel(pathname)

  return (
    // Renders a <span>, not an <h1>: this is the app-bar's breadcrumb label —
    // nav chrome that repeats on every route — so it isn't the page's content
    // heading. Owning the h1 here meant the real heading lived outside the
    // <article>, which left reader mode promoting whatever <h2> came first
    // ("What is this?" on /about) as the title. Each page supplies its own h1
    // via PageShell's `title` prop.
    //
    // label/small styling at title/medium's size — the M3 scale no longer lives
    // on theme.typography, so the size is set literally rather than by token.
    <Typography component="span" size="small" sx={{ fontSize: '1rem' }} variant="label">
      {pageTitle}
    </Typography>
  )
}
