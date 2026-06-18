'use client'
import LazyImage from '@/components/lazy-image'
import ProgressChip from '@/components/progress-chip'
import RarityStars from '@/components/rarity-stars'
import { OutfitSet } from '@/lib/types/outfit'
import { CardActionArea, CardHeader, ListItem, Typography } from '@mui/material'
import Link from 'next/link'

export default function OutfitSetListItem({
  set,
  isLoggedIn,
}: {
  set: OutfitSet
  isLoggedIn: boolean
}) {
  // Progress is measured against the base set — its "default" variants, each of
  // which carries an `obtained` flag once the user's collection is applied.
  const baseVariants = set.outfit_variants.filter((variant) => variant.default)
  const total = baseVariants.length
  const obtained = baseVariants.reduce((sum, variant) => sum + (variant.obtained ? 1 : 0), 0)

  return (
    <ListItem disablePadding sx={{ borderRadius: 3 }}>
      <CardActionArea component={Link} href={`/outfits/${set.slug}`}>
        <CardHeader
          disableTypography
          action={isLoggedIn && <ProgressChip obtained={obtained} total={total} variant="parts" />}
          avatar={
            <LazyImage
              alt={set.title}
              kind="square"
              maxWidth={56}
              src={set.alt_image_url || set.image_url || ''}
            />
          }
          subheader={<RarityStars rarity={set.rarity} />}
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
            <Typography component="span" variant="subtitle1">
              {set.title}
            </Typography>
          }
        />
      </CardActionArea>
    </ListItem>
  )
}
