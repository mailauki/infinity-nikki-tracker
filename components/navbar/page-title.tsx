'use client'

import { navLinksData } from '@/lib/nav-links'
import { toTitle } from '@/lib/utils'
import { Typography } from '@mui/material'
import { usePathname } from 'next/navigation'

export default function PageTitle() {
  const pathname = usePathname()
  const allLinks = [
    ...navLinksData.home,
    ...navLinksData.navMain.flatMap((item) => [item, ...(item.items ?? [])]),
    ...navLinksData.navSecondary.flatMap((item) => [
      item,
      ...(item.items ?? []).map((sub) => ({ ...sub, url: item.url + sub.url })),
    ]),
    ...navLinksData.navExtra,
    ...navLinksData.admin.tabs.flatMap((tab) =>
      (tab.items ?? []).map((item) => ({ ...item, title: `${tab.title} ${item.title}` }))
    ),
  ]
  const bestMatch = allLinks
    .filter(
      (link) => link.url !== '/' && (pathname === link.url || pathname.startsWith(link.url + '/'))
    )
    .sort((a, b) => b.url.length - a.url.length)[0]

  const segments = pathname.split('/')
  const lastSegment = segments.at(-1) ?? ''
  const hasParams = bestMatch && pathname !== bestMatch.url
  const baseTitle = hasParams ? toTitle(lastSegment) : (bestMatch?.title ?? '')

  let prefix: string | null = null
  if (pathname.includes('/new')) prefix = 'Add'
  else if (pathname.includes('/edit')) prefix = 'Edit'
  const pageTitle = prefix ? `${prefix} ${bestMatch?.title ?? baseTitle}` : baseTitle

  return (
    <Typography component="h1" sx={{ fontSize: 'subtitle2.fontSize' }} variant="overline">
      {pageTitle}
    </Typography>
  )
}
