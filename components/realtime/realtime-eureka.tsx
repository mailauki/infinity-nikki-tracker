'use client'

import { useEffect, useState } from 'react'

import { updateEurekaSet } from '@/hooks/eureka'
import { createClient } from '@/lib/supabase/client'
import { Category, Color, EurekaSet, Obtained } from '@/lib/types/eureka'

import FilterEureka from '@/components/eureka/filter/filter-eureka'

const supabase = createClient()

export default function RealtimeEureka({
  serverEurekaSets,
  serverCategories,
  serverColors,
  serverObtained,
  isLoggedIn,
  userId,
}: {
  serverEurekaSets: EurekaSet[]
  serverCategories: Category[]
  serverColors: Color[]
  serverObtained: Obtained[]
  isLoggedIn: boolean
  userId: string | null
}) {
  const [eurekaSets, setEurekaSets] = useState(serverEurekaSets)
  const [obtained, setObtained] = useState(serverObtained)

  useEffect(() => {
    if (!isLoggedIn) return

    const obtainedChannel = supabase
      .channel('obtained-filter-channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'obtained', filter: `user_id=eq.${userId}` },
        (payload) => {
          setObtained((prev) => [...prev, payload.new as Obtained])
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'obtained', filter: `user_id=eq.${userId}` },
        (payload) => {
          setObtained((prev) => prev.filter((item) => item.id !== payload.old.id))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(obtainedChannel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  useEffect(() => {
    const updatedEurekaSets = eurekaSets.map((set) =>
      updateEurekaSet({ eurekaSet: set, obtained: obtained })
    )

    setEurekaSets(updatedEurekaSets)

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [obtained])

  return (
    <FilterEureka
      categories={serverCategories}
      colors={serverColors}
      eurekaSets={eurekaSets}
      isLoggedIn={isLoggedIn}
    />
  )
}
