import { Suspense } from 'react'
import { Box, Container, Typography } from '@mui/material'
import { getAdminData } from '@/hooks/data'
import { StatCard } from '@/components/admin/stat-card'
import { DashboardTabs } from '@/components/admin/dashboard-tabs'

export default function DashboardPage() {
  return (
    <Suspense>
      <Container maxWidth="md" sx={{ flexGrow: 1, py: 3 }}>
        <AdminDashboard />
      </Container>
    </Suspense>
  )
}

async function AdminDashboard() {
  const { eurekaSets, eurekaVariants, trials } = await getAdminData()

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Typography variant="h3" component="h1">
        Admin Dashboard
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
          gap: 2,
        }}
      >
        <StatCard
          title="Eureka Sets"
          count={eurekaSets?.length ?? 0}
          addHref="/eureka-set/new"
          viewHref="/eureka-set"
        />
        <StatCard
          title="Eureka Variants"
          count={eurekaVariants?.length ?? 0}
          addHref="/eureka-variant/new"
          viewHref="/eureka-variant"
        />
        <StatCard
          title="Trials"
          count={trials?.length ?? 0}
          addHref="/trial/new"
          viewHref="/trial"
        />
      </Box>

      <DashboardTabs
        eurekaSets={eurekaSets ?? []}
        eurekaVariants={eurekaVariants ?? []}
        trials={trials ?? []}
      />
    </Box>
  )
}
