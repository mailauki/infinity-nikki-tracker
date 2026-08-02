import ProfileCard from './profile-card'
import { createClient } from '@/lib/supabase/server'
import { getUserID, getUserRole } from '@/hooks/user'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { Metadata } from 'next'
import ProfileLoading from './loading'
import { getEurekaSets } from '@/hooks/data/eureka-sets'
import { getTrials } from '@/hooks/data/trials'
import { getRecentObtained } from '@/hooks/data/obtained-eureka'
import { getRecentObtainedOutfit } from '@/hooks/data/obtained-outfit'
import { getSeasons } from '@/hooks/data/seasons'
import ProfileStats from './profile-stats'
import { getOutfitSets } from '@/hooks/data/outfit-sets'
import PremiumUpgrade from './premium-upgrade'
import EurekaStats from './eureka-stats'
import OutfitStats from './outfit-stats'
import ProfileTabs from './profile-tabs'
import PageShell from '@/components/page-shell'

export const metadata: Metadata = {
  title: 'Profile',
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfileLoading />}>
      <UserDetails />
    </Suspense>
  )
}

async function UserDetails() {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  const role = await getUserRole()
  const user_id = await getUserID()
  const eurekaSets = await getEurekaSets()
  const trials = await getTrials()
  const outfitSets = await getOutfitSets()
  const seasons = await getSeasons()
  const recentObtained = user_id ? await getRecentObtained(user_id) : []
  const recentObtainedOutfit = user_id ? await getRecentObtainedOutfit(user_id) : []

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, username, avatar_url, is_premium')
    .eq('id', user.id)
    .single()

  const isPremium = profile?.is_premium ?? false

  return (
    <>
      {/* ProfileTabs sits outside PageShell so the Profile tab's hero can run
          full-bleed; the stats views re-apply the md cap around their own content.
          It also owns ProfileToolbar, which reads the tab context. */}
      <ProfileTabs
        eureka={
          <PageShell maxWidth="md">
            {!isPremium && <PremiumUpgrade />}
            <EurekaStats
              eurekaSets={eurekaSets || []}
              recentObtained={recentObtained || []}
              trials={trials || []}
              user_id={Boolean(user_id)}
            />
          </PageShell>
        }
        isAdmin={role === 'admin'}
        outfits={
          <PageShell maxWidth="md">
            {!isPremium && <PremiumUpgrade />}
            <OutfitStats
              outfitSets={outfitSets || []}
              recentObtained={recentObtainedOutfit || []}
              seasons={seasons || []}
              user_id={Boolean(user_id)}
            />
          </PageShell>
        }
        profile={
          <ProfileCard
            avatar_url={profile?.avatar_url ?? null}
            fullname={profile?.display_name ?? null}
            isPremium={isPremium}
            loadError={false}
            stats={<ProfileStats eurekaSets={eurekaSets || []} outfitSets={outfitSets || []} />}
            username={profile?.username ?? null}
          />
        }
      />
    </>
  )
}
