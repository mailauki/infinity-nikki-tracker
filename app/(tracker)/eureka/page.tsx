import { Suspense } from 'react'

import EurekaSetCard from '@/components/eureka-set-card'
import ProgressCard from '@/components/progress-card'
import { getEurekaSets } from '@/lib/data'
import { getUserID } from '@/hooks/user'

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
	const user = !!(user_id!)

  return (
		<>
      {user && (
        <div className="grid grid-cols-3 gap-4 pb-4">
          {categories.map((category) => (
            <ProgressCard key={category.name} item={category} eureka={eureka} user={user} />
          ))}
        </div>
      )}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {eurekaSets?.map((eurekaSet) => (
          <EurekaSetCard key={eurekaSet.name} eurekaSet={eurekaSet} user={user} />
        ))}
			</div>
		</>
  )
}
