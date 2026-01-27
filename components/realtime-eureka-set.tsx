'use client'

import { useEffect, useState } from 'react'

import { updateEurekaSet } from '@/hooks/eureka-set'
import { createClient } from '@/lib/supabase/client'
import { EurekaSet, Obtained } from '@/lib/types/types'

import EurekaHeader from './eureka-header'
import EurekaTable from './eureka-table'
import ProgressCard from './progress-card'

const supabase = createClient()

export default function RealtimeEurekaSet({
  serverEurekaSet,
  serverObtained,
}: {
  serverEurekaSet: EurekaSet
  serverObtained: Obtained[]
}) {
  const [eurekaSet, setEurekaSet] = useState(serverEurekaSet)
  const [obtained, setObtained] = useState(serverObtained)
  const hasObtained = Object.keys(eurekaSet.eureka[0]).includes('obtained')

  useEffect(() => {
    const obtainedChannel = supabase
      .channel('obtained-insert-channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'obtained' }, (payload) => {
        setObtained([...obtained, payload.new as Obtained])
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'obtained' }, (payload) => {
        setObtained(obtained.filter((item) => item.id !== payload.old.id))
      })
      .subscribe()

    return () => {
      supabase.removeChannel(obtainedChannel)
    }
  }, [obtained])

  useEffect(() => {
    const updatedEurekaSet = updateEurekaSet({ eurekaSet, obtained })

    setEurekaSet(updatedEurekaSet)

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [obtained])

  return (
    <>
      <EurekaHeader eurekaSet={eurekaSet} variant="large" />
      {hasObtained && (
        <div className="grid grid-cols-3 gap-4">
          {eurekaSet.categories.map((category) => (
            <ProgressCard key={`${eurekaSet.name}-${category.name}`} item={category} eureka={eurekaSet.eureka} />
          ))}
        </div>
      )}
      <div className="grid grid-cols-3 gap-4 md:grid-cols-5">
        {eurekaSet.colors.map((color) => (
          <ProgressCard key={`${eurekaSet.name}-${color.name}`} item={color} imageSize={20} eureka={eurekaSet.eureka} />
        ))}
      </div>
      <EurekaTable eurekaSet={eurekaSet} hasObtained={hasObtained} />
    </>
  )
}
