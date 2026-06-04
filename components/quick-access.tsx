import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Container,
  Typography,
} from '@mui/material'
import Link from 'next/link'

const cards = [
  {
    title: 'Outfits',
    subtitle: 'Browse all outfit sets in the game',
    href: '/outfits',
    image: null,
  },
  {
    title: 'Eureka Sets',
    subtitle: 'Track your collection progress',
    href: '/eureka',
    image: '/screenshots/screenshot-eureka-set-dark.png',
  },
]

export function QuickAccess() {
  return (
    <Container sx={{ py: 3 }}>
      <Typography
        variant="overline"
        sx={{ display: 'block', textAlign: 'center', mb: 2, letterSpacing: 2 }}
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
        {cards.map(({ title, subtitle, href, image }) => (
          <Card key={href}>
            <CardActionArea component={Link} href={href} sx={{ height: '100%' }}>
              {image ? (
                <CardMedia
                  component="img"
                  height={160}
                  image={image}
                  alt={title}
                  sx={{ objectPosition: 'top' }}
                />
              ) : (
                <Box
                  sx={{
                    height: 160,
                    background: (theme) =>
                      `linear-gradient(135deg, ${theme.palette.primary.dark ?? theme.palette.primary.main}, ${theme.palette.secondary.dark ?? theme.palette.secondary.main})`,
                  }}
                />
              )}
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
    </Container>
  )
}
