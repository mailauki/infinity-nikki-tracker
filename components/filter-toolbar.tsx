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
  OutlinedInput,
  Select,
  SelectChangeEvent,
  Stack,
  ToggleButton,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material'
import CategoryToggle from './category-toggle'
import { Category, EurekaSet } from '@/lib/types/eureka'
import { CategoryFilter, ToggleFilter } from '@/lib/types/props'
import { Clear, ColorLens, FilterList, Category as CategoryIcon } from '@mui/icons-material'
import ObtainedToggle from './obtained-toggle'

export default function FilterToolbar({
  eurekaSets,
  categories,
  selectedEurekaSet,
  selectedCategory,
  selectedFilter,
  groupBySet,
  showByColor,
  onEurekaSetChange,
  onCategoryChange,
  onFilterChange,
  onGroupBySetChange,
  onShowByColorChange,
  onClearFilters,
  resultsCount,
  isLoggedIn,
}: {
  eurekaSets: EurekaSet[]
  categories: Category[]
  selectedEurekaSet: string | null
  selectedCategory: CategoryFilter | null
  selectedFilter: ToggleFilter | null
  groupBySet: boolean
  showByColor: boolean
  onEurekaSetChange: (event: SelectChangeEvent) => void
  onCategoryChange: (
    event: React.MouseEvent<HTMLElement>,
    newCategory: CategoryFilter | null
  ) => void
  onFilterChange: (event: React.MouseEvent<HTMLElement>, newFilter: ToggleFilter | null) => void
  onGroupBySetChange: () => void
  onShowByColorChange: () => void
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
            direction="row"
            spacing={1}
            alignItems="center"
            justifyContent="space-between"
            flexWrap="wrap"
            useFlexGap
            sx={{ flex: 1 }}
          >
            <Tooltip title="Sort by Eureka Set">
              <ToggleButton
                value="groupBySet"
                selected={groupBySet}
                onChange={onGroupBySetChange}
                sx={{ py: 1.75, whiteSpace: 'nowrap' }}
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
                labelId="eureka-set-select-label"
                id="eureka-set-select"
                value={selectedEurekaSet ?? ''}
                aria-label="Eureka Set"
                label="Eureka Set"
                onChange={onEurekaSetChange}
                sx={{ '& .MuiOutlinedInput-input': { py: selectedEurekaSet && 1 } }}
              >
                <MenuItem value="">—</MenuItem>
                {eurekaSets.map((set) => (
                  <MenuItem key={set.slug} value={set.slug!}>
                    <ListItem disablePadding component="div">
                      <ListItemAvatar>
                        <Avatar size="sm" src={set.image_url} alt={set.title}>
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
                value="showByColor"
                selected={showByColor}
                onChange={onShowByColorChange}
                sx={{ py: 1.75, whiteSpace: 'nowrap' }}
              >
                <ColorLens />
              </ToggleButton>
            </Tooltip>

            {isLoggedIn && (
              <ObtainedToggle
                selectedFilter={selectedFilter}
                onFilterChange={onFilterChange}
                disabled={showByColor}
              />
            )}

            <CategoryToggle
              categories={categories}
              selectedCategory={showByColor ? null : selectedCategory}
              onCategoryChange={onCategoryChange}
              disabled={showByColor}
            />
            <Stack sx={{ flex: 1 }}>
              {(selectedEurekaSet || selectedCategory || selectedFilter || showByColor) && (
                <Box alignSelf="flex-end">
                  <Tooltip title="Clear filters">
                    <IconButton onClick={onClearFilters} aria-label="Clear filters">
                      <Clear />
                    </IconButton>
                  </Tooltip>
                </Box>
              )}
            </Stack>
          </Stack>
        </Toolbar>

        <Toolbar disableGutters>
          <Typography variant="caption" sx={{ px: 0.5, pb: 2 }}>
            Showing: {resultsCount} results
          </Typography>
        </Toolbar>
      </Container>
    </Box>
  )
}
