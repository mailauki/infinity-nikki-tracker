import { Suspense } from 'react'

import { getEurekaSets, getObtained } from '@/lib/data'
import EurekaFilter from '@/components/eureka-filter'
import { getUserID } from '@/hooks/user'
import RealtimeEurekaFilter from '@/components/realtime-eureka-filter'

export default async function MissingPage() {
  return (
    <Suspense>
      <Missing />
    </Suspense>
  )
}

async function Missing() {
  const eurekaSets = await getEurekaSets()
  const categories = [...new Set(eurekaSets.flatMap((eurekaSet) => eurekaSet.categories))]
	const user_id = await getUserID()
	const user = !!(user_id!)
	const obtained = await getObtained(user_id!)
	const eureka = eurekaSets.flatMap((eurekaSet) => eurekaSet.eureka)

  if (!user)
    return (
      <div className="mt-10 flex flex-col items-center">
        <p className="max-w-sm text-center text-2xl">
          Sign in or Sign up <br />
          to track your missing Eureka
        </p>
      </div>
    )
  return <RealtimeEurekaFilter serverEureka={eureka} serverCategories={categories} serverObtained={obtained || []} user={user} />
}
