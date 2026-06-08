import { Box, Card, LinearProgress, Stack, Typography } from '@mui/material'
import { Category } from '@mui/icons-material'
import { Evolution, OutfitSet } from '@/lib/types/outfit'
import { percent } from '@/hooks/count-obtained'
import { toTitle } from '@/lib/utils'
import LazyAvatar from '@/components/lazy-avatar'
import RarityStars from '@/components/rarity-stars'

export default function OutfitEvolutionSetCard({
  outfitSet,
  evolution,
  isLoggedIn,
}: {
  outfitSet: OutfitSet
  evolution: Evolution | null
  isLoggedIn: boolean
}) {
  const variants = outfitSet.outfit_variants.filter((v) =>
    evolution === null ? v.evolution === null : v.evolution === evolution?.slug
  )
  const representativeVariant = variants.find((v) => v.outfit_category === 'hair') ?? variants[0]
  const image = evolution?.image_url ?? representativeVariant?.image_url ?? outfitSet.image_url
  const label = evolution ? toTitle(evolution.title ?? evolution.slug) : 'Base'

  const obtained = variants.reduce((sum, v) => sum + (v.obtained ? 1 : 0), 0)
  const total = variants.length
  const percentage = percent(obtained, total)

  return (
    <Card
      data-active={percentage === 100 ? '' : undefined}
      sx={{
        minWidth: 'fit-content',
        '&[data-active]': { backgroundColor: 'surface.lowest' },
      }}
    >
      <Box sx={{ position: 'relative' }}>
        <Stack sx={{ pt: 1, alignItems: 'center' }}>
          <LazyAvatar
            alt={label}
            src={image ?? undefined}
            sx={{ bgcolor: 'transparent', color: 'text.disabled' }}
          >
            <Category fontSize="inherit" />
          </LazyAvatar>
        </Stack>
        <Stack
          direction="row"
          sx={{ py: 0.75, px: 1.25, my: 0, alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Typography variant="overline">{label}</Typography>
          {isLoggedIn && (
            <Typography color="textSecondary" variant="caption">
              {`${percentage}%`}
            </Typography>
          )}
        </Stack>
        {isLoggedIn && (
          <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
            <LinearProgress color="inherit" value={percentage} variant="determinate" />
          </Box>
        )}
        <Box sx={{ position: 'absolute', top: 8, left: 8 }}>
          {outfitSet.rarity && (
            <Typography color="textSecondary" variant="overline">
              <RarityStars rarity={outfitSet.rarity} />
            </Typography>
          )}
        </Box>
      </Box>
    </Card>
  )
}
