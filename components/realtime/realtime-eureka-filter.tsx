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
}: {
  serverEureka: Eureka[]
  serverCategories: Category[]
  serverObtained: Obtained[]
  isLoggedIn: boolean
}) {
  const [eureka, setEureka] = useState(serverEureka)
  const [obtained, setObtained] = useState(serverObtained)

  useEffect(() => {
    const obtainedChannel = supabase
      .channel('obtained-insert-channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'obtained' },
        (payload) => {
          setObtained([...obtained, payload.new as Obtained])
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'obtained' },
        (payload) => {
          setObtained(obtained.filter((item) => item.id !== payload.old.id))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(obtainedChannel)
    }
  }, [obtained])

  useEffect(() => {
    const updatedEureka = updateEureka({ eureka, obtained })

    setEureka(updatedEureka)

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [obtained])

  return <EurekaFilter eureka={eureka} categories={serverCategories} isLoggedIn={isLoggedIn} />
}
