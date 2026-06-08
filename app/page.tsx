import { Suspense } from 'react'

import { QuickAccess } from '@/components/quick-access'
import { Hero } from '../components/hero'
import { HeroCTAs } from '@/components/hero-ctas'
import { getUserID } from '@/hooks/user'
import HelpActions from './help/help-actions'
import NavBarToolbar from '@/components/navbar/navbar-toolbar'

export default function HomePage() {
  return (
    <>
      <Hero />
      <NavBarToolbar>
        <Suspense>
          <HomeCTAs />
        </Suspense>
      </NavBarToolbar>
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
