'use client'

import { useEffect, useState } from 'react'

import { updateEurekaSet } from '@/hooks/eureka'
import { createClient } from '@/lib/supabase/client'
import { EurekaSet, Obtained } from '@/lib/types/types'

import EurekaHeader from '@/components/eureka/eureka-header'
import EurekaVariantGrid from '@/components/eureka/eureka-variant-grid'
import { Box } from '@mui/material'
import ProgressList from '../progress-list'
import GridContainer from '../grid-container'
import LoginAlert from '../login-alert'

const supabase = createClient()

export default function RealtimeEurekaSet({
  serverEurekaSet,
  serverObtained,
  isLoggedIn,
  userId,
}: {
  serverEurekaSet: EurekaSet
  serverObtained: Obtained[]
  isLoggedIn: boolean
  userId: string | null
}) {
  const [eurekaSet, setEurekaSet] = useState(serverEurekaSet)
  const [obtained, setObtained] = useState(serverObtained)

  useEffect(() => {
    if (!userId) return

    const obtainedChannel = supabase
      .channel('obtained-set-channel')
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
    const updatedEurekaSet = updateEurekaSet({ eurekaSet, obtained })

    setEurekaSet(updatedEurekaSet)

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [obtained])

  return (
    <>
      {!isLoggedIn && <LoginAlert />}
      <Box sx={{ position: 'relative', width: '100%' }}>
        <EurekaHeader eurekaSet={eurekaSet} isLoggedIn={isLoggedIn} />
      </Box>
      <GridContainer
        mainContent={<EurekaVariantGrid eurekaSet={eurekaSet} isLoggedIn={isLoggedIn} />}
        sideContent={
          isLoggedIn && (
            <>
              <ProgressList
                items={eurekaSet.categories}
                eurekaVariants={eurekaSet.eureka_variants}
                categoryType="categories"
              />
              <ProgressList
                items={eurekaSet.colors}
                eurekaVariants={eurekaSet.eureka_variants}
                categoryType="colors"
              />
            </>
          )
        }
      />
    </>
  )
}
