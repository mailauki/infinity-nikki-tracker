import { CategoryFilter, ObtainedFilter } from '@/lib/types/props'
import { Box, Button, Stack } from '@mui/material'

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
          <Button color="inherit" onClick={onClearFilters}>
            Clear all
          </Button>
        </Box>
      )}
    </Stack>
  )
}
