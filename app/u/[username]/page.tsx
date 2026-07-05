import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { Stack, Typography, Chip, Card, CardContent, Box, Divider } from '@mui/material'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import AvatarPreview from '@/app/settings/avatar-preview'
import PageShell from '@/components/page-shell'

type Props = { params: Promise<{ username: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params
  return { title: `@${username}'s Collection` }
}

export default function PublicProfilePage({ params }: Props) {
  return (
    <Suspense>
      <ProfileView params={params} />
    </Suspense>
  )
}

async function ProfileView({ params }: Props) {
  const { username } = await params

  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, display_name, username, avatar_url, is_premium')
    .eq('username', username)
    .single()

  if (!profile) notFound()
  if (!profile.is_premium) notFound()

  // Fetch their obtained counts
  const { data: obtained } = await supabase
    .from('obtained_eureka')
    .select('id, eureka_set, category, color')
    .eq('user_id', profile.id)

  const obtainedCount = obtained?.length ?? 0
  const uniqueSets = new Set(obtained?.map((o) => o.eureka_set) ?? []).size

  const { count: totalVariants } = await supabase
    .from('eureka_variants')
    .select('*', { count: 'exact', head: true })

  const { count: totalSets } = await supabase
    .from('eureka_sets')
    .select('*', { count: 'exact', head: true })

  const stats = [
    { label: 'Sets touched', value: uniqueSets, total: totalSets ?? 0 },
    { label: 'Variants obtained', value: obtainedCount, total: totalVariants ?? 0 },
  ]

  return (
    <PageShell maxWidth="xs">
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
        <AvatarPreview size="xl" url={profile.avatar_url} />
        <Stack spacing={0.5}>
          <Stack direction="row" sx={{ alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="h6">{profile.display_name ?? profile.username}</Typography>
            <Chip
              color="primary"
              icon={<AutoAwesomeIcon fontSize="small" />}
              label="Supporter"
              size="small"
              variant="outlined"
            />
          </Stack>
          <Typography color="textSecondary" variant="body2">
            @{profile.username}
          </Typography>
        </Stack>
      </Stack>

      <Divider />

      <Stack spacing={1}>
        <Typography color="textSecondary" variant="overline">
          Collection progress
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 1.5,
          }}
        >
          {stats.map(({ label, value, total }) => (
            <Card key={label} variant="outlined">
              <CardContent sx={{ p: '12px !important' }}>
                <Stack spacing={0.5}>
                  <Typography variant="h5">
                    {value}
                    <Typography color="textSecondary" component="span" variant="body2">
                      {' '}
                      / {total}
                    </Typography>
                  </Typography>
                  <Typography color="textSecondary" variant="caption">
                    {label}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Stack>
    </PageShell>
  )
}
