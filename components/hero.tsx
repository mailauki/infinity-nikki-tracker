import { Box, Container, Stack, Typography } from '@mui/material'
import Image from 'next/image'

export function Hero() {
  return (
    <Box sx={{ position: 'relative', height: '100%' }}>
      <Image
        src="/hero.jpg"
        alt="Infinity Nikki Hero Image"
        sizes="100vw"
        className="object-cover object-[70%_center]"
        fill
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          pt: 20,
          pb: 10,
          width: '100%',
          background:
            'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 70%, rgba(0,0,0,0) 100%)',
        }}
      >
        <Stack
          alignItems="center"
          justifyContent="flex-end"
          sx={{ flex: 1, color: 'white', textAlign: 'center' }}
        >
          <Typography variant="h3" noWrap component="h1">
            Infinity Nikki Tracker
          </Typography>
          <Container fixed maxWidth="xs">
            <Typography variant="subtitle1" fontSize={20}>
              Track your collection from your favorite cozy open-world game Infinity Nikki
            </Typography>
          </Container>
        </Stack>
      </Box>
    </Box>
  )
}
