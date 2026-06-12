'use client'

import { useState } from 'react'
import { Box, IconButton, Stack, Typography } from '@mui/material'
import { ChevronLeft, ChevronRight } from '@mui/icons-material'
import { CarouselImage } from '@/lib/types/outfit'

export default function OutfitCarousel({
  images,
  title,
}: {
  images: CarouselImage[]
  title: string
}) {
  const [index, setIndex] = useState(0)

  if (images.length === 0) return null

  const current = images[index]
  const hasPrev = index > 0
  const hasNext = index < images.length - 1

  return (
    <Stack spacing={1} sx={{ alignItems: 'center', width: '100%' }}>
      <Box sx={{ position: 'relative', width: '100%', maxWidth: 300, mx: 'auto' }}>
        <Box
          alt={title}
          component="img"
          src={current.image_url}
          sx={{
            width: '100%',
            aspectRatio: '9 / 16',
            objectFit: 'cover',
            borderRadius: 2,
            display: 'block',
          }}
        />
        {hasPrev && (
          <IconButton
            aria-label="Previous image"
            size="small"
            sx={{
              position: 'absolute',
              left: 4,
              top: '50%',
              transform: 'translateY(-50%)',
              bgcolor: 'background.paper',
              opacity: 0.85,
              '&:hover': { opacity: 1 },
            }}
            onClick={() => setIndex((i) => i - 1)}
          >
            <ChevronLeft />
          </IconButton>
        )}
        {hasNext && (
          <IconButton
            aria-label="Next image"
            size="small"
            sx={{
              position: 'absolute',
              right: 4,
              top: '50%',
              transform: 'translateY(-50%)',
              bgcolor: 'background.paper',
              opacity: 0.85,
              '&:hover': { opacity: 1 },
            }}
            onClick={() => setIndex((i) => i + 1)}
          >
            <ChevronRight />
          </IconButton>
        )}
      </Box>

      {images.length > 1 && (
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
          {images.map((img, i) => (
            <Box
              key={img.id}
              aria-label={`Go to image ${i + 1}`}
              component="button"
              sx={{
                width: i === index ? 10 : 8,
                height: i === index ? 10 : 8,
                borderRadius: '50%',
                border: 'none',
                cursor: 'pointer',
                p: 0,
                bgcolor: i === index ? 'primary.main' : 'action.disabled',
                transition: 'all 0.2s',
              }}
              onClick={() => setIndex(i)}
            />
          ))}
          <Typography color="textSecondary" sx={{ ml: 0.5 }} variant="caption">
            {index + 1} / {images.length}
          </Typography>
        </Stack>
      )}
    </Stack>
  )
}
