import { Box, Button, Container, Stack, Typography } from '@mui/material'
import Image from 'next/image'
import Link from 'next/link'

import { getUserID } from '@/hooks/user'

export async function Hero() {
  const user_id = await getUserID()
  const isLoggedIn = !!user_id

  return (
    <Box
      sx={{
        position: 'relative',
        height: {
          xs: `calc(100vh - ${56 * 3 + 6}px)`,
          sm: `calc(100vh - ${64 * 3 + 6}px)`,
        },
      }}
    >
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
          sx={{
            flex: 1,
            color: 'white',
            textAlign: 'center',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 1,
          }}
        >
          {!isLoggedIn && (
            <Typography
              sx={{ color: 'rgba(255,255,255,0.7)', letterSpacing: 3 }}
              variant="overline"
            >
              Welcome to
            </Typography>
          )}
          <Typography noWrap component="h1" variant="h3">
            Infinity Nikki Tracker
          </Typography>
          <Container fixed maxWidth="xs">
            <Typography sx={{ fontSize: 20 }} variant="subtitle1">
              {isLoggedIn
                ? 'Welcome back — pick up where you left off'
                : 'Track your Eureka outfit collection from your favorite cozy open-world game'}
            </Typography>
          </Container>
          <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
            {isLoggedIn ? (
              <>
                <Button
                  component={Link}
                  href="/profile"
                  sx={{
                    borderRadius: 6,
                    px: 3,
                    bgcolor: 'white',
                    color: 'black',
                    '&:hover': { bgcolor: 'grey.100' },
                  }}
                  variant="contained"
                >
                  My Collection
                </Button>
                <Button
                  component={Link}
                  href="/eureka"
                  sx={{
                    borderRadius: 6,
                    px: 3,
                    borderColor: 'rgba(255,255,255,0.7)',
                    color: 'white',
                    '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.08)' },
                  }}
                  variant="outlined"
                >
                  Missing Items
                </Button>
              </>
            ) : (
              <>
                <Button
                  component={Link}
                  href="/auth/sign-up"
                  sx={{
                    borderRadius: 6,
                    px: 3,
                    bgcolor: 'white',
                    color: 'black',
                    '&:hover': { bgcolor: 'grey.100' },
                  }}
                  variant="contained"
                >
                  Sign Up Free
                </Button>
                <Button
                  component={Link}
                  href="/eureka"
                  sx={{
                    borderRadius: 6,
                    px: 3,
                    borderColor: 'rgba(255,255,255,0.7)',
                    color: 'white',
                    '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.08)' },
                  }}
                  variant="outlined"
                >
                  Browse Sets
                </Button>
              </>
            )}
          </Stack>
        </Stack>
      </Box>
    </Box>
  )
}
