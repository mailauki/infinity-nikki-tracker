import { CardContent, Stack, Typography } from '@mui/material'

import RarityStars from '../rarity-stars'
import { CardSize } from '@/lib/types/props'

export default function EurekaCardContent({
  title,
  subheader,
  rarity,
  size = 'sm',
  trial,
  style,
}: {
  title: string
  subheader?: string | null
  rarity?: number | null
  size?: CardSize
  trial?: string | null
  style?: string | null
}) {
  return (
    <CardContent sx={{ pt: 0 }}>
      {size === 'lg' ? (
        <Stack spacing={0.5}>
          <Stack alignItems="center" direction="row" justifyContent="space-between">
            <Typography component="p" variant="h5">
              {title}
            </Typography>
            <Typography color="textSecondary" variant="caption">
              <RarityStars rarity={rarity!} />
            </Typography>
          </Stack>
          <Stack alignItems="center" direction="row" justifyContent="space-between">
            <Typography variant="overline">{trial}</Typography>
            <Typography variant="body2">{style}</Typography>
          </Stack>
        </Stack>
      ) : (
        <Stack spacing={0.5}>
          <Typography variant="subtitle1">{title}</Typography>
          <Typography color="textSecondary" variant="caption">
            {rarity ? <RarityStars rarity={rarity} /> : subheader}
          </Typography>
        </Stack>
      )}
    </CardContent>
  )
}
