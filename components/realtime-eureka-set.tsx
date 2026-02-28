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

const supabase = createClient()

export default function RealtimeEurekaSet({
  serverEurekaSet,
  serverObtained,
  user,
}: {
  serverEurekaSet: EurekaSet
  serverObtained: Obtained[]
  user: boolean
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
      <Box sx={{ position: 'relative', width: '100%' }}>
        <EurekaHeader eurekaSet={eurekaSet} variant="large" user={user} />
      </Box>
      <GridContainer
        mainContent={
          <>
            <EurekaTable eurekaSet={eurekaSet} user={user} />
          </>
        }
        sideContent={
          user && (
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
      {!user && (
        <div className="mb-10 flex flex-col items-center">
          <p className="max-w-sm text-center text-2xl">
            Sign in or Sign up <br />
            to track your missing Eureka
          </p>
        </div>
      )}
    </>
  )
}
