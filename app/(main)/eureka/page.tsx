import { Suspense } from 'react'

import { getUserID } from '@/hooks/user'
import LoginAlert from '@/components/login-alert'
import { getEurekaSets } from '@/hooks/data/eureka-sets'
import { Metadata } from 'next'
import PageContainer from '@/components/page-container'
import FilterEureka from '@/components/filter-eureka'

export const metadata: Metadata = {
  title: 'Eureka Sets',
}

export default async function EurekaSetsPage() {
  return (
    <Suspense>
      <PageContainer title="Eureka Sets">
        <EurekaSets />
      </PageContainer>
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
      {/* <GridContainer
        mainContent={
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: '1fr 1fr',
                md: isLoggedIn ? '1fr 1fr' : '1fr 1fr 1fr',
              },
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
                <Card
                  key={category.title}
                  elevation={0}
                  component="li"
                  sx={{ backgroundColor: 'transparent' }}
                >
                  <CategoryItem item={category} eurekaVariants={eurekaVariants} />
                </Card>
              ))}
            </List>
          )
        }
      /> */}
      <FilterEureka eurekaSets={eurekaSets} categories={categories} />
      {/* {eurekaSets.map((set) => (
				<Card key={set.id}>
					<CardContent>
						<Avatar src={set.image_url} size='lg'>
							<CategoryIcon />
						</Avatar>
						<Typography variant="subtitle1">
							{set.title}
						</Typography>
						<Typography variant="caption" color="textSecondary">
							{set.rarity ? <RarityStars rarity={set.rarity} /> : set.trial}
						</Typography>
						<Typography variant="subtitle1">
							{set.colors.map((color) => color.title).join(', ')}
						</Typography>
					</CardContent>
				</Card>
			))} */}
      {/* {eurekaVariants.map((variant) => (
				<Card key={variant.id}>
					<CardContent>
						<Avatar src={variant.image_url} size='lg'>
							<CategoryIcon />
						</Avatar>
						<Typography variant="subtitle1">
							{variant.eureka_set}
						</Typography>
						<Typography variant="caption" color="textSecondary">
							{variant.category} • {variant.color}
						</Typography>
					</CardContent>
				</Card>
			))} */}
    </>
  )
}
