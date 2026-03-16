'use client'

import { EurekaSet } from '@/lib/types/eureka'
import { Box, Card, CardActionArea, Stack, Typography } from '@mui/material'
import LazyAvatar from './lazy-avatar'
import { Category } from '@mui/icons-material'
import RarityStars from '../rarity-stars'

export default function EurekaSetCard({ eurekaSet }: { eurekaSet: EurekaSet }) {
  const { slug, title, image_url, rarity, eureka_variants } = eurekaSet

  return (
    <Card>
      <CardActionArea href={`/eureka/${eurekaSet.slug}`}>
        <Box sx={{ position: 'relative' }}>
          <Stack alignItems="center" sx={{ pt: 1 }}>
            <LazyAvatar
              alt={slug}
              color="transparent"
              size="lg"
              src={image_url || eureka_variants[0]?.image_url || undefined}
              sx={{ bgcolor: 'transparent', color: 'text.disabled' }}
            >
              <Category fontSize="inherit" />
            </LazyAvatar>
          </Stack>
          <Stack
            alignItems="center"
            direction="row"
            justifyContent="space-between"
            sx={{ py: 0.75, px: 1.25, my: 0 }}
          >
            <Typography variant="overline">{title}</Typography>
          </Stack>

          <Box sx={{ position: 'absolute', top: 8, left: 8 }}>
            {rarity && (
              <Typography color="textSecondary" variant="overline">
                <RarityStars rarity={rarity} />
              </Typography>
            )}
          </Box>
        </Box>
      </CardActionArea>
    </Card>
  )
}
