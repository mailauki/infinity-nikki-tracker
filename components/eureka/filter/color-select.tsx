'use client'

import { Color } from '@/lib/types/eureka'
import { ColorLens } from '@mui/icons-material'
import {
  Avatar,
  FormControl,
  InputLabel,
  ListItem,
  ListItemAvatar,
  ListItemText,
  MenuItem,
  Select,
  SelectChangeEvent,
} from '@mui/material'

export default function ColorSelect({
  colors,
  selectedColor,
  onColorChange,
  disabled,
}: {
  colors: Color[]
  selectedColor: string | null
  onColorChange: (event: SelectChangeEvent) => void
  disabled: boolean
}) {
  return (
    <FormControl
      sx={{
        flex: 1,
        minWidth: '180px',
        whiteSpace: 'nowrap',
      }}
    >
      <InputLabel id="colors-select-label">Color</InputLabel>
      <Select
        aria-label="Color"
        disabled={disabled}
        id="colors-select"
        label="Color"
        labelId="colors-select-label"
        sx={{ '& .MuiOutlinedInput-input': { py: selectedColor && 1.5 } }}
        value={selectedColor ?? ''}
        onChange={onColorChange}
      >
        <MenuItem value="">—</MenuItem>
        {colors.map((color) => (
          <MenuItem key={color.slug} value={color.slug}>
            <ListItem disablePadding component="div">
              <ListItemAvatar>
                <Avatar alt={color.title || color.slug} color='transparent' size="xs" src={color.image_url!}>
                  <ColorLens fontSize="inherit" />
                </Avatar>
              </ListItemAvatar>
              <ListItemText>{color.title}</ListItemText>
            </ListItem>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}
