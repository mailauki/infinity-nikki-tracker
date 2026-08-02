import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { getUserID, getUserRole } from '@/hooks/user'
import { getEurekaSets } from '@/hooks/data/eureka-sets'
import { getOutfitSets } from '@/hooks/data/outfit-sets'
import { getTrials } from '@/hooks/data/trials'
import { getSeasons } from '@/hooks/data/seasons'
import { getRecentObtained } from '@/hooks/data/obtained-eureka'
import { getRecentObtainedOutfit } from '@/hooks/data/obtained-outfit'
import ProfileCard from '@/app/profile/profile-card'
import ProfileStats from '@/app/profile/profile-stats'
import ProfileTabs from '@/app/profile/profile-tabs'
import EurekaStats from '@/app/profile/eureka-stats'
import OutfitStats from '@/app/profile/outfit-stats'
import PremiumUpgrade from '@/app/profile/premium-upgrade'
import ProfileLoading from './loading'
import PageShell from '@/components/page-shell'

type Props = { params: Promise<{ username: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params
  return { title: `@${username}'s Collection` }
}

export default function PublicProfilePage({ params }: Props) {
  return (
    <Suspense fallback={<ProfileLoading />}>
      <ProfileView params={params} />
    </Suspense>
  )
}

async function ProfileView({ params }: Props) {
  const { username } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, display_name, username, avatar_url, banner_url, is_premium')
    .eq('username', username)
    .single()

  if (!profile) notFound()

  // Whether the signed-in viewer is looking at their own profile. Owner-only
  // affordances (the edit action, the premium upsell) key off this — everything
  // else renders the same for visitors.
  const viewerId = await getUserID()
  const isOwner = viewerId === profile.id
  const role = isOwner ? await getUserRole() : null

  // Every collection query is scoped to the PROFILE OWNER, not the viewer.
  // getEurekaSets/getOutfitSets default to the signed-in user, so without the
  // explicit id a visitor would see their own progress under this profile.
  const eurekaSets = await getEurekaSets(profile.id)
  const outfitSets = await getOutfitSets(profile.id)
  const trials = await getTrials()
  const seasons = await getSeasons()
  const recentObtained = await getRecentObtained(profile.id)
  const recentObtainedOutfit = await getRecentObtainedOutfit(profile.id)

  const isPremium = profile.is_premium ?? false

  return (
    <ProfileTabs
      eureka={
        <PageShell maxWidth="md">
          {isOwner && !isPremium && <PremiumUpgrade />}
          <EurekaStats
            user_id
            eurekaSets={eurekaSets || []}
            recentObtained={recentObtained || []}
            trials={trials || []}
          />
        </PageShell>
      }
      isAdmin={role === 'admin'}
      isOwner={isOwner}
      outfits={
        <PageShell maxWidth="md">
          {isOwner && !isPremium && <PremiumUpgrade />}
          <OutfitStats
            user_id
            outfitSets={outfitSets || []}
            recentObtained={recentObtainedOutfit || []}
            seasons={seasons || []}
          />
        </PageShell>
      }
      profile={
        <ProfileCard
          avatar_url={profile.avatar_url}
          banner_url={profile.banner_url}
          displayName={profile.display_name}
          isOwner={isOwner}
          isPremium={isPremium}
          loadError={false}
          stats={<ProfileStats eurekaSets={eurekaSets || []} outfitSets={outfitSets || []} />}
          username={profile.username}
        />
      }
    />
  )
}
