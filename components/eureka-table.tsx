'use client'

import { EurekaSet } from '@/lib/types/types'

import EurekaButton from './eureka-button'

export default function EurekaTable({ eurekaSet, user }: { eurekaSet: EurekaSet; user: boolean }) {
  return (
    <div className="grid grid-cols-3 grid-rows-5 gap-4 pb-16">
      {eurekaSet.eureka.map((eureka) => (
        <EurekaButton key={eureka.id} eureka={eureka} user={user} />
      ))}
    </div>
  )
}
