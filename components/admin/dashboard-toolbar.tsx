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
      <Container maxWidth="md" sx={{ pb: 2 }}>
        <Toolbar disableGutters>
          <Stack
            useFlexGap
            direction="row"
            flexWrap="wrap"
            justifyContent="space-between"
            spacing={1}
            sx={{ flex: 1 }}
          >
            <ToggleButtonGroup
              exclusive
              sx={{ whiteSpace: 'nowrap' }}
              value={tab}
              onChange={handleTabChange}
            >
              <ToggleButton aria-label="Eureka Sets" value="eureka-sets">
                Eureka Sets
              </ToggleButton>
              <ToggleButton aria-label="Eureka Variants" value="eureka-variants">
                Eureka Variants
              </ToggleButton>
              <ToggleButton aria-label="Trials" value="trials">
                Trials
              </ToggleButton>
            </ToggleButtonGroup>

            <Stack direction="row" justifyContent="flex-end" sx={{ flex: 1 }}>
              <ToggleButtonGroup exclusive value={view} onChange={handleViewChange}>
                <Tooltip title="List view">
                  <ToggleButton aria-label="list" value="list">
                    <ViewList />
                  </ToggleButton>
                </Tooltip>
                <Tooltip title="Table view">
                  <ToggleButton aria-label="table" value="table">
                    <ViewHeadline />
                  </ToggleButton>
                </Tooltip>
              </ToggleButtonGroup>
            </Stack>
          </Stack>
        </Toolbar>
      </Container>
    </Box>
  )
}
