'use client'

import { useEffect, useState } from 'react'

import { updateEurekaSet } from '@/hooks/eureka'
import { createClient } from '@/lib/supabase/client'
import { Category, Color, EurekaSet, ObtainedEureka } from '@/lib/types/eureka'

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
  const [obtainedEureka, setObtainedEureka] = useState<ObtainedEureka[]>([])

  useEffect(() => {
    Promise.all([
      fetch('/api/eureka').then((r) => r.json()),
      fetch('/api/categories').then((r) => r.json()),
      fetch('/api/colors').then((r) => r.json()),
    ]).then(([sets, cats, cols]) => {
      setEurekaSets(sets)
      setCategories(cats)
      setColors(cols)
    })
  }, [])

  useEffect(() => {
    if (!isLoggedIn) return

    const obtainedChannel = supabase
      .channel('obtained-filter-channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'obtained_eureka', filter: `user_id=eq.${userId}` },
        (payload) => {
          setObtainedEureka((prev) => [...prev, payload.new as ObtainedEureka])
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'obtained_eureka', filter: `user_id=eq.${userId}` },
        (payload) => {
          setObtainedEureka((prev) => prev.filter((obtainedEureka) => obtainedEureka.id !== payload.old.id))
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
      value={{ eurekaSets: eurekaSetsWithObtained, categories, colors, isLoggedIn, userId }}
    >
      {children}
    </EurekaDataContext.Provider>
  )
}
