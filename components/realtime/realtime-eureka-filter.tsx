'use client'

import { useEffect, useState } from 'react'

import { updateEureka } from '@/hooks/eureka-set'
import { createClient } from '@/lib/supabase/client'
import { Category, Eureka, Obtained } from '@/lib/types/types'

import EurekaFilter from '@/components/eureka/eureka-filter'

const supabase = createClient()

export default function RealtimeEurekaFilter({
  serverEureka,
  serverCategories,
  serverObtained,
  isLoggedIn,
  userId,
}: {
  serverEureka: Eureka[]
  serverCategories: Category[]
  serverObtained: Obtained[]
  isLoggedIn: boolean
  userId: string | null
}) {
  const [eureka, setEureka] = useState(serverEureka)
  const [obtained, setObtained] = useState(serverObtained)

  useEffect(() => {
    if (!userId) return

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
  }, [userId])

  useEffect(() => {
    const updatedEureka = updateEureka({ eureka, obtained })

    setEureka(updatedEureka)

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [obtained])

  return <EurekaFilter eureka={eureka} categories={serverCategories} isLoggedIn={isLoggedIn} />
}
