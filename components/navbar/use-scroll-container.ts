import * as React from 'react'
import { usePathname, useRouter } from 'next/navigation'

const PULL_THRESHOLD = 80

export function useScrollContainer() {
  const pathname = usePathname()
  const router = useRouter()

  const [isVisible, setIsVisible] = React.useState(false)
  const [pullDistance, setPullDistance] = React.useState(0)
  const [isRefreshing, setIsRefreshing] = React.useState(false)

  const scrollRef = React.useRef<HTMLDivElement>(null)
  const pullStartY = React.useRef(0)

  const handleScroll = React.useCallback(() => {
    if (!scrollRef.current) return
    setIsVisible(scrollRef.current.scrollTop > 300)
  }, [])

  const handleTouchStart = React.useCallback((e: TouchEvent) => {
    if (scrollRef.current && scrollRef.current.scrollTop === 0) {
      pullStartY.current = e.touches[0].clientY
    } else {
      pullStartY.current = 0
    }
  }, [])

  const handleTouchMove = React.useCallback((e: TouchEvent) => {
    if (!pullStartY.current) return
    const delta = e.touches[0].clientY - pullStartY.current
    if (delta > 0) setPullDistance(Math.min(delta * 0.5, PULL_THRESHOLD))
  }, [])

  const handleTouchEnd = React.useCallback(() => {
    if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
      setIsRefreshing(true)
      router.refresh()
      setTimeout(() => {
        setIsRefreshing(false)
        setPullDistance(0)
      }, 1000)
    } else {
      setPullDistance(0)
    }
    pullStartY.current = 0
  }, [pullDistance, isRefreshing, router])

  const setScrollRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      scrollRef.current?.removeEventListener('scroll', handleScroll)
      scrollRef.current?.removeEventListener('touchstart', handleTouchStart)
      scrollRef.current?.removeEventListener('touchmove', handleTouchMove)
      scrollRef.current?.removeEventListener('touchend', handleTouchEnd)
      scrollRef.current = node
      node?.addEventListener('scroll', handleScroll)
      node?.addEventListener('touchstart', handleTouchStart, { passive: true })
      node?.addEventListener('touchmove', handleTouchMove, { passive: true })
      node?.addEventListener('touchend', handleTouchEnd)
    },
    [handleScroll, handleTouchStart, handleTouchMove, handleTouchEnd]
  )

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'instant' })
    setIsVisible(false)
  }, [pathname])

  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return { setScrollRef, scrollToTop, isVisible, pullDistance, isRefreshing }
}
