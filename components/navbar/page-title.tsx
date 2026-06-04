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
  ]
  const bestMatch = allLinks
    .filter(
      (link) => link.url !== '/' && (pathname === link.url || pathname.startsWith(link.url + '/'))
    )
    .sort((a, b) => b.url.length - a.url.length)[0]

  const hasParams = bestMatch && pathname !== bestMatch.url
  const pageTitle = hasParams ? toTitle(pathname.split('/').at(-1) ?? '') : (bestMatch?.title ?? '')

  return (
    <Typography component="h1" sx={{ fontSize: 'subtitle2.fontSize' }} variant="overline">
      {pageTitle}
    </Typography>
  )
}
