'use client'

import { useEffect, useState } from 'react'

import { updateEurekaSet } from '@/hooks/eureka'
import { createClient } from '@/lib/supabase/client'
import { Category, Color, EurekaSet, ObtainedEureka } from '@/lib/types/eureka'

import FilterEureka from '@/components/eureka/filter/filter-eureka'

const supabase = createClient()

export default function RealtimeEureka({
  serverEurekaSets,
  serverCategories,
  serverColors,
  serverObtainedEureka,
  isLoggedIn,
  userId,
}: {
  serverEurekaSets: EurekaSet[]
  serverCategories: Category[]
  serverColors: Color[]
  serverObtainedEureka: ObtainedEureka[]
  isLoggedIn: boolean
  userId: string | null
}) {
  const [obtainedEureka, setObtainedEureka] = useState(serverObtainedEureka)

  useEffect(() => {
    if (!isLoggedIn) return

    const obtainedChannel = supabase
      .channel('obtained-filter-channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'obtained', filter: `user_id=eq.${userId}` },
        (payload) => {
          setObtainedEureka((prev) => [...prev, payload.new as ObtainedEureka])
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'obtained', filter: `user_id=eq.${userId}` },
        (payload) => {
          setObtainedEureka((prev) => prev.filter((item) => item.id !== payload.old.id))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(obtainedChannel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const eurekaSets = serverEurekaSets.map((set) => updateEurekaSet({ eurekaSet: set, obtainedEureka }))

  return (
    <FilterEureka
      categories={serverCategories}
      colors={serverColors}
      eurekaSets={eurekaSets}
      isLoggedIn={isLoggedIn}
    />
  )
}
