'use client'

import { ProfileTabsProvider } from './profile-tabs-context'
import ProfileToolbar from './profile-toolbar'
import ProfileStatsBar from './profile-stats-bar'
import ProfileTabsContent from './profile-tabs-content'

export default function ProfileTabs({
  isAdmin,
  profile,
  outfits,
  eureka,
}: {
  isAdmin: boolean
  profile: React.ReactNode
  outfits: React.ReactNode
  eureka: React.ReactNode
}) {
  return (
    // ProfileToolbar and ProfileStatsBar both read the tab context, so they are
    // rendered inside the provider even though they portal into the shell chrome.
    <ProfileTabsProvider>
      <ProfileToolbar isAdmin={isAdmin} />
      <ProfileStatsBar />
      <ProfileTabsContent eureka={eureka} outfits={outfits} profile={profile} />
    </ProfileTabsProvider>
  )
}
