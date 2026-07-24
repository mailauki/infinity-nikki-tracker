import { Suspense } from 'react'
import ReactDOM from 'react-dom'

import { QuickAccess } from '@/components/quick-access'
import { Hero } from '../components/hero'
import { HeroCTAs } from '@/components/hero-ctas'
import { getUserID } from '@/hooks/user'
import HelpActions from './help/help-actions'
import NavBarToolbar from '@/components/navbar/navbar-toolbar'
import PageShell from '@/components/page-shell'

export default function HomePage() {
  // Preload the LCP hero so it downloads during HTML parse, not after CSS/layout.
  // React hoists this into <head> as <link rel="preload" as="image">.
  ReactDOM.preload('/hero.webp', { as: 'image', fetchPriority: 'high' })

  return (
    <PageShell>
      <NavBarToolbar>
        <Suspense>
          <HomeCTAs />
        </Suspense>
      </NavBarToolbar>
      <Hero />
      <QuickAccess />
      <HelpActions />
    </PageShell>
  )
}

async function HomeCTAs() {
  const user_id = await getUserID()
  const isLoggedIn = !!user_id
  return <HeroCTAs isLoggedIn={isLoggedIn} />
}
