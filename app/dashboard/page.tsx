import { Suspense } from 'react'
import { getAdminData } from '@/hooks/data/user'
import { getEurekaSets } from '@/hooks/data/eureka-sets'
import { getUserRole } from '@/hooks/user'
import { Metadata } from 'next'
import { Box } from '@mui/material'
import { StatCard } from './stat-card'
import DashboardNav from './dashboard-nav'

export const metadata: Metadata = {
  title: 'Dashboard',
}

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardContent />
    </Suspense>
  )
}

async function DashboardContent() {
  const [eurekaSets, { eurekaVariants, trials }, role] = await Promise.all([
    getEurekaSets(),
    getAdminData(),
    getUserRole(),
  ])

  const isAdmin = role === 'admin'

  return (
    <>
      {isAdmin && <DashboardNav />}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
          gap: 2,
          pt: 4,
        }}
      >
        <StatCard
          addHref={isAdmin ? '/eureka-set/new' : undefined}
          count={eurekaSets?.length ?? 0}
          title="Eureka Sets"
        />
        <StatCard
          addHref={isAdmin ? '/eureka-variant/new' : undefined}
          count={eurekaVariants?.length ?? 0}
          title="Eureka Variants"
        />
        <StatCard
          addHref={isAdmin ? '/trial/new' : undefined}
          count={trials?.length ?? 0}
          title="Trials"
        />
      </Box>
    </>
  )
}
