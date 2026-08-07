'use client'

import { MakeupSet } from '@/lib/types/makeup'
import { Category } from '@mui/icons-material'
import { Autocomplete, Box, ListItemAvatar, ListItemText, TextField } from '@mui/material'
import LazyImage from '@/components/lazy-image'

export default function MakeupSelect({
  makeupSets,
  selectedMakeupSet,
  onMakeupSetChange,
}: {
  makeupSets: MakeupSet[]
  selectedMakeupSet: string | null
  onMakeupSetChange: (slug: string | null) => void
}) {
  const value = makeupSets.find((set) => set.slug === selectedMakeupSet) ?? null

  return (
    <Autocomplete
      autoHighlight
      fullWidth
      getOptionLabel={(option) => option.title}
      isOptionEqualToValue={(option, val) => option.slug === val.slug}
      options={makeupSets}
      renderInput={(params) => <TextField {...params} aria-label="Makeup Set" label="Makeup Set" />}
      renderOption={(props, option) => {
        const { key, ...optionProps } = props
        return (
          <Box key={key} component="li" {...optionProps} sx={{ gap: 1 }}>
            <ListItemAvatar sx={{ minWidth: 'auto' }}>
              <LazyImage alt={option.title} size="sm" src={option.image_url!}>
                <Category fontSize="inherit" />
              </LazyImage>
            </ListItemAvatar>
            <ListItemText>{option.title}</ListItemText>
          </Box>
        )
      }}
      size="small"
      sx={{ flex: 1, whiteSpace: 'nowrap' }}
      value={value}
      onChange={(_e, newValue) => onMakeupSetChange(newValue?.slug ?? null)}
    />
  )
}
