import SubAppBar from '@/components/sub-appbar'
import { Stack } from '@mui/material'
import DashboardNavTabs from './dashboard-nav-tabs'
import DashboardViewToggle from './dashboard-view-toggle'

export default function DashboardToolBar() {
  return (
    <SubAppBar>
      <Stack sx={{ flex: 1, borderBottom: 1, borderColor: 'divider' }}>
        <Stack alignItems="center" direction="row" justifyContent="space-between">
          <DashboardNavTabs />
          <DashboardViewToggle />
        </Stack>
      </Stack>
    </SubAppBar>
  )
}
