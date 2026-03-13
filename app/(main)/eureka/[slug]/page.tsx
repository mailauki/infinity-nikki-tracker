import { Suspense } from 'react'

import RealtimeEurekaSet from '@/components/realtime/realtime-eureka-set'
import { getUserID } from '@/hooks/user'
import { getEurekaSet } from '@/hooks/data/eureka-sets'
import { getObtainedEureka } from '@/hooks/data/obtained-eureka'
import { Container, Stack } from '@mui/material'
import type { Metadata } from 'next'

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params

  const eureka = await getEurekaSet(slug)

  return { title: eureka.title }
}

export default async function EurekaSetPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  return (
    <Suspense>
      <EurekaSet slug={slug} />
    </Suspense>
  )
}

async function EurekaSet({ slug }: { slug: string }) {
  const eurekaSet = await getEurekaSet(slug)
  const user_id = await getUserID()
  const obtainedEureka = user_id ? await getObtainedEureka(user_id) : []
  const isLoggedIn = !!user_id!

  return (
    <Container maxWidth="md" sx={{ flexGrow: 1, py: 3 }}>
      <Stack spacing={3}>
        <RealtimeEurekaSet
          isLoggedIn={isLoggedIn}
          serverEurekaSet={eurekaSet}
          serverObtainedEureka={obtainedEureka || []}
          userId={user_id ?? null}
        />
      </Stack>
    </Container>
  )
}
