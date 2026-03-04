'use client'

import { useEffect, useState } from 'react'

import { updateEurekaVariants } from '@/hooks/eureka'
import { createClient } from '@/lib/supabase/client'
import { Category, EurekaVariant, Obtained } from '@/lib/types/types'

import EurekaFilter from '@/components/eureka/eureka-filter'

const supabase = createClient()

export default function RealtimeEurekaFilter({
  serverEurekaVariants,
  serverCategories,
  serverObtained,
  isLoggedIn,
  userId,
}: {
  serverEurekaVariants: EurekaVariant[]
  serverCategories: Category[]
  serverObtained: Obtained[]
  isLoggedIn: boolean
  userId: string | null
}) {
  const [eurekaVariants, setEurekaVariants] = useState(serverEurekaVariants)
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
    const updatedEurekaVariants = updateEurekaVariants({ eurekaVariants, obtained })

    setEurekaVariants(updatedEurekaVariants)

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [obtained])

  return <EurekaFilter eurekaVariants={eurekaVariants} categories={serverCategories} isLoggedIn={isLoggedIn} />
}
