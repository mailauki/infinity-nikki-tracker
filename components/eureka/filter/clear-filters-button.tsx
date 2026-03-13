import { CategoryFilter, ObtainedFilter } from '@/lib/types/props'
import { Clear } from '@mui/icons-material'
import { Box, IconButton, Stack, Tooltip } from '@mui/material'

export default function ClearFiltersButton({
  selectedEurekaSet,
  selectedCategory,
  selectedObtainedFilter,
  selectedColor,
  selectedRarities,
  showByColor,
  onClearFilters,
}: {
  selectedEurekaSet: string | null
  selectedCategory: CategoryFilter | null
  selectedObtainedFilter: ObtainedFilter | null
  groupBySet: boolean
  showByColor: boolean
  selectedColor: string | null
  selectedRarities: number[]
  onClearFilters: () => void
}) {
  return (
    <Stack sx={{ flex: 1 }}>
      {(selectedEurekaSet ||
        selectedCategory ||
        selectedObtainedFilter ||
        selectedColor ||
        selectedRarities.length > 0 ||
        showByColor) && (
        <Box alignSelf="flex-end">
          <Tooltip title="Clear filters">
            <IconButton aria-label="Clear filters" onClick={onClearFilters}>
              <Clear />
            </IconButton>
          </Tooltip>
        </Box>
      )}
    </Stack>
  )
}
