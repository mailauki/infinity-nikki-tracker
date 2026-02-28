import { Suspense } from 'react'

import EurekaSetCard from '@/components/eureka-set-card'
import { getEurekaSets } from '@/lib/data'
import { getUserID } from '@/hooks/user'
import GridContainer from '@/components/grid-container'
import ProgressList from '@/components/progress-list'
import { Grid } from '@mui/material'

export default async function EurekaSetsPage() {
  return (
    <Suspense>
      <EurekaSets />
    </Suspense>
  )
}

async function EurekaSets() {
  const eurekaSets = await getEurekaSets()
  const categories = [...new Set(eurekaSets.flatMap((eurekaSet) => eurekaSet.categories))]
  const eureka = eurekaSets.flatMap((eurekaSet) => eurekaSet.eureka)
  const user_id = await getUserID()
  const isLoggedIn = !!user_id!

  return (
    <>
      <GridContainer
        mainContent={
          <Grid container spacing={2}>
            {eurekaSets?.map((eurekaSet) => (
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
