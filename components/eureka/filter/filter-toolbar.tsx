'use client'

import {
  Avatar,
  Box,
  Container,
  FormControl,
  IconButton,
  InputLabel,
  ListItem,
  ListItemAvatar,
  ListItemText,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  ToggleButton,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material'
import CategoryToggle from './category-toggle'
import { Category, Color, EurekaSet } from '@/lib/types/eureka'
import { CategoryFilter, ToggleFilter } from '@/lib/types/props'
import { Clear, FilterList, Category as CategoryIcon, ColorLens } from '@mui/icons-material'
import ObtainedToggle from './obtained-toggle'
import ColorToggle from './color-toggle'

export default function FilterToolbar({
  eurekaSets,
  categories,
  colors,
  selectedEurekaSet,
  selectedCategory,
  selectedFilter,
  groupBySet,
  showByColor,
  selectedColor,
  onEurekaSetChange,
  onCategoryChange,
  onFilterChange,
  onGroupBySetChange,
  onShowByColorChange,
  onColorChange,
  onClearFilters,
  resultsCount,
  isLoggedIn,
}: {
  eurekaSets: EurekaSet[]
  categories: Category[]
  colors: Color[]
  selectedEurekaSet: string | null
  selectedCategory: CategoryFilter | null
  selectedFilter: ToggleFilter | null
  groupBySet: boolean
  showByColor: boolean
  selectedColor: string | null
  onEurekaSetChange: (event: SelectChangeEvent) => void
  onCategoryChange: (
    event: React.MouseEvent<HTMLElement>,
    newCategory: CategoryFilter | null
  ) => void
  onFilterChange: (event: React.MouseEvent<HTMLElement>, newFilter: ToggleFilter | null) => void
  onGroupBySetChange: () => void
  onShowByColorChange: () => void
  onColorChange: (event: SelectChangeEvent) => void
  onClearFilters: () => void
  resultsCount: number
  isLoggedIn: boolean
}) {
  return (
    <Box
      sx={{
        py: 2,
        position: 'sticky',
        top: 0,
        zIndex: 1,
        backdropFilter: 'blur(8px)',
        mask: 'linear-gradient(to bottom, black 60%, transparent 100%)',
      }}
    >
      <Container maxWidth="md">
        <Toolbar disableGutters>
          <Stack
            useFlexGap
            alignItems="center"
            direction="row"
            flexWrap="wrap"
            justifyContent="space-between"
            spacing={1}
            sx={{ flex: 1 }}
          >
            <Tooltip title="Sort by Eureka Set">
              <ToggleButton
                selected={groupBySet}
                sx={{ py: 1.75, whiteSpace: 'nowrap' }}
                value="groupBySet"
                onChange={onGroupBySetChange}
              >
                <FilterList />
              </ToggleButton>
            </Tooltip>

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
                          <CategoryIcon fontSize="inherit" />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText>{set.title}</ListItemText>
                    </ListItem>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Tooltip title="Show by Color">
              <ToggleButton
                selected={showByColor}
                sx={{ py: 1.75, whiteSpace: 'nowrap' }}
                value="showByColor"
                onChange={onShowByColorChange}
              >
                <ColorLens />
              </ToggleButton>
            </Tooltip>

            <ColorToggle
              colors={colors}
              disabled={showByColor}
              selectedColor={selectedColor}
              onColorChange={onColorChange}
            />

            {isLoggedIn && (
              <ObtainedToggle
                disabled={showByColor}
                selectedFilter={selectedFilter}
                onFilterChange={onFilterChange}
              />
            )}

            <CategoryToggle
              categories={categories}
              disabled={showByColor}
              selectedCategory={showByColor ? null : selectedCategory}
              onCategoryChange={onCategoryChange}
            />
            <Stack sx={{ flex: 1 }}>
              {(selectedEurekaSet ||
                selectedCategory ||
                selectedFilter ||
                selectedColor ||
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
          </Stack>
        </Toolbar>

        <Toolbar disableGutters>
          <Typography sx={{ px: 0.5, pb: 2 }} variant="caption">
            Showing: {resultsCount} results
          </Typography>
        </Toolbar>
      </Container>
    </Box>
  )
}
