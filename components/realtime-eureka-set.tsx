'use client'

import { useEffect, useState } from 'react'

import { updateEurekaSet } from '@/hooks/eureka-set'
import { createClient } from '@/lib/supabase/client'
import { EurekaSet, Obtained } from '@/lib/types/types'

import EurekaHeader from './eureka-header'
import EurekaTable from './eureka-table'
import { Box } from '@mui/material'
import ProgressList from './progress-list'
import GridContainer from './grid-container'
import LoginAlert from './login-alert'

const supabase = createClient()

export default function RealtimeEurekaSet({
  serverEurekaSet,
  serverObtained,
  isLoggedIn,
}: {
  serverEurekaSet: EurekaSet
  serverObtained: Obtained[]
  isLoggedIn: boolean
}) {
  const [eurekaSet, setEurekaSet] = useState(serverEurekaSet)
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
    const updatedEurekaSet = updateEurekaSet({ eurekaSet, obtained })

    setEurekaSet(updatedEurekaSet)

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [obtained])

  return (
    <>
      {!isLoggedIn && <LoginAlert />}
      <Box sx={{ position: 'relative', width: '100%' }}>
        <EurekaHeader eurekaSet={eurekaSet} variant="large" isLoggedIn={isLoggedIn} />
      </Box>
      <GridContainer
        mainContent={
          <>
            <EurekaTable eurekaSet={eurekaSet} isLoggedIn={isLoggedIn} />
          </>
        }
        sideContent={
          isLoggedIn && (
            <>
              <ProgressList
                items={eurekaSet.categories}
                eureka={eurekaSet.eureka}
                filter="categories"
              />
              <ProgressList items={eurekaSet.colors} eureka={eurekaSet.eureka} filter="colors" />
            </>
          )
        }
      />
    </>
  )
}
