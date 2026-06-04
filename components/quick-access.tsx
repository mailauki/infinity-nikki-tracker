'use client'

import { Avatar, Box, Card, CardActionArea, CardContent, CardHeader, Divider, Stack, Typography, useColorScheme } from '@mui/material'
import Link from 'next/link'
import { Hero } from './hero'
import { HeroCTAs } from './hero-ctas'

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
  const isDarkMode = (mode === 'system' ? systemMode : mode) === 'dark'
  return (
    <Stack sx={{ py: 3 }} spacing={2}>
			<Stack direction='row' sx={{ alignItems: 'center', justifyContent: 'center' }}>
			<HeroCTAs isLoggedIn={false} />
			</Stack>
			<Divider />
      {/* <Typography
        variant="overline"
        sx={{ display: 'block', textAlign: 'center', mb: 2 }}
      >
        Quick Access
      </Typography> */}
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
              />
							<CardHeader
							title={title}
							subheader={subtitle}
							avatar={<Avatar
                      alt={title}
                      src={image}
                      sx={{ filter: isDarkMode ? 'none' : 'grayscale(100%) brightness(40%)' }}
                    />}
							/>
            </CardActionArea>
          </Card>
        ))}
      </Box>
    </Stack>
  )
}
