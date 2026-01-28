import { Suspense } from 'react'

import EurekaSetCard from '@/components/eureka-set-card'
import ProgressCard from '@/components/progress-card'
import { getEurekaSets } from '@/lib/data'

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
  // const colors = [...new Set(eurekaSets.flatMap((eurekaSet) => eurekaSet.colors))]
  const eureka = eurekaSets.flatMap((eurekaSet) => eurekaSet.eureka)
  const hasObtained = Object.keys(eureka[0]).includes('obtained') // used to determine if user is logged in or not

  return (
    <>
      {hasObtained && (
        <div className="grid grid-cols-3 gap-4 p-4">
          {categories.map((category) => (
            <ProgressCard key={category.name} item={category} eureka={eureka} />
          ))}
        </div>
      )}
      <div className="grid grid-cols-2 gap-4 p-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {eurekaSets?.map((eurekaSet) => (
          <EurekaSetCard key={eurekaSet.name} eurekaSet={eurekaSet} />
        ))}
      </div>
    </>
  )
}
