'use client'

import { ReactNode } from 'react'
import { Box, Card, Grow, IconButton } from '@mui/material'
import { RadioButtonUncheckedOutlined, TaskAlt } from '@mui/icons-material'

export function CollectionToggle({
  show,
  obtained,
  label,
  onToggle,
}: {
  show: boolean
  obtained: boolean
  label: string
  onToggle: () => void
}) {
  if (!show) return null
  return (
    <IconButton aria-label={label} aria-pressed={obtained} onClick={onToggle}>
      {obtained ? <TaskAlt /> : <RadioButtonUncheckedOutlined />}
    </IconButton>
  )
}

export default function CardShell({
  in: shown,
  unmountOnExit,
  onExited,
  raised,
  topLeft,
  topRight,
  children,
}: {
  in: boolean
  unmountOnExit?: boolean
  onExited?: () => void
  raised?: boolean
  topLeft?: ReactNode
  topRight?: ReactNode
  children: ReactNode
}) {
  return (
    <Grow in={shown} timeout={300} unmountOnExit={unmountOnExit} onExited={onExited}>
      <Card elevation={raised ? 3 : 1} sx={{ position: 'relative', flexGrow: 1 }}>
        {children}
        {topLeft && <Box sx={{ position: 'absolute', top: 12, left: 12 }}>{topLeft}</Box>}
        {topRight && <Box sx={{ position: 'absolute', top: 8, right: 8 }}>{topRight}</Box>}
      </Card>
    </Grow>
  )
}
