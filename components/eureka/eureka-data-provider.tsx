'use client'

import { useEffect, useState } from 'react'

import { updateEurekaSet } from '@/hooks/eureka'
import { createClient } from '@/lib/supabase/client'
import { Category, Color, EurekaSet, ObtainedEureka, Trial } from '@/lib/types/eureka'

import { EurekaDataContext } from './eureka-context'

const supabase = createClient()

async function fetchJson<T>(url: string): Promise<T> {
  const r = await fetch(url)
  if (!r.ok) throw new Error(`${url} returned ${r.status}`)
  return r.json()
}

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
  const [isError, setIsError] = useState(false)
  const [isObtainedError, setIsObtainedError] = useState(false)

  useEffect(() => {
    Promise.all([
      fetchJson<EurekaSet[]>('/api/eureka'),
      fetchJson<Category[]>('/api/categories'),
      fetchJson<Color[]>('/api/colors'),
      fetchJson<Trial[]>('/api/trials'),
    ])
      .then(([sets, cats, cols, trls]) => {
        setEurekaSets(sets)
        setCategories(cats)
        setColors(cols)
        setTrials(trls)
        setIsLoading(false)
      })
      .catch((err) => {
        console.error('Failed to load eureka data:', err)
        setIsError(true)
        setIsLoading(false)
      })
  }, [])

  useEffect(() => {
    if (!isLoggedIn) return

    fetchJson<ObtainedEureka[]>('/api/obtained-eureka')
      .then((data) => setObtainedEureka(data))
      .catch((err) => {
        console.error('Failed to load obtained eureka:', err)
        setIsObtainedError(true)
      })

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
        isError,
        isObtainedError,
        userId,
      }}
    >
      {children}
    </EurekaDataContext.Provider>
  )
}
