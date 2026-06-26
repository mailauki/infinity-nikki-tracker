'use client'

import {
  Avatar,
  Box,
  Card,
  CardActionArea,
  CardContent,
  CardHeader,
  Stack,
  Typography,
  useColorScheme,
} from '@mui/material'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import LazyImage from './lazy-image'

const cards = [
  {
    title: 'Outfits',
    subtitle: 'Browse all outfit sets in the game',
    href: '/outfits',
    image: '/icons/outfits.png',
  },
  {
    title: 'Eureka Sets',
    subtitle: 'Track your collection progress',
    href: '/eureka',
    image: '/icons/eureka.png',
  },
]

export function QuickAccess() {
  const { mode, systemMode } = useColorScheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const isDarkMode = mounted && (mode === 'system' ? systemMode : mode) === 'dark'

  return (
    <Box sx={{ py: 3 }}>
      <Typography sx={{ display: 'block', textAlign: 'center', mb: 2 }} variant="overline">
        Quick Access
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          gap: 2,
        }}
      >
        {cards.map(({ title, subtitle, href, image }) => (
          <Card key={href}>
            <CardActionArea component={Link} href={href} sx={{ height: '100%' }}>
              <Box
                aria-hidden="true"
                sx={{
                  height: 160,
                  background: (theme) =>
                    `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                }}
              >
                <Stack sx={{ alignItems: 'center', justifyContent: 'center' }}>
                  <LazyImage
                    size="xl"
                    src={
                      title === 'Outfits'
                        ? '/quick-access/perfect-start-alt.png'
                        : '/quick-access/first-snow-head-white.png'
                    }
                    variant="square"
                  />
                </Stack>
              </Box>
              <CardHeader
                disableTypography
                avatar={
                  <Avatar
                    alt={title}
                    src={image}
                    sx={{ filter: isDarkMode ? 'none' : 'grayscale(100%) brightness(40%)' }}
                  />
                }
                subheader={<Typography variant="body2">{subtitle}</Typography>}
                title={
                  <Typography component="span" variant="subtitle2">
                    {title}
                  </Typography>
                }
              />
            </CardActionArea>
          </Card>
        ))}
      </Box>
    </Box>
  )
}
