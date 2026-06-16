'use client'

import { OutfitSet } from '@/lib/types/outfit'
import { Category } from '@mui/icons-material'
import {
  Autocomplete,
  Box,
  ListItemAvatar,
  ListItemText,
  TextField,
} from '@mui/material'
import LazyImage from '@/components/lazy-image'

export default function OutfitSelect({
  outfitSets,
  selectedOutfitSet,
  onOutfitSetChange,
}: {
  outfitSets: OutfitSet[]
  selectedOutfitSet: string | null
  onOutfitSetChange: (slug: string | null) => void
}) {
  const value = outfitSets.find((set) => set.slug === selectedOutfitSet) ?? null

  return (
    <Autocomplete
      autoHighlight
      fullWidth
      getOptionLabel={(option) => option.title}
      isOptionEqualToValue={(option, val) => option.slug === val.slug}
      options={outfitSets}
      renderInput={(params) => (
        <TextField {...params} aria-label="Outfit Set" label="Outfit Set" />
      )}
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
      sx={{ flex: 1, whiteSpace: 'nowrap' }}
      value={value}
      onChange={(_e, newValue) => onOutfitSetChange(newValue?.slug ?? null)}
    />
  )
}
