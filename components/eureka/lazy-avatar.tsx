'use client'
import { useState } from 'react'
import Avatar from '@mui/material/Avatar'
import Skeleton from '@mui/material/Skeleton'
import Box from '@mui/material/Box'
import type { AvatarProps } from '@mui/material/Avatar'

export default function LazyAvatar({ src, sx, children, ...props }: AvatarProps) {
  const [loaded, setLoaded] = useState(false)

  return (
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      {!loaded && src && (
        <Skeleton
          sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          variant="circular"
        />
      )}
      <Avatar
        slotProps={{
          img: {
            onLoad: () => setLoaded(true),
            onError: () => setLoaded(true),
            loading: 'lazy',
          },
        }}
        src={src}
        sx={{ ...sx, opacity: loaded || !src ? 1 : 0 }}
        {...props}
      >
        {children}
      </Avatar>
    </Box>
  )
}
