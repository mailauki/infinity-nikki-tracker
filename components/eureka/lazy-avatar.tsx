'use client'
import { useEffect, useRef, useState } from 'react'
import Avatar from '@mui/material/Avatar'
import Skeleton from '@mui/material/Skeleton'
import Box from '@mui/material/Box'
import type { AvatarProps } from '@mui/material/Avatar'

const RETRY_TIMEOUT_MS = 4000

export default function LazyAvatar({ src, sx, children, ...props }: AvatarProps) {
  const [loaded, setLoaded] = useState(false)
  const [retryKey, setRetryKey] = useState(0)
  const startTimeRef = useRef<number>(Date.now())

  useEffect(() => {
    setLoaded(false)
    setRetryKey(0)
    startTimeRef.current = Date.now()
  }, [src])

  function handleError() {
    if (Date.now() - startTimeRef.current < RETRY_TIMEOUT_MS) {
      setRetryKey((k) => k + 1)
    } else {
      setLoaded(true)
    }
  }

  const retrySrc = retryKey > 0 && src ? `${src}?retry=${retryKey}` : src

  return (
    <Box sx={{ position: 'relative', display: 'inline-flex', width: 'fit-content' }}>
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
            onError: handleError,
            loading: 'lazy',
          },
        }}
        src={retrySrc}
        sx={{ ...sx, opacity: loaded || !src ? 1 : 0 }}
        {...props}
      >
        {children}
      </Avatar>
    </Box>
  )
}
