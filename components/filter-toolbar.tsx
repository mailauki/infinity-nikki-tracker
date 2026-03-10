import { FormControl, InputLabel, MenuItem, Select, Stack, Toolbar } from '@mui/material'
import CategoryToggle from './category-toggle'
import { Category, EurekaSet } from '@/lib/types/eureka'

export default function FilterToolbar({
  eurekaSets,
  categories,
}: {
  eurekaSets: EurekaSet[]
  categories: Category[]
}) {
  return (
    <Toolbar disableGutters>
      <Stack
        direction="row"
        spacing={4}
        alignItems="center"
        justifyContent="space-between"
        sx={{ flex: 1 }}
      >
        <FormControl fullWidth>
          <InputLabel id="eureka-set-select-label">Eureka Set</InputLabel>
          <Select
            labelId="eureka-set-select-label"
            id="eureka-set-select"
            value="first_snow"
            aria-label="Eureka Set"
            label="Eureka Set"
          >
            {eurekaSets.map((set) => (
              <MenuItem key={set.slug} value={set.slug!}>
                {set.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <CategoryToggle categories={categories} />
      </Stack>
    </Toolbar>
  )
}
