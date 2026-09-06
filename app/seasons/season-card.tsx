import { Card, CardActions, CardContent, CardHeader, List, Typography } from '@mui/material'
import type { ReactNode } from 'react'

import LazyImage from '@/components/lazy-image'
import {
  resolveOutfitImage,
  type OutfitImageMode,
} from '@/components/outfits/outfit-image-mode-context'
import ProgressChip from '@/components/progress-chip'
import { ViewAllButton } from '@/components/view-all-button'
import type { Season } from '@/lib/types/outfit'

// A card's progress is the sum of the rows it lists, which are already counted
// in CARDS by countEntryCards — so the chip here reports the same denominator
// the season page's own chip does.
export default function SeasonCard({
  season,
  ordinal,
  mode,
  obtained,
  total,
  isLoggedIn,
  children,
}: {
  season: Season
  ordinal: number
  mode: OutfitImageMode
  obtained: number
  total: number
  // Signed-out visitors have no collection, so the chip would always read 0% —
  // the row counts drop their obtained half for the same reason.
  isLoggedIn: boolean
  children: ReactNode
}) {
  return (
    <Card sx={{ display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        disableTypography
        action={isLoggedIn ? <ProgressChip obtained={obtained} total={total} /> : undefined}
        avatar={
          <Typography component="span" size="small" variant="display">
            {String(ordinal).padStart(2, '0')}
          </Typography>
        }
        sx={{ '& .MuiCardHeader-content': { width: 'calc(100% - 6rem)' } }}
        title={
          <Typography noWrap component="h2" size="small" variant="headline">
            {season.title}
          </Typography>
        }
      />
      {season.image_url && (
        <LazyImage
          image={
            resolveOutfitImage(mode, {
              image: season.image_url,
              alt: season.alt_image_url,
            }) ?? undefined
          }
          kind="media"
          sx={{ height: 160, mx: 1.5 }}
          title={season.title}
        />
      )}
      <CardContent sx={{ flexGrow: 1 }}>
        <List dense sx={{ width: '100%' }}>
          {children}
        </List>
      </CardContent>
      <CardActions>
        <ViewAllButton href={`/seasons/${season.slug}`} />
      </CardActions>
    </Card>
  )
}
