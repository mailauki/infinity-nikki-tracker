import { Suspense } from 'react'
import { Box, Container } from '@mui/material'
import { StatCard } from '@/components/admin/stat-card'
import { DashboardTabs } from '@/components/admin/dashboard-tabs'
import { getAdminData } from '@/hooks/data/user'
import { getEurekaSets } from '@/hooks/data/eureka-sets'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard',
}

export default function DashboardPage() {
  return (
    <Suspense>
      <AdminDashboard />
    </Suspense>
  )
}

async function AdminDashboard() {
  const eurekaSets = await getEurekaSets()
  const { eurekaVariants, trials } = await getAdminData()

  return (
    <>
      <Container maxWidth="md">
        <Box
          sx={{
            display: { xs: 'none', md: 'grid' },
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 2,
            pt: 4,
          }}
        >
          <StatCard title="Eureka Sets" count={eurekaSets?.length ?? 0} addHref="/eureka-set/new" />
          <StatCard
            title="Eureka Variants"
            count={eurekaVariants?.length ?? 0}
            addHref="/eureka-variant/new"
          />
          <StatCard title="Trials" count={trials?.length ?? 0} addHref="/trial/new" />
        </Box>
      </Container>

      <DashboardTabs
        eurekaSets={eurekaSets ?? []}
        eurekaVariants={eurekaVariants ?? []}
        trials={trials ?? []}
      />
    </>
  )
}
