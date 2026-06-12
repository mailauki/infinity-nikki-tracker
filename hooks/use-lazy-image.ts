'use client'
import { useEffect, useRef, useState } from 'react'

const RETRY_TIMEOUT_MS = 4000

export interface UseLazyImageResult {
  loaded: boolean
  // src with ?retry=N appended when retryKey > 0
  retrySrc: string | undefined
  // exposed for use as a React `key` on the <img>
  retryKey: number
  imgRef: React.RefObject<HTMLImageElement | null>
  handleLoad: () => void
  handleError: () => void
}

export function useLazyImage(src: string | null | undefined): UseLazyImageResult {
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

  return { loaded, retrySrc, retryKey, imgRef, handleLoad, handleError }
}
