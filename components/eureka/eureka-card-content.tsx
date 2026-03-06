import { CardContent, Stack, Typography } from '@mui/material'

import RarityStars from '../rarity-stars'
import { CardSize } from '@/lib/types/props'

export default function EurekaCardContent({
  title,
  rarity,
  size = 'sm',
  trial,
  style,
}: {
  title: string
  rarity: number | null
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
            <Typography variant="subtitle2">{trial}</Typography>
            <Typography variant="caption">{style}</Typography>
          </Stack>
        </Stack>
      ) : (
        <Stack spacing={0.5}>
          <Typography variant="subtitle2">{title}</Typography>
          <Typography variant="caption" color="textSecondary">
            <RarityStars rarity={rarity!} />
          </Typography>
        </Stack>
      )}
    </CardContent>
  )
}
