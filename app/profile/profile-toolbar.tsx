'use client'
import NavBarToolbar from '@/components/navbar/navbar-toolbar'
import { AdminPanelSettings } from '@mui/icons-material'
import { Chip, Stack } from '@mui/material'
import Link from 'next/link'

export default function ProfileToolbar({ isAdmin = false }: { isAdmin?: boolean }) {
  return (
    <NavBarToolbar>
      {isAdmin && (
        <Stack
          direction="row"
          spacing={1}
          sx={{ flexGrow: 1, alignItems: 'center', justifyContent: 'flex-end' }}
        >
          <Chip
            clickable
            color="secondary"
            component={Link}
            href="/admin"
            icon={<AdminPanelSettings />}
            label="Admin access"
            variant="outlined"
          />
        </Stack>
      )}
    </NavBarToolbar>
  )
}
