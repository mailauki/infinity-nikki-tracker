'use client'

import { useEffect, useState } from 'react'

import { updateEurekaSet } from '@/hooks/eureka'
import { createClient } from '@/lib/supabase/client'
import { Category, Color, EurekaSet, ObtainedEureka, Trial } from '@/lib/types/eureka'

import { EurekaDataContext } from './eureka-context'

const supabase = createClient()

export default function EurekaDataProvider({
  isLoggedIn,
  userId,
  children,
}: {
  isLoggedIn: boolean
  userId: string | null
  children: React.ReactNode
}) {
  const [eurekaSets, setEurekaSets] = useState<EurekaSet[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [colors, setColors] = useState<Color[]>([])
  const [trials, setTrials] = useState<Trial[]>([])
  const [obtainedEureka, setObtainedEureka] = useState<ObtainedEureka[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/eureka').then((r) => r.json()),
      fetch('/api/categories').then((r) => r.json()),
      fetch('/api/colors').then((r) => r.json()),
      fetch('/api/trials').then((r) => r.json()),
    ])
      .then(([sets, cats, cols, trls]) => {
        setEurekaSets(sets)
        setCategories(cats)
        setColors(cols)
        setTrials(trls)
        setIsLoading(false)
      })
      .catch(console.error)
  }, [])

  useEffect(() => {
    if (!isLoggedIn) return

    fetch('/api/obtained-eureka')
      .then((r) => r.json())
      .then((data: ObtainedEureka[]) => setObtainedEureka(data))
      .catch(console.error)

    const obtainedChannel = supabase
      .channel('obtained-filter-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'obtained_eureka',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setObtainedEureka((prev) => [...prev, payload.new as ObtainedEureka])
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'obtained_eureka',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setObtainedEureka((prev) =>
            prev.filter((obtainedEureka) => obtainedEureka.id !== payload.old.id)
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(obtainedChannel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const eurekaSetsWithObtained = eurekaSets.map((set) =>
    updateEurekaSet({ eurekaSet: set, obtainedEureka })
  )

  return (
    <EurekaDataContext.Provider
      value={{
        eurekaSets: eurekaSetsWithObtained,
        categories,
        colors,
        trials,
        isLoggedIn,
        isLoading,
        userId,
      }}
    >
      {children}
    </EurekaDataContext.Provider>
  )
}
