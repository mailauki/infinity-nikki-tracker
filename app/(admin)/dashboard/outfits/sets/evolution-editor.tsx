'use client'

import { useEffect, useState } from 'react'
import {
  Box,
  Button,
  FormControl,
  FormHelperText,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { AddCircleOutline, RemoveCircleOutline } from '@mui/icons-material'
import { EvolutionDraft } from '@/lib/types/outfit'

export default function EvolutionEditor({
  maxEvolutions,
  initialDrafts = [],
  onChange,
  glowupEvolutionOrder,
  onGlowupChange,
}: {
  maxEvolutions: number
  initialDrafts?: EvolutionDraft[]
  onChange: (drafts: EvolutionDraft[]) => void
  glowupEvolutionOrder: number | ''
  onGlowupChange: (order: number | '') => void
}) {
  const [drafts, setDrafts] = useState<EvolutionDraft[]>(initialDrafts)

  useEffect(() => {
    if (drafts.length > maxEvolutions) {
      const trimmed = drafts.slice(0, maxEvolutions).map((d, i) => ({ ...d, order: i + 1 }))
      setDrafts(trimmed)
      onChange(trimmed)
    }
  }, [maxEvolutions])

  useEffect(() => {
    if (glowupEvolutionOrder !== '' && glowupEvolutionOrder > drafts.length) {
      onGlowupChange('')
    }
  }, [drafts.length, glowupEvolutionOrder])

  function handleAdd() {
    const next = [...drafts, { subtitle: '', order: drafts.length + 1 }]
    setDrafts(next)
    onChange(next)
  }

  function handleRemove(index: number) {
    const next = drafts.filter((_, i) => i !== index).map((d, i) => ({ ...d, order: i + 1 }))
    setDrafts(next)
    onChange(next)
  }

  function handleSubtitleChange(index: number, value: string) {
    const next = drafts.map((d, i) => (i === index ? { ...d, subtitle: value } : d))
    setDrafts(next)
    onChange(next)
  }

  if (maxEvolutions === 0) {
    return (
      <Typography color="text.secondary" variant="body2">
        2-star sets have no evolutions.
      </Typography>
    )
  }

  return (
    <Stack spacing={1.5}>
      <Typography color="text.secondary" variant="subtitle2">
        Evolutions ({drafts.length}/{maxEvolutions})
      </Typography>

      {drafts.map((draft, index) => (
        <Stack key={index} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Typography sx={{ minWidth: 20, color: 'text.secondary' }} variant='body2'>
            {index + 1}.
          </Typography>
          <TextField
            label="Subtitle"
            size="small"
            slotProps={{ htmlInput: { maxLength: 100 } }}
            sx={{ flex: 1 }}
            value={draft.subtitle}
            onChange={(e) => handleSubtitleChange(index, e.target.value)}
          />
          <IconButton
            aria-label="Remove evolution"
            size="small"
            onClick={() => handleRemove(index)}
          >
            <RemoveCircleOutline fontSize="small" />
          </IconButton>
        </Stack>
      ))}

      {drafts.length < maxEvolutions && (
        <Box sx={{ pb: 1 }}>
          <Button startIcon={<AddCircleOutline />} variant="text" onClick={handleAdd}>
            Add evolution
          </Button>
        </Box>
      )}

      {drafts.length > 0 && (
        <FormControl>
          <InputLabel>Glow-Up Evolution</InputLabel>
          <Select
            label="Glow-Up Evolution"
            value={glowupEvolutionOrder}
            onChange={(e) => onGlowupChange(e.target.value as number | '')}
          >
            <MenuItem value="">—</MenuItem>
            {drafts.map((d, i) => (
              <MenuItem key={i + 1} value={i + 1}>
                {d.subtitle || `Evolution ${i + 1}`}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
    </Stack>
  )
}
