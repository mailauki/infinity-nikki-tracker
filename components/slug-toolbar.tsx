'use client'

import { IconButton, Stack, Tooltip } from '@mui/material'
import NavBarToolbar from '@/components/navbar/navbar-toolbar'
import { useParams, usePathname } from 'next/navigation'
import { ChevronLeft, Compare, Edit, Flip } from '@mui/icons-material'
import { useOutfitImageMode } from '@/components/outfits/outfit-image-mode-context'

export default function SlugToolBar({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname()
  const { slug } = useParams()
  const { mode, cycleMode } = useOutfitImageMode()

  // The image swap is available to everyone on the outfits slug page.
  const showImageSwap = pathname.startsWith('/outfits/')

  const IMAGE_MODE_LABEL = {
    image: 'Showing main image',
    alt: 'Showing alternate image',
    poster: 'Showing poster image',
  } as const

  const path =
    pathname.split('/')[2] === slug
      ? `${pathname.split('/')[1]}/sets`
      : pathname.split('/').slice(1, 3).join('/')
  const backUrl =
    pathname.split('/')[2] === slug
      ? `${pathname.split('/')[1]}`
      : pathname.split('/').slice(1, 3).join('/')

  if (!isAdmin && !showImageSwap) return null

  return (
    <NavBarToolbar>
      <Stack
        direction="row"
        sx={{ flex: 1, alignItems: 'center', justifyContent: 'space-between' }}
      >
        {isAdmin ? (
          <IconButton component="a" href={`/${backUrl}`}>
            <ChevronLeft />
          </IconButton>
        ) : (
          <span />
        )}

        <Stack direction="row" spacing={0.5}>
          {showImageSwap && (
            <Tooltip title={IMAGE_MODE_LABEL[mode]}>
              <IconButton aria-label={IMAGE_MODE_LABEL[mode]} onClick={cycleMode}>
                <Compare />
              </IconButton>
            </Tooltip>
          )}
          {isAdmin && (
            <IconButton component="a" href={`/admin/${path}/edit/${slug}`}>
              <Edit />
            </IconButton>
          )}
        </Stack>
      </Stack>
    </NavBarToolbar>
  )
}
