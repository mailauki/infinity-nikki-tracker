import { Container, ImageList, ImageListItem, ImageListItemBar, Typography } from '@mui/material'
import Image from 'next/image'

export async function Hero() {
  return (
    <ImageList cols={1} rowHeight={450} sx={{ borderRadius: 2 }}>
      <ImageListItem rows={1} sx={{ overflow: 'clip' }}>
        <Image
          fill
          alt="Infinity Nikki Hero Image"
					loading='eager'
          src="/hero.jpg"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center 75%',
          }}
        />
        <ImageListItemBar
          position="bottom"
          subtitle={
            <Container fixed maxWidth="xs">
              <Typography
                sx={{ fontSize: 20, textAlign: 'center', textWrap: 'auto' }}
                variant="subtitle1"
              >
                Track your Eureka outfit collection from your favorite cozy open-world game
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
      </ImageListItem>
    </ImageList>
  )
}
