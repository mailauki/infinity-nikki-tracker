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

  const setScrollRef = React.useCallback((node: HTMLDivElement | null) => {
    scrollRef.current = node
  }, [])

  React.useEffect(() => {
    const node = scrollRef.current
    if (!node) return

    const handleScroll = () => setIsVisible(node.scrollTop > 300)

    const handleTouchStart = (e: TouchEvent) => {
      pullStartY.current = node.scrollTop === 0 ? e.touches[0].clientY : 0
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!pullStartY.current) return
      const delta = e.touches[0].clientY - pullStartY.current
      if (delta > 0) setPullDistance(Math.min(delta * 0.5, PULL_THRESHOLD))
    }

    const handleTouchEnd = () => {
      setPullDistance((prev) => {
        if (prev >= PULL_THRESHOLD) {
          setIsRefreshing(true)
          router.refresh()
          setTimeout(() => {
            setIsRefreshing(false)
            setPullDistance(0)
          }, 1000)
          return prev
        }
        return 0
      })
      pullStartY.current = 0
    }

    node.addEventListener('scroll', handleScroll)
    node.addEventListener('touchstart', handleTouchStart, { passive: true })
    node.addEventListener('touchmove', handleTouchMove, { passive: true })
    node.addEventListener('touchend', handleTouchEnd)

    return () => {
      node.removeEventListener('scroll', handleScroll)
      node.removeEventListener('touchstart', handleTouchStart)
      node.removeEventListener('touchmove', handleTouchMove)
      node.removeEventListener('touchend', handleTouchEnd)
    }
  }, [router])

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'instant' })
    setIsVisible(false)
  }, [pathname])

  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return { setScrollRef, scrollToTop, isVisible, pullDistance, isRefreshing }
}
