'use client'

import { OutfitSet } from '@/lib/types/outfit'
import { Category } from '@mui/icons-material'
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ListItem,
  ListItemAvatar,
  ListItemText,
  SelectChangeEvent,
} from '@mui/material'
import LazyImage from '@/components/lazy-image'
import { MENU_PROPS } from '@/lib/types/props'

export default function OutfitSelect({
  outfitSets,
  selectedOutfitSet,
  onOutfitSetChange,
}: {
  outfitSets: OutfitSet[]
  selectedOutfitSet: string | null
  onOutfitSetChange: (event: SelectChangeEvent) => void
}) {
  return (
    <FormControl sx={{ flex: 1, whiteSpace: 'nowrap' }}>
      <InputLabel id="outfit-set-select-label">Outfit Set</InputLabel>
      <Select
        MenuProps={MENU_PROPS}
        aria-label="Outfit Set"
        id="outfit-set-select"
        label="Outfit Set"
        labelId="outfit-set-select-label"
        sx={{ '& .MuiOutlinedInput-input': { py: selectedOutfitSet ? 1 : undefined } }}
        value={selectedOutfitSet ?? ''}
        onChange={onOutfitSetChange}
      >
        <MenuItem value="">—</MenuItem>
        {outfitSets.map((set) => (
          <MenuItem key={set.slug} value={set.slug}>
            <ListItem disablePadding component="div">
              <ListItemAvatar>
                <LazyImage alt={set.title} size="sm" src={set.image_url!}>
                  <Category fontSize="inherit" />
                </LazyImage>
              </ListItemAvatar>
              <ListItemText>{set.title}</ListItemText>
            </ListItem>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}
