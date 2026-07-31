'use client'

import { EurekaSet } from '@/lib/types/eureka'
import { Category } from '@mui/icons-material'
import { Autocomplete, Box, ListItemAvatar, ListItemText, TextField } from '@mui/material'
import LazyImage from '@/components/lazy-image'

export default function EurekaSelect({
  eurekaSets,
  selectedEurekaSet,
  onEurekaSetChange,
}: {
  eurekaSets: EurekaSet[]
  selectedEurekaSet: string | null
  onEurekaSetChange: (slug: string | null) => void
}) {
  const value = eurekaSets.find((set) => set.slug === selectedEurekaSet) ?? null

  return (
    <Autocomplete
      autoHighlight
      fullWidth
      getOptionLabel={(option) => option.title}
      isOptionEqualToValue={(option, val) => option.slug === val.slug}
      options={eurekaSets}
      renderInput={(params) => <TextField {...params} aria-label="Eureka Set" label="Eureka Set" />}
      renderOption={(props, option) => {
        const { key, ...optionProps } = props
        return (
          <Box key={key} component="li" {...optionProps} sx={{ gap: 1 }}>
            <ListItemAvatar sx={{ minWidth: 'auto' }}>
              <LazyImage alt={option.title} size="sm" src={option.image_url}>
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
      onChange={(_e, newValue) => onEurekaSetChange(newValue?.slug ?? null)}
    />
  )
}
