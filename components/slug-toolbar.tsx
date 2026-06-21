'use client'

import { IconButton, Stack, Tooltip } from '@mui/material'
import NavBarToolbar from '@/components/navbar/navbar-toolbar'
import { useParams, usePathname } from 'next/navigation'
import { ChevronLeft, Compare, Edit } from '@mui/icons-material'
import { useOutfitImageMode } from '@/components/outfits/outfit-image-mode-context'
import { useSeasonFilterOptional } from '@/app/outfits/seasons/[slug]/season-filter-context'
import EvolutionToggle from '@/components/filter/evolution-toggle'
import GlowupToggle from '@/components/filter/glowup-toggle'

export default function SlugToolBar({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname()
  const { slug } = useParams()
  const { mode, cycleMode } = useOutfitImageMode()
  const seasonFilter = useSeasonFilterOptional()

  // The image swap is available to everyone on the outfits slug page.
  const showImageSwap = pathname.startsWith('/outfits/') && !pathname.includes('seasons')

  const IMAGE_MODE_LABEL = {
    image: 'Showing main image',
    alt: 'Showing alternate image',
  } as const

  const path =
    pathname.split('/')[2] === slug
      ? `${pathname.split('/')[1]}/sets`
      : pathname.split('/').slice(1, 3).join('/')
  const backUrl =
    pathname.split('/')[2] === slug
      ? `${pathname.split('/')[1]}`
      : pathname.split('/').slice(1, 3).join('/')

  return (
    <NavBarToolbar>
      <Stack
        direction="row"
        sx={{ flex: 1, alignItems: 'center', justifyContent: 'space-between' }}
      >
        <IconButton component="a" href={`/${backUrl}`}>
          <ChevronLeft />
        </IconButton>

        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
          {seasonFilter && (
            <>
              <EvolutionToggle
                hideEvolutions={seasonFilter.hideEvolutions}
                onHideEvolutionsChange={seasonFilter.onHideEvolutionsChange}
              />
              <GlowupToggle
                hideGlowups={seasonFilter.hideGlowups}
                onHideGlowupsChange={seasonFilter.onHideGlowupsChange}
              />
            </>
          )}
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
