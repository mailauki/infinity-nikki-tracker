import { ViewList, ViewHeadline } from '@mui/icons-material'
import {
  Box,
  Container,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Toolbar,
  Tooltip,
} from '@mui/material'

export default function DashboardToolbar({
  tab,
  handleTabChange,
  view,
  handleViewChange,
}: {
  tab: string
  handleTabChange: (_: React.MouseEvent<HTMLElement>, value: string) => void
  view: string
  handleViewChange: (_: React.MouseEvent<HTMLElement>, nextView: 'list' | 'table') => void
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
          <Stack direction="row" justifyContent="space-between" sx={{ flex: 1 }}>
            <ToggleButtonGroup value={tab} onChange={handleTabChange} exclusive>
              <ToggleButton value="eureka-sets" aria-label="Eureka Sets">
                Eureka Sets
              </ToggleButton>
              <ToggleButton value="eureka-variants" aria-label="Eureka Variants">
                Eureka Variants
              </ToggleButton>
              <ToggleButton value="trials" aria-label="Trials">
                Trials
              </ToggleButton>
            </ToggleButtonGroup>

            <ToggleButtonGroup value={view} onChange={handleViewChange} exclusive>
              <Tooltip title="List view">
                <ToggleButton value="list" aria-label="list">
                  <ViewList />
                </ToggleButton>
              </Tooltip>
              <Tooltip title="Table view">
                <ToggleButton value="table" aria-label="table">
                  <ViewHeadline />
                </ToggleButton>
              </Tooltip>
            </ToggleButtonGroup>
          </Stack>
        </Toolbar>
      </Container>
    </Box>
  )
}
