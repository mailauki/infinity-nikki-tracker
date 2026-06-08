import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Metadata } from 'next'
import { Suspense } from 'react'
import { Box, Button, Skeleton, Stack, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import { createClient } from '@/lib/supabase/server'
import { getUserID } from '@/hooks/user'
import { getCustomLooks } from '@/hooks/data/custom-looks'
import { FREE_LOOKS_LIMIT } from '@/lib/types/looks'
import LookCard, { LooksLimitBanner } from '@/components/looks/look-card'
import { deleteLook } from './actions'
import NavBarToolbar from '@/components/navbar/navbar-toolbar'

export const metadata: Metadata = { title: 'Custom Looks' }

export default function LooksPage() {
  return (
    <Suspense fallback={<LooksLoading />}>
      <LooksContent />
    </Suspense>
  )
}

async function LooksContent() {
  const user_id = await getUserID()
  if (!user_id) redirect('/login')

  const supabase = await createClient()

  const [looks, { data: profile }] = await Promise.all([
    getCustomLooks(user_id),
    supabase.from('profiles').select('is_premium').eq('id', user_id).single(),
  ])

  const isPremium = profile?.is_premium ?? false
  const atLimit = !isPremium && looks.length >= FREE_LOOKS_LIMIT

  // Batch-fetch thumbnail images for all looks
  const eurekaSlugs = [...new Set(looks.flatMap((l) => l.eureka_variant_slugs.slice(0, 4)))]
  const outfitSlugs = [...new Set(looks.flatMap((l) => l.outfit_variant_slugs.slice(0, 4)))]

  const [{ data: eurekaThumbs }, { data: outfitThumbs }] = await Promise.all([
    eurekaSlugs.length > 0
      ? supabase.from('eureka_variants').select('slug, image_url').in('slug', eurekaSlugs)
      : Promise.resolve({ data: [] }),
    outfitSlugs.length > 0
      ? supabase.from('outfit_variants').select('slug, image_url').in('slug', outfitSlugs)
      : Promise.resolve({ data: [] }),
  ])

  const thumbMap = new Map<string, string | null>([
    ...(eurekaThumbs ?? []).map((v): [string, string | null] => [v.slug, v.image_url]),
    ...(outfitThumbs ?? []).map((v): [string, string | null] => [v.slug, v.image_url]),
  ])

  async function handleDelete(id: string) {
    'use server'
    await deleteLook(id)
  }

  return (
    <>
      <NavBarToolbar>
        <Stack
          direction="row"
          sx={{ flex: 1, alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Typography variant="subtitle2">Custom Looks</Typography>
          <Button
            component={Link}
            disabled={atLimit}
            href="/looks/new"
            size="small"
            startIcon={<AddIcon />}
            variant="contained"
          >
            New look
          </Button>
        </Stack>
      </NavBarToolbar>

      <Stack spacing={2}>
        {!isPremium && looks.length > 0 && (
          <LooksLimitBanner count={looks.length} limit={FREE_LOOKS_LIMIT} />
        )}

        {looks.length === 0 ? (
          <Stack
            spacing={2}
            sx={{ alignItems: 'center', justifyContent: 'center', py: 8, textAlign: 'center' }}
          >
            <AutoAwesomeIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
            <Stack spacing={0.5}>
              <Typography variant="subtitle1">No looks yet</Typography>
              <Typography color="textSecondary" variant="body2">
                Mix and match eureka and outfit pieces to save your own custom looks.
              </Typography>
            </Stack>
            <Button component={Link} href="/looks/new" startIcon={<AddIcon />} variant="contained">
              Create your first look
            </Button>
          </Stack>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
              gap: 2,
            }}
          >
            {looks.map((look) => {
              const thumbnails = [...look.eureka_variant_slugs, ...look.outfit_variant_slugs]
                .slice(0, 6)
                .map((slug) => thumbMap.get(slug) ?? null)
                .filter((url): url is string => !!url)
              return (
                <LookCard
                  key={look.id}
                  look={look}
                  thumbnails={thumbnails}
                  onDelete={handleDelete}
                />
              )
            })}
          </Box>
        )}

        {atLimit && (
          <Typography color="textSecondary" sx={{ textAlign: 'center' }} variant="caption">
            Upgrade to premium to create unlimited looks.{' '}
            <Link href="/profile" style={{ color: 'inherit' }}>
              Go to profile →
            </Link>
          </Typography>
        )}
      </Stack>
    </>
  )
}

function LooksLoading() {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
        gap: 2,
      }}
    >
      {[...Array(3)].map((_, i) => (
        <Skeleton key={i} height={180} variant="rounded" />
      ))}
    </Box>
  )
}
