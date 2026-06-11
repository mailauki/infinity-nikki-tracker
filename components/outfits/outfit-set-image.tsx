'use client'
import { useEffect, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Skeleton from '@mui/material/Skeleton'
import Image from 'next/image'
import { OutfitSet } from '@/lib/types/outfit'

const RETRY_TIMEOUT_MS = 4000

export default function OutfitSetImage({ set }: { set: OutfitSet }) {
  const src = set.poster_image_url || set.image_url || ''

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

  let retrySrc: string | undefined
  if (src) retrySrc = retryKey > 0 ? `${src}?retry=${retryKey}` : src

  return (
    <Box sx={{ position: 'relative', width: '100%', maxWidth: '300px', aspectRatio: '9 / 16' }}>
      {!loaded && retrySrc && (
        <Skeleton
          sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          variant="rounded"
        />
      )}
      {retrySrc && (
        <Image
          key={retryKey}
          ref={imgRef}
          fill
          alt={set.title}
          sizes="(max-width: 300px) 50vw, 300px"
          src={retrySrc}
          style={{ objectFit: 'cover', opacity: loaded ? 1 : 0 }}
          onError={handleError}
          onLoad={handleLoad}
        />
      )}
    </Box>
  )
}
