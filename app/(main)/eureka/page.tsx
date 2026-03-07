import { Suspense } from 'react'

import { Box, Card, Container, List } from '@mui/material'

import EurekaSetCard from '@/components/eureka/eureka-set-card'
import GridContainer from '@/components/grid-container'
import { getUserID } from '@/hooks/user'
import LoginAlert from '@/components/login-alert'
import { Category } from '@/lib/types/eureka'
import { CategoryItem } from '@/components/eureka/category-item'
import { getEurekaSets } from '@/hooks/data/eureka-sets'

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
  const seen = new Set<string>()
  const categories = eurekaSets
    .flatMap((eurekaSet) => eurekaSet.categories)
    .filter((cat) => !seen.has(cat.title) && seen.add(cat.title))
  const eurekaVariants = eurekaSets.flatMap((eurekaSet) => eurekaSet.eureka_variants)
  const user_id = await getUserID()
  const isLoggedIn = !!user_id

  return (
    <>
      {!isLoggedIn && <LoginAlert />}
      <GridContainer
        mainContent={
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
              gap: 2,
            }}
          >
            {eurekaSets.map((eurekaSet) => (
              <EurekaSetCard key={eurekaSet.title} eurekaSet={eurekaSet} isLoggedIn={isLoggedIn} />
            ))}
          </Box>
        }
        sideContent={
          isLoggedIn && (
            <List sx={{ width: '100%' }}>
              {categories.map((category: Category) => (
                <Card key={category.title} elevation={0} component="li">
                  <CategoryItem item={category} eurekaVariants={eurekaVariants} />
                </Card>
              ))}
            </List>
          )
        }
      />
    </>
  )
}
