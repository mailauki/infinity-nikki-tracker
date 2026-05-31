'use client'

import { IconButton, Stack } from '@mui/material'
import SubAppBar from '@/components/sub-appbar'
import { useParams, usePathname } from 'next/navigation'
import { Edit } from '@mui/icons-material'

export default function EditToolBar({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname()
  const { slug } = useParams()
  const path =
    pathname.split('/')[2] === slug
      ? `${pathname.split('/')[1]}/sets`
      : pathname.split('/').slice(1, 3).join('/')

  if (!isAdmin) return null

  return (
    <SubAppBar>
      <Stack direction="row" justifyContent="flex-end" sx={{ flex: 1 }}>
        <IconButton component="a" href={`/${path}/edit/${slug}`}>
          <Edit />
        </IconButton>
      </Stack>
    </SubAppBar>
  )
}
