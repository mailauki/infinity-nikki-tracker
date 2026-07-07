import { Card, CardMedia, Container, ImageListItemBar, Typography } from '@mui/material'

export async function Hero() {
  return (
    <Card sx={{ position: 'relative' }}>
      <CardMedia
        alt="Infinity Nikki Hero Image"
        component="img"
        height="450"
        image="/hero.jpg"
        loading="eager"
        sx={{ borderRadius: 2 }}
      />
      <ImageListItemBar
        position="bottom"
        subtitle={
          <Container fixed maxWidth="xs">
            <Typography
              sx={{ fontSize: 20, textAlign: 'center', textWrap: 'auto', pb: 0.25 }}
              variant="subtitle1"
            >
              Track your collection from your favorite cozy open-world game
            </Typography>
          </Container>
        }
        sx={{
          height: 'fit-content',
          pt: 6,
          pb: 4,
          background:
            'linear-gradient(to top, rgba(0,0,0,0.7) 0%, ' +
            'rgba(0,0,0,0.3) 70%, rgba(0,0,0,0) 100%)',
        }}
        title={
          <Typography noWrap component="h1" sx={{ textAlign: 'center' }} variant="h3">
            Infinity Nikki Tracker
          </Typography>
        }
      />
    </Card>
  )
}
