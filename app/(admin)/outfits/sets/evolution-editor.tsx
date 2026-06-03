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
  defaultEvolutionOrder,
  onDefaultChange,
}: {
  maxEvolutions: number
  initialDrafts?: EvolutionDraft[]
  onChange: (drafts: EvolutionDraft[]) => void
  defaultEvolutionOrder: number | ''
  onDefaultChange: (order: number | '') => void
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
    if (defaultEvolutionOrder !== '' && defaultEvolutionOrder > drafts.length) {
      onDefaultChange('')
    }
  }, [drafts.length, defaultEvolutionOrder])

  function handleAdd() {
    const next = [...drafts, { subtitle: '', order: drafts.length + 1 }]
    setDrafts(next)
    onChange(next)
  }

  function handleRemove(index: number) {
    const next = drafts
      .filter((_, i) => i !== index)
      .map((d, i) => ({ ...d, order: i + 1 }))
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
      <Typography variant="body2" color="text.secondary">
        2-star sets have no evolutions.
      </Typography>
    )
  }

  return (
    <Stack spacing={1.5}>
      <Typography variant="subtitle2" color="text.secondary">
        Evolutions ({drafts.length}/{maxEvolutions})
      </Typography>

      {drafts.map((draft, index) => (
        <Stack key={index} direction="row" alignItems="center" spacing={1}>
          <Typography variant="caption" sx={{ minWidth: 20, color: 'text.secondary' }}>
            {index + 1}.
          </Typography>
          <TextField
            label="Subtitle"
            size="small"
            value={draft.subtitle}
            onChange={(e) => handleSubtitleChange(index, e.target.value)}
            sx={{ flex: 1 }}
            slotProps={{ htmlInput: { maxLength: 100 } }}
          />
          <IconButton
            size="small"
            onClick={() => handleRemove(index)}
            aria-label="Remove evolution"
          >
            <RemoveCircleOutline fontSize="small" />
          </IconButton>
        </Stack>
      ))}

      {drafts.length < maxEvolutions && (
        <Box>
          <Button
            startIcon={<AddCircleOutline />}
            size="small"
            variant="text"
            onClick={handleAdd}
          >
            Add evolution
          </Button>
        </Box>
      )}

      {drafts.length > 0 && (
        <FormControl size="small">
          <InputLabel>Default Evolution</InputLabel>
          <Select
            label="Default Evolution"
            value={defaultEvolutionOrder}
            onChange={(e) => onDefaultChange(e.target.value as number | '')}
          >
            <MenuItem value="">—</MenuItem>
            {drafts.map((d, i) => (
              <MenuItem key={i + 1} value={i + 1}>
                {d.subtitle || `Evolution ${i + 1}`}
              </MenuItem>
            ))}
          </Select>
          <FormHelperText>Shown first on the outfit set page</FormHelperText>
        </FormControl>
      )}
    </Stack>
  )
}
