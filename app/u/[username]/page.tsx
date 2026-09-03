import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { getUserID, getUserRole } from '@/hooks/user'
import { getEurekaSets } from '@/hooks/data/eureka-sets'
import { getMakeupSets } from '@/hooks/data/makeup-sets'
import { getMomoCloaks } from '@/hooks/data/momo-cloaks'
import {
  getObtainedMomoCloaks,
  getRecentObtainedMomoCloaks,
} from '@/hooks/data/obtained-momo-cloaks'
import { getOutfitSets } from '@/hooks/data/outfit-sets'
import { getTrials } from '@/hooks/data/trials'
import { getSeasons } from '@/hooks/data/seasons'
import { getRecentObtained } from '@/hooks/data/obtained-eureka'
import { getRecentObtainedMakeup } from '@/hooks/data/obtained-makeup'
import { getRecentObtainedOutfit } from '@/hooks/data/obtained-outfit'
import {
  getFollowCounts,
  getFollowers,
  getFollowing,
  getIsFollowing,
  getViewerFollowingIds,
} from '@/hooks/data/follows'
import ProfileCard from '@/app/profile/profile-card'
import ProfileStats from '@/app/profile/profile-stats'
import ProfileTabs from '@/app/profile/profile-tabs'
import ProfileConnections from '@/app/profile/profile-connections'
import EurekaStats from '@/app/profile/eureka-stats'
import MakeupStats from '@/app/profile/makeup-stats'
import MomoCloakStats from '@/app/profile/momo-cloak-stats'
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

  // Follow data for the card and its modal. Parallel — none depends on another,
  // and the page already awaits ~10 collection queries sequentially.
  const [followCounts, following, followers, isFollowing, viewerFollowingIds] = await Promise.all([
    getFollowCounts(profile.id),
    getFollowing(profile.id),
    getFollowers(profile.id),
    getIsFollowing(viewerId, profile.id),
    getViewerFollowingIds(viewerId),
  ])

  // Every collection query is scoped to the PROFILE OWNER, not the viewer.
  // getEurekaSets/getOutfitSets default to the signed-in user, so without the
  // explicit id a visitor would see their own progress under this profile.
  const eurekaSets = await getEurekaSets(profile.id)
  const outfitSets = await getOutfitSets(profile.id)
  const makeupSets = await getMakeupSets(profile.id)
  // Cloaks are a flat domain — one row per cloak, no variants — so there is no
  // set to complete. getMomoCloaks applies no obtained flags of its own (it
  // takes no user id), so join them on here, scoped to the profile owner.
  // A failed fetch degrades to an empty/unflagged list rather than taking down
  // the whole profile.
  const momoCloaks = await Promise.all([
    getMomoCloaks().catch((err) => {
      console.error('Failed to load momo cloaks:', err)
      return []
    }),
    getObtainedMomoCloaks(profile.id).catch((err) => {
      console.error('Failed to load obtained momo cloaks:', err)
      return []
    }),
  ]).then(([cloaks, obtained]) => {
    const obtainedSlugs = new Set(obtained.map((row) => row.momo_cloak))
    return cloaks.map((cloak) => ({ ...cloak, obtained: obtainedSlugs.has(cloak.slug) }))
  })
  const momoCloaksObtained = momoCloaks.filter((cloak) => cloak.obtained).length
  const trials = await getTrials()
  const seasons = await getSeasons()
  const recentObtained = await getRecentObtained(profile.id)
  const recentObtainedOutfit = await getRecentObtainedOutfit(profile.id)
  const recentObtainedMakeup = await getRecentObtainedMakeup(profile.id)
  const recentObtainedMomoCloak = await getRecentObtainedMomoCloaks(profile.id)

  const isPremium = profile.is_premium ?? false

  return (
    <ProfileTabs
      cloaks={
        <PageShell maxWidth="md">
          {isOwner && !isPremium && <PremiumUpgrade />}
          <MomoCloakStats
            user_id
            cloaks={momoCloaks}
            recentObtained={recentObtainedMomoCloak || []}
          />
        </PageShell>
      }
      connections={
        <PageShell maxWidth="sm">
          <ProfileConnections
            followers={followers}
            following={following}
            viewerFollowingIds={viewerFollowingIds}
            viewerId={viewerId}
          />
        </PageShell>
      }
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
      makeup={
        <PageShell maxWidth="md">
          {isOwner && !isPremium && <PremiumUpgrade />}
          <MakeupStats
            user_id
            makeupSets={makeupSets || []}
            recentObtained={recentObtainedMakeup || []}
            seasons={seasons || []}
          />
        </PageShell>
      }
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
          followers={followers}
          followersCount={followCounts.followers}
          following={following}
          followingCount={followCounts.following}
          isFollowing={isFollowing}
          isOwner={isOwner}
          isPremium={isPremium}
          loadError={false}
          profileId={profile.id}
          stats={
            <ProfileStats
              eurekaSets={eurekaSets || []}
              makeupSets={makeupSets || []}
              momoCloaksObtained={momoCloaksObtained}
              outfitSets={outfitSets || []}
            />
          }
          username={profile.username}
          viewerFollowingIds={viewerFollowingIds}
          viewerId={viewerId}
        />
      }
    />
  )
}
