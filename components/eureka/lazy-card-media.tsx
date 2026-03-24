'use client'
import { useEffect, useRef, useState } from 'react'
import CardMedia from '@mui/material/CardMedia'
import Skeleton from '@mui/material/Skeleton'
import Box from '@mui/material/Box'
import type { CardMediaProps } from '@mui/material/CardMedia'

const RETRY_TIMEOUT_MS = 4000

export default function LazyCardMedia({ image, sx, ...props }: CardMediaProps<'div'>) {
  const [loaded, setLoaded] = useState(false)
  const [retryKey, setRetryKey] = useState(0)
  const startTimeRef = useRef<number>(Date.now())

  useEffect(() => {
    setLoaded(false)
    setRetryKey(0)
    startTimeRef.current = Date.now()
  }, [image])

  function handleError() {
    if (Date.now() - startTimeRef.current < RETRY_TIMEOUT_MS) {
      setRetryKey((k) => k + 1)
    } else {
      setLoaded(true)
    }
  }

  const retrySrc = retryKey > 0 && image ? `${image}?retry=${retryKey}` : image

  return (
    <Box sx={{ position: 'relative', ...sx }}>
      {!loaded && image && (
        <Skeleton sx={{ position: 'absolute', inset: 0, height: '100%' }} variant="rectangular" />
      )}
      {image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          aria-hidden
          alt=""
          src={retrySrc}
          style={{ visibility: 'hidden', position: 'absolute', width: 0, height: 0 }}
          onError={handleError}
          onLoad={() => setLoaded(true)}
        />
      )}
      <CardMedia
        image={retrySrc}
        sx={{ height: '100%', opacity: loaded || !image ? 1 : 0 }}
        {...props}
      />
    </Box>
  )
}
