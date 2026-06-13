'use client'

import { Button, Stack } from '@mui/material'
import Link from 'next/link'

export function HeroCTAs({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <Stack spacing={1.5} sx={{ flexGrow: 1 }}>
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
              href="/sign-up"
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
    </Stack>
  )
}
