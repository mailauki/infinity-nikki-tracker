import { Color } from '@/lib/types/eureka'
import {
  Box,
  Chip,
  FormControl,
  FormHelperText,
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

function getStyles(color: string, colorSelect: readonly string[], theme: Theme) {
  return {
    fontWeight: colorSelect.includes(color)
      ? theme.typography.fontWeightMedium
      : theme.typography.fontWeightRegular,
  }
}

export default function ColorSelect({
  colors,
  colorSelect,
  handleChange,
}: {
  colors: Color[]
  colorSelect: string[]
  handleChange: (event: SelectChangeEvent<typeof colorSelect>) => void
}) {
  const theme = useTheme()
  const colorBySlug = Object.fromEntries(colors.map((c) => [c.slug, c.title]))

  return (
    <FormControl sx={{ m: 1, minWidth: 300 }}>
      <InputLabel id="color-multiple-chip-label">Colors</InputLabel>
      <Select
        multiple
        MenuProps={MenuProps}
        id="color-multiple-chip"
        input={<OutlinedInput id="select-multiple-chip" label="Colors" />}
        labelId="color-multiple-chip-label"
        renderValue={(selected) => (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {selected.map((slug) => (
              <Chip key={slug} label={colorBySlug[slug] ?? slug} />
            ))}
          </Box>
        )}
        value={colorSelect}
        onChange={handleChange}
      >
        {colors.map((color) => (
          <MenuItem
            key={color.slug}
            disabled={colorSelect.length >= 5 && !colorSelect.includes(color.slug)}
            style={getStyles(color.slug, colorSelect, theme)}
            value={color.slug}
          >
            {color.title}
          </MenuItem>
        ))}
      </Select>
      <FormHelperText>{colorSelect.length}/5 colors selected</FormHelperText>
    </FormControl>
  )
}
