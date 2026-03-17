import LazyAvatar from '@/components/eureka/lazy-avatar'
import { Color } from '@/lib/types/eureka'
import { ColorLens } from '@mui/icons-material'
import {
  Box,
  Chip,
  FormControl,
  FormHelperText,
  InputLabel,
  ListItem,
  ListItemAvatar,
  ListItemText,
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
  maxColors,
}: {
  colors: Color[]
  colorSelect: string[]
  handleChange: (event: SelectChangeEvent<typeof colorSelect>) => void
  maxColors: number
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
              <Chip key={slug} label={colorBySlug[slug] ?? slug} icon={<LazyAvatar alt={slug} src={colors.find(color => color.slug === slug)!.image_url!} size='xs' />} />
            ))}
          </Box>
        )}
        value={colorSelect}
        onChange={handleChange}
      >
        {colors.map((color) => (
          <MenuItem
            key={color.slug}
            disabled={colorSelect.length >= maxColors && !colorSelect.includes(color.slug)}
            style={getStyles(color.slug, colorSelect, theme)}
            value={color.slug}
          >
            <ListItem disablePadding component="div">
              <ListItemAvatar>
                <LazyAvatar
                  alt={color.title || color.slug}
                  color="transparent"
                  size="xs"
                  src={color.image_url!}
                >
                  <ColorLens fontSize="inherit" />
                </LazyAvatar>
              </ListItemAvatar>
              <ListItemText>{color.title}</ListItemText>
            </ListItem>
          </MenuItem>
        ))}
      </Select>
      <FormHelperText>
        {colorSelect.length}/{maxColors} colors selected
      </FormHelperText>
    </FormControl>
  )
}
