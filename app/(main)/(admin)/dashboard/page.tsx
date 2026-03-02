import { Suspense } from 'react'
import { Box, Chip, Container, Typography } from '@mui/material'
import { toSlug, toSlugVariant } from '@/lib/utils'
import { getAdminData, getEurekaVariants, getTrialsAdmin } from '@/lib/data'
import { DashboardList } from '@/components/admin/dashboard-list'
import { StatCard } from '@/components/admin/stat-card'

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
  const [{ eurekaSets }, eurekaVariants, trials] = await Promise.all([
    getAdminData(),
    getEurekaVariants(),
    getTrialsAdmin(),
  ])

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

      <DashboardList
        title="Recently Updated Eureka Sets"
        viewHref="/eureka-set"
        items={(eurekaSets ?? []).slice(0, 5).map((set) => ({
          key: set.id,
          href: `/eureka-set/edit/${set.slug ?? toSlug(set.name)}`,
          primary: set.name,
          secondary: set.updated_at
            ? new Date(set.updated_at).toLocaleDateString(undefined, { dateStyle: 'medium' })
            : '—',
        }))}
      />

      <DashboardList
        title="Recently Added Eureka Variants"
        viewHref="/eureka-variant"
        items={[...(eurekaVariants ?? [])]
          .sort((a, b) => b.id - a.id)
          .slice(0, 5)
          .map((variant) => ({
            key: variant.id,
            href: `/eureka-variant/edit/${variant.slug ?? toSlugVariant(variant.eureka_set ?? '', variant.category ?? '', variant.color ?? '')}`,
            primary: variant.eureka_set ?? '',
            secondary: [variant.category, variant.color].filter(Boolean).join(' • '),
            secondaryAction: variant.default ? (
              <Chip size="small" label="default" color="secondary" variant="outlined" />
            ) : undefined,
          }))}
      />

      <DashboardList
        title="Recently Added Trials"
        viewHref="/trial"
        items={[...(trials ?? [])]
          .sort((a, b) => b.id - a.id)
          .slice(0, 5)
          .map((trial) => ({
            key: trial.id,
            href: `/trial/edit/${trial.slug ?? toSlug(trial.name)}`,
            primary: trial.name,
            secondary: trial.created_at
              ? new Date(trial.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })
              : '—',
          }))}
      />
    </Box>
  )
}
