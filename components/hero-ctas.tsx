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
          <Button component={Link} href="/profile" variant="contained" sx={{ bgcolor: 'text.primary', borderRadius: 4 }}>
            My Collection
          </Button>
          <Button component={Link} href="/eureka" variant="outlined" sx={{ color: 'text.primary', borderColor: 'text.primary', borderRadius: 4 }}>
            Browse Sets
          </Button>
        </>
      ) : (
        <>
          <Button
            component={Link}
            href="/auth/sign-up"
            variant="contained"
						sx={{ bgcolor: 'text.primary', borderRadius: 4 }}
          >
            Sign Up Free
          </Button>
          <Button component={Link} href="/eureka" variant="outlined" sx={{ color: 'text.primary', borderColor: 'text.primary', borderRadius: 4 }}>
            Browse Sets
          </Button>
        </>
      )}
    </Stack>
		<Divider />
		</Stack>
  )
}
