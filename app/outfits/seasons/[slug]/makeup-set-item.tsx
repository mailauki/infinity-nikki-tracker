'use client'
import LazyImage from '@/components/lazy-image'
import ProgressChip from '@/components/progress-chip'
import RarityStars from '@/components/rarity-stars'
import ToggleIcon from '@/components/toggle-icon'
import { MakeupSet, MakeupVariant } from '@/lib/types/makeup'
import { Badge, Box, CardHeader, Chip, ListItem, Stack, Typography } from '@mui/material'

// A makeup row: either the base set (evolution === null) or one of its
// evolutions. Mirrors OutfitSetListItem, minus the link — the public makeup
// pages are still a Coming Soon stub, so there is nowhere to navigate yet.
export default function MakeupSetListItem({
  set,
  evolution,
  variants,
  isLoggedIn,
}: {
  set: MakeupSet
  evolution: MakeupSet | null
  variants: MakeupVariant[]
  isLoggedIn: boolean
}) {
  const total = variants.length
  const obtained = variants.reduce((sum, variant) => sum + (variant.obtained ? 1 : 0), 0)

  const row = evolution ?? set
  const title = row.title
  const image = row.alt_image_url || row.image_url

  return (
    <ListItem
      disablePadding
      secondaryAction={
        isLoggedIn && <ProgressChip obtained={obtained} total={total} variant="parts" />
      }
      sx={{ borderRadius: 3, px: 1 }}
    >
      <CardHeader
        disableTypography
        avatar={
          <Badge
            badgeContent={
              evolution && (
                <Box sx={{ display: 'flex' }}>
                  <ToggleIcon image="/icons/evolution.png" size="xs" title="evolution" />
                </Box>
              )
            }
          >
            <LazyImage
              image={image || ''}
              kind="media"
              sx={{ width: 56, aspectRatio: '1 / 1' }}
              title={title}
            />
          </Badge>
        }
        subheader={<RarityStars rarity={row.rarity} />}
        sx={{
          width: '100%',
          '& .MuiCardHeader-content': {
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            alignItems: 'flex-start',
            justifyContent: 'flex-start',
          },
        }}
        title={
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Typography component="span" variant="subtitle1">
              {title}
            </Typography>
            <Chip label="Makeup" size="small" variant="outlined" />
          </Stack>
        }
      />
    </ListItem>
  )
}
