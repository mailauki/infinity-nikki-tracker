import { EurekaSet } from '@/lib/types/eureka'
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
import LazyAvatar from '../lazy-avatar'
import { MENU_PROPS } from '@/lib/types/props'

export default function EurekaSelect({
  eurekaSets,
  selectedEurekaSet,
  onEurekaSetChange,
}: {
  eurekaSets: EurekaSet[]
  selectedEurekaSet: string | null
  onEurekaSetChange: (event: SelectChangeEvent) => void
}) {
  return (
    <FormControl
      sx={{
        flex: 1,
        whiteSpace: 'nowrap',
      }}
    >
      <InputLabel id="eureka-set-select-label">Eureka Set</InputLabel>
      <Select
        MenuProps={MENU_PROPS}
        aria-label="Eureka Set"
        id="eureka-set-select"
        label="Eureka Set"
        labelId="eureka-set-select-label"
        sx={{ '& .MuiOutlinedInput-input': { py: selectedEurekaSet && 1 } }}
        value={selectedEurekaSet ?? ''}
        onChange={onEurekaSetChange}
      >
        <MenuItem value="">—</MenuItem>
        {eurekaSets.map((set) => (
          <MenuItem key={set.slug} value={set.slug!}>
            <ListItem disablePadding component="div">
              <ListItemAvatar>
                <LazyAvatar alt={set.title} size="sm" src={set.image_url}>
                  <Category fontSize="inherit" />
                </LazyAvatar>
              </ListItemAvatar>
              <ListItemText>{set.title}</ListItemText>
            </ListItem>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}
