'use client'

import { ProfileTabsProvider } from './profile-tabs-context'
import ProfileToolbar from './profile-toolbar'
import ProfileStatsBar from './profile-stats-bar'
import ProfileTabsContent from './profile-tabs-content'

export default function ProfileTabs({
  isAdmin,
  isOwner = false,
  profile,
  outfits,
  eureka,
  makeup,
  cloaks,
}: {
  isAdmin: boolean
  /** The viewer is looking at their own profile — gates the edit affordances. */
  isOwner?: boolean
  profile: React.ReactNode
  outfits: React.ReactNode
  eureka: React.ReactNode
  makeup: React.ReactNode
  cloaks: React.ReactNode
}) {
  return (
    // ProfileToolbar and ProfileStatsBar both read the tab context, so they are
    // rendered inside the provider even though they portal into the shell chrome.
    <ProfileTabsProvider>
      <ProfileToolbar isAdmin={isAdmin} isOwner={isOwner} />
      <ProfileStatsBar />
      <ProfileTabsContent
        cloaks={cloaks}
        eureka={eureka}
        makeup={makeup}
        outfits={outfits}
        profile={profile}
      />
    </ProfileTabsProvider>
  )
}
