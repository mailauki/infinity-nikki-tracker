'use client'

import Link from 'next/link'
import { Card, CardActionArea, CardHeader } from '@mui/material'

import LazyImage from '@/components/lazy-image'

export interface LinkedSetCardProps {
  /** Destination route for the linked set. */
  href: string
  /** Card label — either the sibling's own title or its domain name. */
  title: string
  /** Thumbnail src; the no-src path renders LazyImage's fallback. */
  image?: string | null
  /**
   * Set when the row holds more than one card, so they sit side by side.
   * A lone card fills the row.
   */
  half?: boolean
}

// A mini card linking a set to a sibling in another domain (outfit ↔ makeup ↔
// Momo's Cloak). Each domain's detail card resolves its own links from the
// `outfit_set` FKs and renders these; this component owns only the shared
// avatar + title + link shape so the three stay visually identical.
export default function LinkedSetCard({ href, title, image, half = false }: LinkedSetCardProps) {
  return (
    <Card sx={half ? { width: '48%' } : { width: 'fit-content' }}>
      <CardActionArea component={Link} href={href}>
        <CardHeader
          avatar={<LazyImage kind="avatar" src={image} />}
          slotProps={{ title: { noWrap: true } }}
          sx={{ py: 1, px: 1.5, '& .MuiCardHeader-content': { width: 'calc(100% - 56px)' } }}
          title={title}
        />
      </CardActionArea>
    </Card>
  )
}
