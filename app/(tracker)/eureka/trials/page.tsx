import { Suspense } from 'react'

import EurekaSetCard from '@/components/eureka-set-card'
import ProgressCard from '@/components/progress-card'
import { getEurekaSets, getTrials } from '@/lib/data'
import { EurekaSet, Total } from '@/lib/types/types'

export default async function TrialsPage() {
  return (
    <Suspense>
      <Trials />
    </Suspense>
  )
}

async function Trials() {
  const eurekaSets = await getEurekaSets()
  const trials = await getTrials()

  const totalTrials = trials?.map((trial) => ({
    ...trial,
    eurekaSets: eurekaSets.filter((eurekaSet) => eurekaSet.trial === trial.name),
  })) as Total[]

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {totalTrials?.map((trial) => (
        <div key={trial.name}>
          <ProgressCard
            key={trial.name}
            item={trial}
            imageSize={500}
            eureka={trial.eurekaSets!.flatMap((eurekaSet) => eurekaSet.eureka)}
          />
          <div className="grid grid-cols-2 gap-4 pt-4">
            {trial.eurekaSets?.map((eurekaSet: EurekaSet) => (
              <EurekaSetCard key={`${trial.name}-${eurekaSet.name}`} eurekaSet={eurekaSet} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
