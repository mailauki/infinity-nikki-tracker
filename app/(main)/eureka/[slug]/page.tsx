import { Suspense } from 'react'

// import { getUserID } from '@/hooks/user'
import { getEurekaSet } from '@/hooks/data/eureka-sets'
// import { getObtainedEureka } from '@/hooks/data/obtained-eureka'
import { Container, Stack, Button, Box, Divider, Typography, Chip, Avatar } from '@mui/material'
import type { Metadata } from 'next'
import { Category, ChevronRight } from '@mui/icons-material'
import EurekaVariantCard from '@/components/eureka/eureka-variant-card'
import { toTitle } from '@/lib/utils'
import RarityStars from '@/components/rarity-stars'

const GRID_COLUMNS = {
  xs: '1fr 1fr 1fr',
  sm: '1fr 1fr 1fr 1fr',
  md: '1fr 1fr 1fr 1fr 1fr',
}

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params

  const eureka = await getEurekaSet(slug)

  return { title: eureka.title }
}

export default async function EurekaSetPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  return (
    <Suspense>
      <EurekaSet slug={slug} />
    </Suspense>
  )
}

async function EurekaSet({ slug }: { slug: string }) {
  const eurekaSet = await getEurekaSet(slug)
  // const user_id = await getUserID()
  // const obtainedEureka = user_id ? await getObtainedEureka(user_id) : []
  // const isLoggedIn = !!user_id!

  const {
    title,
    image_url,
    trial,
    trials,
    eureka_variants,
    rarity,
    label,
    style,
    // categories,
    colors,
  } = eurekaSet

  return (
    <Container maxWidth="md" sx={{ flexGrow: 1, py: 3 }}>
      <Stack spacing={3}>
        <Stack spacing={1}>
          <Stack direction="row" justifyContent="space-between" sx={{ flex: 1 }}>
            <Stack alignItems="center" sx={{ pt: 1 }}>
              <Avatar
                alt={slug || 'Eureka Variant'}
                size="xl"
                src={image_url!}
                sx={{ bgcolor: 'transparent', color: 'text.disabled' }}
              >
                <Category fontSize="inherit" />
              </Avatar>
            </Stack>

            <Chip label={toTitle(label ?? '')} variant="outlined" />
          </Stack>

          <Typography component="h2" variant="subtitle1">
            {title}
          </Typography>

          <Stack direction="row" justifyContent="space-between" sx={{ flex: 1 }}>
            <Typography color="textSecondary" variant="subtitle2">
              <RarityStars rarity={rarity!} />
            </Typography>

            <Typography color="textSecondary" variant="body1">
              {toTitle(style ?? '')}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={0.5}>
            {colors.map((color) => (
              <Chip
                key={color.slug}
                avatar={<Avatar alt={color.title} src={color.image_url!} />}
                label={color.title}
              />
            ))}
          </Stack>
        </Stack>

        <Stack>
          <Stack
            alignItems="flex-end"
            direction="row"
            justifyContent="space-between"
            sx={{ mb: 0.5 }}
          >
            <Button
              color="inherit"
              endIcon={<ChevronRight />}
              href={`/eureka/trials/${trial}`}
              size="small"
            >
              {trials?.title}
            </Button>
          </Stack>

          <Divider />
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: GRID_COLUMNS,
            gap: { xs: 1, sm: 1.5, md: 2 },
            py: 0,
            mb: 4,
          }}
        >
          {eureka_variants.map((variant) => (
            <EurekaVariantCard key={variant.id} eurekaVariant={variant} isLoggedIn={false} />
          ))}
        </Box>
      </Stack>
    </Container>
  )
}
