'use client'

import { Button, Stack } from '@mui/material'
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
    <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
      {isLoggedIn ? (
        <>
          <Button component={Link} href="/profile" variant="contained" sx={buttonSx.contained}>
            My Collection
          </Button>
          <Button component={Link} href="/eureka" variant="outlined" sx={buttonSx.outlined}>
            Browse Sets
          </Button>
        </>
      ) : (
        <>
          <Button
            component={Link}
            href="/auth/sign-up"
            variant="contained"
            sx={buttonSx.contained}
          >
            Sign Up Free
          </Button>
          <Button component={Link} href="/eureka" variant="outlined" sx={buttonSx.outlined}>
            Browse Sets
          </Button>
        </>
      )}
    </Stack>
  )
}
