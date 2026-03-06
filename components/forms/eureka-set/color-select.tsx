import { Color } from '@/lib/types/eureka'
import {
  Box,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  SelectChangeEvent,
  Theme,
  useTheme,
} from '@mui/material'

const ITEM_HEIGHT = 48
const ITEM_PADDING_TOP = 8
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
}

function getStyles(name: string, personName: readonly string[], theme: Theme) {
  return {
    fontWeight: personName.includes(name)
      ? theme.typography.fontWeightMedium
      : theme.typography.fontWeightRegular,
  }
}

export default function ColorSelect({
  colors,
  colorTitle,
  handleChange,
}: {
  colors: Color[]
  colorTitle: string[]
  handleChange: (event: SelectChangeEvent<typeof colorTitle>) => void
}) {
  const theme = useTheme()
  const colorsSet = colors.map((color) => color.title)

  return (
    // TODO: add function to automatically add to the db upon submit, a variant of each category for each selected color
    <FormControl sx={{ m: 1, minWidth: 300 }}>
      <InputLabel id="color-multiple-chip-label">Colors</InputLabel>
      <Select
        labelId="color-multiple-chip-label"
        id="color-multiple-chip"
        multiple
        value={colorTitle}
        onChange={handleChange}
        input={<OutlinedInput id="select-multiple-chip" label="Colors" />}
        renderValue={(selected) => (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {selected.map((value) => (
              <Chip key={value} label={value} />
            ))}
          </Box>
        )}
        MenuProps={MenuProps}
      >
        {colorsSet.map((color) => (
          <MenuItem key={color} value={color} style={getStyles(color, colorTitle, theme)}>
            {color}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}
