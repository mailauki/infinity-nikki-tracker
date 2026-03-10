'use client'

import { useEffect, useState } from 'react'

import { updateEurekaSet } from '@/hooks/eureka'
import { createClient } from '@/lib/supabase/client'
import { Category, EurekaSet, Obtained } from '@/lib/types/eureka'

import FilterEureka from '@/components/filter-eureka'

const supabase = createClient()

export default function RealtimeEureka({
  serverEurekaSets,
  serverCategories,
  serverObtained,
  isLoggedIn,
  userId,
}: {
  serverEurekaSets: EurekaSet[]
  serverCategories: Category[]
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
    <FilterEureka eurekaSets={eurekaSets} categories={serverCategories} isLoggedIn={isLoggedIn} />
  )
}
