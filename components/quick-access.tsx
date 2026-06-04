'use client'

import { Box, Card, CardActionArea, CardContent, Typography } from '@mui/material'
import Link from 'next/link'

const cards = [
  {
    title: 'Outfits',
    subtitle: 'Browse all outfit sets in the game',
    href: '/outfits',
  },
  {
    title: 'Eureka Sets',
    subtitle: 'Track your collection progress',
    href: '/eureka',
  },
]

export function QuickAccess() {
  return (
    <Box sx={{ py: 3 }}>
      <Typography
        variant="overline"
        sx={{ display: 'block', textAlign: 'center', mb: 2 }}
      >
        Quick Access
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          gap: 2,
        }}
      >
        {cards.map(({ title, subtitle, href }) => (
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
              <CardContent>
                <Typography variant="h6" component="h2" gutterBottom>
                  {title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {subtitle}
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </Box>
    </Box>
  )
}
