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
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    setLoaded(false)
    setRetryKey(0)
    startTimeRef.current = Date.now()
  }, [src])

  // If the image was already cached, onLoad won't fire — check img.complete on mount
  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setLoaded(true)
    }
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
            ref: imgRef,
            onLoad: () => setLoaded(true),
            onError: handleError,
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
