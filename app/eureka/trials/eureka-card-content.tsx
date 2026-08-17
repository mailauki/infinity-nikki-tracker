import { CardContent, Stack, Typography } from '@mui/material'

import RarityStars from '@/components/rarity-stars'
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
          <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography component="p" variant="headline">
              {title}
            </Typography>
            <RarityStars rarity={rarity!} />
          </Stack>
          <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography size="small" variant="label">{trial}</Typography>
            <Typography variant="body">{style}</Typography>
          </Stack>
        </Stack>
      ) : (
        <Stack spacing={0.5}>
          <Typography size="large" variant="title">{title}</Typography>
          {rarity ? <RarityStars rarity={rarity} /> : subheader}
        </Stack>
      )}
    </CardContent>
  )
}
