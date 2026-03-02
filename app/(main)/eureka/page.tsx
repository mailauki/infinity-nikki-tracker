import { Suspense } from 'react'

import { Container, Grid } from '@mui/material'

import EurekaSetCard from '@/components/eureka/eureka-set-card'
import GridContainer from '@/components/grid-container'
import ProgressList from '@/components/progress-list'
import { getEurekaSets } from '@/lib/data'
import { getUserID } from '@/hooks/user'
import LoginAlert from '@/components/login-alert'

export default async function EurekaSetsPage() {
  return (
    <Suspense>
      <Container maxWidth="md" sx={{ flexGrow: 1, py: 3 }}>
        <EurekaSets />
      </Container>
    </Suspense>
  )
}

async function EurekaSets() {
  const eurekaSets = await getEurekaSets()
  const categories = [...new Set(eurekaSets.flatMap((eurekaSet) => eurekaSet.categories))]
  const eureka = eurekaSets.flatMap((eurekaSet) => eurekaSet.eureka_variants)
  const user_id = await getUserID()
  const isLoggedIn = !!user_id!

  return (
    <>
      {!isLoggedIn && <LoginAlert />}
      <GridContainer
        mainContent={
          <Grid container spacing={2}>
            {eurekaSets.map((eurekaSet) => (
              <Grid key={eurekaSet.name} size={{ xs: 12, md: 6 }}>
                <EurekaSetCard eurekaSet={eurekaSet} isLoggedIn={isLoggedIn} />
              </Grid>
            ))}
          </Grid>
        }
        sideContent={<ProgressList items={categories} eureka={eureka} filter="categories" />}
      />
    </>
  )
}
