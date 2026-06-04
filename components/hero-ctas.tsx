'use client'

import { Button, Divider, Stack } from '@mui/material'
import Link from 'next/link'

const buttonSx = {
  contained: {
    borderRadius: 6,
    px: 3,
    bgcolor: 'white',
    color: 'black',
    '&:hover': { bgcolor: 'grey.100' },
  },
  outlined: {
    borderRadius: 6,
    px: 3,
    borderColor: 'rgba(255,255,255,0.7)',
    color: 'white',
    '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.08)' },
  },
}

export function HeroCTAs({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <Stack spacing={1.5} sx={{ mt: 3 }}>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', justifyContent: 'center' }}>
        {isLoggedIn ? (
          <>
            <Button
              component={Link}
              href="/profile"
              sx={{ bgcolor: 'text.primary', borderRadius: 4 }}
              variant="contained"
            >
              My Collection
            </Button>
            <Button
              component={Link}
              href="/eureka"
              sx={{ color: 'text.primary', borderColor: 'text.primary', borderRadius: 4 }}
              variant="outlined"
            >
              Browse Sets
            </Button>
          </>
        ) : (
          <>
            <Button
              component={Link}
              href="/auth/sign-up"
              sx={{ bgcolor: 'text.primary', borderRadius: 4 }}
              variant="contained"
            >
              Sign Up Free
            </Button>
            <Button
              component={Link}
              href="/eureka"
              sx={{ color: 'text.primary', borderColor: 'text.primary', borderRadius: 4 }}
              variant="outlined"
            >
              Browse Sets
            </Button>
          </>
        )}
      </Stack>
      <Divider />
    </Stack>
  )
}
