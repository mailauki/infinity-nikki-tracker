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
  ToggleButton,
  Tooltip,
} from '@mui/material'

export default function ColorToggle({
  colors,
  showByColor,
  onShowByColorChange,
  selectedColor,
  onColorChange,
}: {
  colors: Color[]
  showByColor: boolean
  onShowByColorChange: () => void
  selectedColor: string | null
  onColorChange: (event: SelectChangeEvent) => void
}) {
  return (
    <>
      <Tooltip title="Show by Color">
        <ToggleButton
          value="showByColor"
          selected={showByColor}
          onChange={onShowByColorChange}
          sx={{ py: 1.75, whiteSpace: 'nowrap' }}
        >
          <ColorLens />
        </ToggleButton>
      </Tooltip>

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
    </>
  )
}
