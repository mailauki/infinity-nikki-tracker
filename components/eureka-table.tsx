'use client'

import { EurekaSet } from '@/lib/types/types'

import EurekaButton from './eureka-button'

export default function EurekaTable({
  eurekaSet,
  isLoggedIn,
}: {
  eurekaSet: EurekaSet
  isLoggedIn: boolean
}) {
  return (
    <div className="grid grid-cols-3 grid-rows-5 gap-4 pb-16">
      {eurekaSet.eureka.map((eureka) => (
        <EurekaButton key={eureka.id} eureka={eureka} isLoggedIn={isLoggedIn} />
      ))}
    </div>
  )
}
