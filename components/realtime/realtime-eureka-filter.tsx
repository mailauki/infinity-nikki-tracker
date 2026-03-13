'use client'

import { useEffect, useState } from 'react'

import { updateEurekaVariants } from '@/hooks/eureka'
import { createClient } from '@/lib/supabase/client'
import { Category, EurekaVariant, ObtainedEureka } from '@/lib/types/eureka'

import EurekaFilter from '@/components/eureka/eureka-filter'

const supabase = createClient()

export default function RealtimeEurekaFilter({
  serverEurekaVariants,
  serverCategories,
  serverObtainedEureka,
  isLoggedIn,
  userId,
}: {
  serverEurekaVariants: EurekaVariant[]
  serverCategories: Category[]
  serverObtainedEureka: ObtainedEureka[]
  isLoggedIn: boolean
  userId: string | null
}) {
  const [eurekaVariants, setEurekaVariants] = useState(serverEurekaVariants)
  const [obtainedEureka, setObtainedEureka] = useState(serverObtainedEureka)

  useEffect(() => {
    if (!userId) return

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
          setObtainedEureka((prev) => prev.filter((item) => item.id !== payload.old.id))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(obtainedChannel)
    }
  }, [userId])

  useEffect(() => {
    const updatedEurekaVariants = updateEurekaVariants({ eurekaVariants, obtainedEureka })

    setEurekaVariants(updatedEurekaVariants)

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [obtainedEureka])

  return (
    <EurekaFilter
      categories={serverCategories}
      eurekaVariants={eurekaVariants}
      isLoggedIn={isLoggedIn}
    />
  )
}
