'use client'

import { useEffect, useState } from 'react'

import { updateEurekaSet } from '@/hooks/eureka'
import { createClient } from '@/lib/supabase/client'
import { Category, EurekaSet, ObtainedEureka } from '@/lib/types/eureka'

import EurekaVariantGrid from '@/components/eureka/eureka-variant-grid'
import { Box, Card, List } from '@mui/material'
import GridContainer from '../grid-container'
import LoginAlert from '../login-alert'
import EurekaCard from '../eureka/eureka-card'
import { CategoryItem } from '../eureka/category-item'

const supabase = createClient()

export default function RealtimeEurekaSet({
  serverEurekaSet,
  serverObtainedEureka,
  isLoggedIn,
  userId,
}: {
  serverEurekaSet: EurekaSet
  serverObtainedEureka: ObtainedEureka[]
  isLoggedIn: boolean
  userId: string | null
}) {
  const [eurekaSet, setEurekaSet] = useState(serverEurekaSet)
  const [obtainedEureka, setObtainedEureka] = useState(serverObtainedEureka)

  useEffect(() => {
    if (!userId) return

    const obtainedChannel = supabase
      .channel('obtained-set-channel')
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
          setObtainedEureka((prev) => prev.filter((obtained) => obtained.id !== payload.old.id))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(obtainedChannel)
    }
  }, [userId])

  useEffect(() => {
    const updatedEurekaSet = updateEurekaSet({ eurekaSet: serverEurekaSet, obtainedEureka })

    setEurekaSet(updatedEurekaSet)
  }, [obtainedEureka, serverEurekaSet])

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
                    key={category.slug}
                    component="li"
                    elevation={0}
                    sx={{ backgroundColor: 'transparent' }}
                  >
                    <CategoryItem eurekaVariants={eurekaSet.eureka_variants} item={category} />
                  </Card>
                ))}
              </List>
              <List sx={{ width: '100%' }}>
                {eurekaSet.colors.map((color: Category) => (
                  <Card
                    key={color.slug}
                    component="li"
                    elevation={0}
                    sx={{ backgroundColor: 'transparent' }}
                  >
                    <CategoryItem
                      categoryType="colors"
                      eurekaVariants={eurekaSet.eureka_variants}
                      item={color}
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
