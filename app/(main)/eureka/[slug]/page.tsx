import { Suspense } from 'react'

import RealtimeEurekaSet from '@/components/realtime-eureka-set'
import { getUserID } from '@/hooks/user'
import { getEurekaSet, getObtained } from '@/lib/data'

export async function generateStaticParams() {
  return [{ slug: 'hello-world' }]
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
  const obtained = await getObtained(user_id!)
  const isLoggedIn = !!user_id!

  return (
    <RealtimeEurekaSet serverEurekaSet={eurekaSet} serverObtained={obtained || []} isLoggedIn={isLoggedIn} />
  )
}
