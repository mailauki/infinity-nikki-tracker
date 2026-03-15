'use client'
import { useState } from 'react'
import CardMedia from '@mui/material/CardMedia'
import Skeleton from '@mui/material/Skeleton'
import Box from '@mui/material/Box'
import type { CardMediaProps } from '@mui/material/CardMedia'

export default function LazyCardMedia({ image, sx, ...props }: CardMediaProps<'div'>) {
  const [loaded, setLoaded] = useState(false)

  return (
    <Box sx={{ position: 'relative', ...sx }}>
      {!loaded && image && (
        <Skeleton variant="rectangular" sx={{ position: 'absolute', inset: 0, height: '100%' }} />
      )}
      {image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt=""
          aria-hidden
          loading="lazy"
          src={image}
          style={{ display: 'none' }}
          onError={() => setLoaded(true)}
          onLoad={() => setLoaded(true)}
        />
      )}
      <CardMedia
        image={image}
        sx={{ height: '100%', opacity: loaded || !image ? 1 : 0 }}
        {...props}
      />
    </Box>
  )
}
