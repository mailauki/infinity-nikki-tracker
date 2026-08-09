'use client'

import { useState } from 'react'
import { Box, Collapse, Typography } from '@mui/material'
import { ExpandLess, ExpandMore } from '@mui/icons-material'

export default function AdminCompletenessToggle({
  summary,
  children,
}: {
  summary: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Box
        aria-expanded={open}
        component="button"
        onClick={() => setOpen((v) => !v)}
        sx={{
          alignItems: 'center',
          background: 'none',
          border: 0,
          color: 'text.secondary',
          cursor: 'pointer',
          display: 'flex',
          gap: 0.5,
          px: 0,
          py: 1,
          width: '100%',
        }}
      >
        {open ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
        <Typography color="text.secondary" variant="body2">
          {summary}
        </Typography>
      </Box>
      <Collapse in={open}>{children}</Collapse>
    </>
  )
}
