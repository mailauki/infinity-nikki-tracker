import { Suspense } from 'react'

import RealtimeEurekaSet from '@/components/realtime/realtime-eureka-set'
import { getUserID } from '@/hooks/user'
import { getEurekaSet } from '@/hooks/data/eureka-sets'
import { getObtained } from '@/hooks/data/obtained-eureka'
import type { Metadata } from 'next'
import PageContainer from '@/components/page-container'

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata(
  { params }: Props,
): Promise<Metadata> {
  const slug = (await params).slug

  // fetch post information
	const eureka = await getEurekaSet(slug)

  return {
    title: eureka.title,
  }
}

export default async function EurekaSetPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  return (
    <Suspense>
			<PageContainer title='Eureka Set'>
				<EurekaSet slug={slug} />
			</PageContainer>
    </Suspense>
  )
}

async function EurekaSet({ slug }: { slug: string }) {
  const eurekaSet = await getEurekaSet(slug)
  const user_id = await getUserID()
  const obtained = user_id ? await getObtained(user_id) : []
  const isLoggedIn = !!user_id!

  return (
    <RealtimeEurekaSet
      serverEurekaSet={eurekaSet}
      serverObtained={obtained || []}
      isLoggedIn={isLoggedIn}
      userId={user_id ?? null}
    />
  )
}
