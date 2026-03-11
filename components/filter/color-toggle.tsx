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

export default function ColorToggle({
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
        labelId="colors-select-label"
        id="colors-select"
        value={selectedColor ?? ''}
        aria-label="Color"
        label="Color"
        onChange={onColorChange}
        sx={{ '& .MuiOutlinedInput-input': { py: selectedColor && 1.5 } }}
        disabled={disabled}
      >
        <MenuItem value="">—</MenuItem>
        {colors.map((color) => (
          <MenuItem key={color.title} value={color.title}>
            <ListItem disablePadding component="div">
              <ListItemAvatar>
                <Avatar size="xs" src={color.image_url!} alt={color.title}>
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
