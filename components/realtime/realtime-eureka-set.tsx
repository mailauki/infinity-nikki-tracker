'use client'

import { useEffect, useState } from 'react'

import { updateEurekaSet } from '@/hooks/eureka'
import { createClient } from '@/lib/supabase/client'
import { Category, EurekaSet, Obtained } from '@/lib/types/eureka'

import EurekaVariantGrid from '@/components/eureka/eureka-variant-grid'
import { Box, Card, List } from '@mui/material'
import GridContainer from '../grid-container'
import LoginAlert from '../login-alert'
import EurekaCard from '../eureka/eureka-card'
import { CategoryItem } from '../eureka/category-item'

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
    const updatedEurekaSet = updateEurekaSet({ eurekaSet: serverEurekaSet, obtained })

    setEurekaSet(updatedEurekaSet)
  }, [obtained, serverEurekaSet])

  return (
    <>
      {!isLoggedIn && <LoginAlert />}
      <Box sx={{ position: 'relative', width: '100%' }}>
        <EurekaCard eurekaSet={eurekaSet} isLoggedIn={isLoggedIn} size="lg" />
      </Box>
      <GridContainer
        mainContent={<EurekaVariantGrid eurekaSet={eurekaSet} isLoggedIn={isLoggedIn} />}
        sideContent={
          isLoggedIn && (
            <>
              <List sx={{ width: '100%' }}>
                {eurekaSet.categories.map((category: Category) => (
                  <Card
                    key={category.title}
                    elevation={0}
                    component="li"
                    sx={{ backgroundColor: 'transparent' }}
                  >
                    <CategoryItem item={category} eurekaVariants={eurekaSet.eureka_variants} />
                  </Card>
                ))}
              </List>
              <List sx={{ width: '100%' }}>
                {eurekaSet.colors.map((color: Category) => (
                  <Card
                    key={color.title}
                    elevation={0}
                    component="li"
                    sx={{ backgroundColor: 'transparent' }}
                  >
                    <CategoryItem
                      item={color}
                      eurekaVariants={eurekaSet.eureka_variants}
                      categoryType="colors"
                      size="xs"
                    />
                  </Card>
                ))}
              </List>
            </>
          )
        }
      />
    </>
  )
}
