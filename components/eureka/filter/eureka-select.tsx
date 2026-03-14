import { EurekaSet } from '@/lib/types/eureka'
import { Category } from '@mui/icons-material'
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  SelectChangeEvent,
} from '@mui/material'

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
        minWidth: { xs: '240px', sm: '260px', md: '300px' },
        whiteSpace: 'nowrap',
      }}
    >
      <InputLabel id="eureka-set-select-label">Eureka Set</InputLabel>
      <Select
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
                <Avatar alt={set.title} size="sm" src={set.image_url}>
                  <Category fontSize="inherit" />
                </Avatar>
              </ListItemAvatar>
              <ListItemText>{set.title}</ListItemText>
            </ListItem>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}
