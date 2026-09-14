'use client'

import { useState, useTransition } from 'react'
import { IconButton } from '@mui/material'
import { RadioButtonUncheckedOutlined, TaskAlt } from '@mui/icons-material'
import { enqueueSnackbar } from 'notistack'

import { handleObtained } from '@/app/eureka/actions'
import { handleObtainedOutfit } from '@/app/outfits/actions'
import { handleObtainedMakeup } from '@/app/makeup/actions'
import { handleObtainedMomoCloak } from '@/app/momo-cloaks/actions'
import { actionFor, isCollectible } from '@/lib/search/obtained'
import type { SearchResult } from '@/lib/search/types'

async function runAction(result: SearchResult) {
  const action = actionFor(result)
  if (!action) return

  switch (action.fn) {
    case 'outfit':
      return handleObtainedOutfit(...action.args)
    case 'eureka':
      return handleObtained(...action.args)
    case 'makeup':
      return handleObtainedMakeup(...action.args)
    case 'momoCloak':
      return handleObtainedMomoCloak(...action.args)
  }
}

export default function ObtainedToggle({ result }: { result: SearchResult }) {
  // Optimistic override for the in-flight toggle only -- cleared once the
  // action settles so a fresh result.obtained (a re-search, another tab)
  // always wins rather than being shadowed by stale local state.
  const [pending, setPending] = useState<boolean | null>(null)
  const [, startTransition] = useTransition()

  const obtained = pending ?? result.obtained

  // obtained is null for non-collectible kinds and for signed-out viewers
  // (RLS returns no rows) -- both render no toggle at all.
  if (!isCollectible(result) || obtained === null) return null

  const label = obtained
    ? `Mark ${result.title} as not obtained`
    : `Mark ${result.title} as obtained`

  const handleClick = (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()

    setPending(!obtained)

    startTransition(async () => {
      try {
        await runAction(result)
        setPending(null)
      } catch (err) {
        console.error('Failed to toggle obtained state:', err)
        setPending(null)
        enqueueSnackbar('Failed to update your collection. Please try again.', {
          variant: 'error',
        })
      }
    })
  }

  return (
    <IconButton aria-label={label} aria-pressed={obtained} edge="end" onClick={handleClick}>
      {obtained ? <TaskAlt /> : <RadioButtonUncheckedOutlined />}
    </IconButton>
  )
}
