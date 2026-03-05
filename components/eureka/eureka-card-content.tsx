import { CardContent, Stack, Typography } from '@mui/material'

import QualityStars from '../quality-stars'
import { CardSize } from '@/lib/types/props'

export default function EurekaCardContent({
  name,
  quality,
  size = 'sm',
  trial,
  style,
}: {
  name: string
  quality: number | null
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
              {name}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              <QualityStars quality={quality!} />
            </Typography>
          </Stack>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle2">{trial}</Typography>
            <Typography variant="caption">{style}</Typography>
          </Stack>
        </Stack>
      ) : (
        <Stack spacing={0.5}>
          <Typography variant="subtitle2">{name}</Typography>
          <Typography variant="caption" color="textSecondary">
            <QualityStars quality={quality!} />
          </Typography>
        </Stack>
      )}
    </CardContent>
  )
}
