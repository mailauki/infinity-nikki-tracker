import { Stack } from '@mui/material'
import { Suspense } from 'react'

import { QuickAccess } from '@/components/quick-access'
import { Hero } from '../components/hero'
import { HeroCTAs } from '@/components/hero-ctas'
import { getUserID } from '@/hooks/user'
import HelpActions from './help/help-actions'

export default function HomePage() {
  return (
    <>
      <Hero />
      <Suspense>
        <HomeCTAs />
      </Suspense>
      <QuickAccess />
      <HelpActions />
    </>
  )
}

async function HomeCTAs() {
  const user_id = await getUserID()
  const isLoggedIn = !!user_id
  return <HeroCTAs isLoggedIn={isLoggedIn} />
}
