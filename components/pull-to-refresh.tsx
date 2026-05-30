'use client'

import * as React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Box, CircularProgress, Fab, Slide, Toolbar, Tooltip } from '@mui/material'
import { KeyboardArrowUp } from '@mui/icons-material'

const PULL_THRESHOLD = 80

export default function PullToRefresh() {
  const pathname = usePathname()
  const router = useRouter()
  const [isVisible, setIsVisible] = React.useState(false)
  const [pullDistance, setPullDistance] = React.useState(0)
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const pullStartY = React.useRef(0)
  const isPulling = React.useRef(false)

  // Scroll visibility + reset on route change
  React.useEffect(() => {
    const handleScroll = () => setIsVisible(window.scrollY > 300)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
    setIsVisible(false)
  }, [pathname])

  React.useEffect(() => {
    if (!isRefreshing) return
    router.refresh()
    const timer = setTimeout(() => {
      setIsRefreshing(false)
      setPullDistance(0)
    }, 1000)
    return () => clearTimeout(timer)
  }, [isRefreshing, router])

  // Pull-to-refresh touch handlers on document
   
  React.useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        pullStartY.current = e.touches[0].clientY
        isPulling.current = true
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling.current) return
      const delta = e.touches[0].clientY - pullStartY.current
      if (delta > 0) setPullDistance(Math.min(delta * 0.5, PULL_THRESHOLD))
    }

    const handleTouchEnd = () => {
      isPulling.current = false
      setPullDistance((prev) => {
        if (prev >= PULL_THRESHOLD) {
          setIsRefreshing(true)
          return prev
        }
        return 0
      })
    }

    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchmove', handleTouchMove, { passive: true })
    document.addEventListener('touchend', handleTouchEnd)

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [])

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  return (
    <>
      {/* AppBar offset spacer */}
      <Toolbar />

      {/* Pull indicator */}
      <Slide direction="down" in={pullDistance > 0 || isRefreshing}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            pt: 1,
            pb: 0.5,
            transform: `translateY(${pullDistance}px)`,
            transition: pullDistance === 0 ? 'transform 0.3s ease' : 'none',
          }}
        >
          <CircularProgress
            size={24}
            sx={{ opacity: isRefreshing ? 1 : pullDistance / PULL_THRESHOLD }}
            value={isRefreshing ? undefined : (pullDistance / PULL_THRESHOLD) * 100}
            variant={isRefreshing ? 'indeterminate' : 'determinate'}
          />
        </Box>
      </Slide>

      {/* Back-to-top FAB */}
      <Tooltip placement="top-end" title="Back to Top">
        <Slide direction="up" in={isVisible}>
          <Fab
            aria-label="scroll back to top"
            color="primary"
            size="small"
            sx={{ position: 'fixed', bottom: 80, right: 50 }}
            onClick={scrollToTop}
          >
            <KeyboardArrowUp />
          </Fab>
        </Slide>
      </Tooltip>
    </>
  )
}
