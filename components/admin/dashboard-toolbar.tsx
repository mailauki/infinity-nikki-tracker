import { ViewList, ViewHeadline } from '@mui/icons-material'
import { Stack, ToggleButton, ToggleButtonGroup, Toolbar, Tooltip } from '@mui/material'

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
    <Toolbar
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 'appBar',
        backdropFilter: 'blur(8px)',
        bgcolor: 'background.default',
        mt: -3,
        mx: -3,
        py: 1.5,
      }}
    >
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
          sx={{ whiteSpace: 'nowrap', height: 'fit-content', pt: 1 }}
          value={tab}
          onChange={handleTabChange}
        >
          <ToggleButton aria-label="Eureka Sets" sx={{ py: 0.75 }} value="eureka-sets">
            Eureka Sets
          </ToggleButton>
          <ToggleButton aria-label="Eureka Variants" sx={{ py: 0.75 }} value="eureka-variants">
            Eureka Variants
          </ToggleButton>
          <ToggleButton aria-label="Trials" sx={{ py: 0.75 }} value="trials">
            Trials
          </ToggleButton>
        </ToggleButtonGroup>

        <Stack direction="row" justifyContent="flex-end" sx={{ flex: 1 }}>
          <ToggleButtonGroup
            exclusive
            sx={{ height: 'fit-content' }}
            value={view}
            onChange={handleViewChange}
          >
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
  )
}
