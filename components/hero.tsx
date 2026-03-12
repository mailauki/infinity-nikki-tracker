import { Box, Container, Stack, Typography } from '@mui/material'
import Image from 'next/image'

export function Hero() {
  return (
    <Box sx={{ position: 'relative', height: '100%' }}>
      <Image
        fill
        alt="Infinity Nikki Hero Image"
        className="object-cover object-[70%_center]"
        sizes="100vw"
        src="/hero.jpg"
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
          <Typography noWrap component="h1" variant="h3">
            Infinity Nikki Tracker
          </Typography>
          <Container fixed maxWidth="xs">
            <Typography fontSize={20} variant="subtitle1">
              Track your collection from your favorite cozy open-world game Infinity Nikki
            </Typography>
          </Container>
        </Stack>
      </Box>
    </Box>
  )
}
