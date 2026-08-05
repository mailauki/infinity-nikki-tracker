'use client'
import LazyImage from '@/components/lazy-image'
import ProgressChip from '@/components/progress-chip'
import RarityStars from '@/components/rarity-stars'
import { OutfitVariant } from '@/lib/types/outfit'
import { CardActionArea, CardHeader, ListItem, Stack, Typography } from '@mui/material'
import Link from 'next/link'
import { toTitle } from '@/lib/utils'

// A standalone piece is a single variant rather than a set, so it counts as one
// item (obtained or not) and links to the standalone container page, where the
// existing category / season filters can narrow to it.
export default function StandalonePieceItem({
  variant,
  isLoggedIn,
}: {
  variant: OutfitVariant
  isLoggedIn: boolean
}) {
  const title = variant.title ?? toTitle(variant.slug)
  const image = variant.alt_image_url || variant.image_url

  return (
    <ListItem disablePadding sx={{ borderRadius: 3 }}>
      <CardActionArea component={Link} href="/outfits/standalone_pieces">
        <CardHeader
          disableTypography
          action={
            isLoggedIn && (
              <ProgressChip obtained={variant.obtained ? 1 : 0} total={1} variant="parts" />
            )
          }
          avatar={
            <LazyImage
              image={image || ''}
              kind="media"
              sx={{ width: 56, aspectRatio: '1 / 1' }}
              title={title}
            />
          }
          subheader={variant.rarity ? <RarityStars rarity={variant.rarity} /> : null}
          sx={{
            '& .MuiCardHeader-content': {
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              alignItems: 'flex-start',
              justifyContent: 'flex-start',
            },
            '& .MuiCardHeader-action': {
              px: 1,
            },
          }}
          title={
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Typography component="span" variant="subtitle1">
                {title}
              </Typography>
            </Stack>
          }
        />
      </CardActionArea>
    </ListItem>
  )
}
