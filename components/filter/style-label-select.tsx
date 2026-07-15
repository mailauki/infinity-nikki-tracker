'use client'

import {
  Box,
  Checkbox,
  Chip,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  ListItemText,
  MenuItem,
  Select,
  SelectChangeEvent,
} from '@mui/material'
import { Clear } from '@mui/icons-material'

import { MENU_PROPS } from '@/lib/types/props'
import { toTitle } from '@/lib/utils'

type Option = { slug: string; title: string | null }

type StyleLabelSelectProps = {
  id: string
  label: string
  options: Option[]
  selected: string[]
  onChange: (next: string[]) => void
  disabled?: boolean
}

export default function StyleLabelSelect({
  id,
  label,
  options,
  selected,
  onChange,
  disabled,
}: StyleLabelSelectProps) {
  const optionLabel = (option: Option) => toTitle(option.title ?? option.slug)

  const handleChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value
    onChange(typeof value === 'string' ? value.split(',').filter(Boolean) : value)
  }

  return (
    <FormControl disabled={disabled} sx={{ flex: 1, whiteSpace: 'nowrap' }}>
      <InputLabel id={`${id}-label`}>{label}</InputLabel>
      <Select<string[]>
        multiple
        MenuProps={MENU_PROPS}
        aria-label={label}
        endAdornment={
          selected.length > 0 && (
            <InputAdornment position="end" sx={{ mr: 3 }}>
              <IconButton
                aria-label={`Clear ${label.toLowerCase()}`}
                edge="end"
                size="small"
                onClick={() => onChange([])}
              >
                <Clear fontSize="small" />
              </IconButton>
            </InputAdornment>
          )
        }
        id={id}
        label={label}
        labelId={`${id}-label`}
        renderValue={(value) => (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {options
              .filter((option) => value.includes(option.slug))
              .map((option) => (
                <Chip key={option.slug} label={optionLabel(option)} size="small" />
              ))}
          </Box>
        )}
        value={selected}
        onChange={handleChange}
      >
        {options.map((option) => (
          <MenuItem key={option.slug} value={option.slug}>
            <Checkbox checked={selected.includes(option.slug)} />
            <ListItemText primary={optionLabel(option)} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}
