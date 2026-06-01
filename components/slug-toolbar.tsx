'use client'

import { IconButton, Stack } from '@mui/material'
import NavBarToolbar from '@/components/navbar/navbar-toolbar'
import { useParams, usePathname } from 'next/navigation'
import { ChevronLeft, Edit } from '@mui/icons-material'

export default function SlugToolBar({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname()
  const { slug } = useParams()
  const path =
    pathname.split('/')[2] === slug
      ? `${pathname.split('/')[1]}/sets`
      : pathname.split('/').slice(1, 3).join('/')
  const backUrl =
    pathname.split('/')[2] === slug
      ? `${pathname.split('/')[1]}`
      : pathname.split('/').slice(1, 3).join('/')

  if (!isAdmin) return null

  return (
    <NavBarToolbar>
      <Stack direction="row" justifyContent="space-between" sx={{ flex: 1 }}>
        <IconButton component="a" href={`/${backUrl}`}>
          <ChevronLeft />
        </IconButton>
        <IconButton component="a" href={`/${path}/edit/${slug}`}>
          <Edit />
        </IconButton>
      </Stack>
    </NavBarToolbar>
  )
}
