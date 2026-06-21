'use client'
import LazyImage from '@/components/lazy-image'
import ProgressChip from '@/components/progress-chip'
import RarityStars from '@/components/rarity-stars'
import ToggleIcon from '@/components/toggle-icon'
import { Evolution, OutfitSet, OutfitVariant } from '@/lib/types/outfit'
import { toTitle } from '@/lib/utils'
import { Box, CardActionArea, CardHeader, ListItem, Stack, Typography } from '@mui/material'
import Link from 'next/link'

// A single list row: either the base set (evolution === null) or one of its
// evolutions / glow-up. `variants` are the entry's own variants, used for the
// progress chip so each row shows its own completion.
export type OutfitSetListEntry = {
  key: string
  set: OutfitSet
  evolution: Evolution | null
  variants: OutfitVariant[]
  isGlowup?: boolean
}

export default function OutfitSetListItem({
  entry,
  isLoggedIn,
}: {
  entry: OutfitSetListEntry
  isLoggedIn: boolean
}) {
  const { set, evolution, variants, isGlowup } = entry

  const total = variants.length
  const obtained = variants.reduce((sum, variant) => sum + (variant.obtained ? 1 : 0), 0)

  const title = evolution
    ? `${set.title}: ${toTitle(evolution.subtitle ?? evolution.slug)}`
    : set.title
  // Evolution detail is reached via the set page with an ?evolution= param,
  // matching the outfits grid cards (slug `{set}-{evo}` → `{set}?evolution={evo}`).
  const href = evolution
    ? `/outfits/${evolution.slug.replace('-', '?evolution=')}`
    : `/outfits/${set.slug}`
  const image = evolution
    ? evolution.alt_image_url || evolution.image_url
    : set.alt_image_url || set.image_url

  return (
    <ListItem disablePadding sx={{ borderRadius: 3 }}>
      <CardActionArea component={Link} href={href}>
        <CardHeader
          disableTypography
          action={isLoggedIn && <ProgressChip obtained={obtained} total={total} variant="parts" />}
          avatar={<LazyImage alt={title} kind="square" maxWidth={56} src={image || ''} />}
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
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              {evolution && (
                <Box sx={{ display: 'flex' }}>
                  {isGlowup ? (
                    <ToggleIcon item={{ title: 'glowup', image: '/icons/glowup.png' }} size="xs" />
                  ) : (
                    <ToggleIcon
                      item={{ title: 'evolution', image: '/icons/evolution.png' }}
                      size="xs"
                    />
                  )}
                </Box>
              )}
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
