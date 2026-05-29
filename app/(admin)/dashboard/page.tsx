import { Suspense } from 'react'
import { getAdminData } from '@/hooks/data/user'
import { getEurekaSets } from '@/hooks/data/eureka-sets'
import { Metadata } from 'next'
import { Box } from '@mui/material'
import { StatCard } from './stat-card'

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
  const [eurekaSets, { eurekaVariants, trials }] = await Promise.all([
    getEurekaSets(),
    getAdminData(),
  ])

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
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
  )
}
