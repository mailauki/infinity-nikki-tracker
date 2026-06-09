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
  const mountedRef = useRef(false)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    setLoaded(false)
    setRetryKey(0)
    startTimeRef.current = Date.now()
  }, [src])

  // If the image was already cached, onLoad won't fire — check img.complete after mount
  useEffect(() => {
    const id = setTimeout(() => {
      if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
        setLoaded(true)
      }
    }, 0)
    return () => clearTimeout(id)
  }, [src])

  function handleLoad() {
    if (mountedRef.current) setLoaded(true)
  }

  function handleError() {
    if (!src || !mountedRef.current) return
    if (Date.now() - startTimeRef.current < RETRY_TIMEOUT_MS) {
      setRetryKey((k) => k + 1)
    } else {
      setLoaded(true)
    }
  }

  const retrySrc = src ? (retryKey > 0 ? `${src}?retry=${retryKey}` : src) : undefined

  return (
    <Box sx={{ position: 'relative', display: 'inline-flex', width: 'fit-content' }}>
      {!loaded && src && (
        <Skeleton
          sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          variant="rounded"
        />
      )}
      <Avatar
        slotProps={{
          img: retrySrc
            ? { ref: imgRef, onLoad: handleLoad, onError: handleError }
            : undefined,
        }}
        src={retrySrc}
        sx={{ ...sx, opacity: loaded || !src ? 1 : 0 }}
        variant="rounded"
        {...props}
      >
        {children}
      </Avatar>
    </Box>
  )
}
