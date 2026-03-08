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
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h5" component="p">
              {title}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              <RarityStars rarity={rarity!} />
            </Typography>
          </Stack>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="overline">{trial}</Typography>
            <Typography variant="body2">{style}</Typography>
          </Stack>
        </Stack>
      ) : (
        <Stack spacing={0.5}>
          <Typography variant="subtitle1">{title}</Typography>
          <Typography variant="caption" color="textSecondary">
            {rarity ? <RarityStars rarity={rarity} /> : subheader}
          </Typography>
        </Stack>
      )}
    </CardContent>
  )
}
