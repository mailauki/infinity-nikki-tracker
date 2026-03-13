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
      <Container maxWidth="md" sx={{ flexGrow: 1, py: 3 }}>
        <Box
          sx={{
            display: { xs: 'none', md: 'grid' },
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 2,
            pt: 4,
          }}
        >
          <StatCard addHref="/eureka-set/new" count={eurekaSets?.length ?? 0} title="Eureka Sets" />
          <StatCard
            addHref="/eureka-variant/new"
            count={eurekaVariants?.length ?? 0}
            title="Eureka Variants"
          />
          <StatCard addHref="/trial/new" count={trials?.length ?? 0} title="Trials" />
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
