'use client'

import { IconButton, Tooltip } from '@mui/material'
import ToolbarSlot from '@/components/navbar/toolbar-slot'
import { useParams, usePathname } from 'next/navigation'
import { ChevronLeft, Compare, Edit, InfoOutlined } from '@mui/icons-material'
import { useOutfitImageMode } from '@/components/outfits/outfit-image-mode-context'
import { useSeasonFilterOptional } from '@/app/outfits/seasons/[slug]/season-filter-context'
import { useSidebar } from '@/components/navbar/navbar-toolbar-context'
import SeasonVisibilityMenu from '@/app/outfits/seasons/[slug]/season-visibility-menu'

export default function SlugToolBar({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname()
  const { slug } = useParams()
  const { mode, cycleMode } = useOutfitImageMode()
  const seasonFilter = useSeasonFilterOptional()
  // The details sidebar toggle only shows once a page has mounted a <SidebarBody>
  // (e.g. the outfit set-detail card) — self-activating and inert elsewhere.
  const { sidebarOpen, setSidebarOpen, hasBody } = useSidebar()

  // The image swap is available to everyone on the outfits slug pages, including
  // a season's page — its cards render through the same image-mode-aware cards.
  const showImageSwap = pathname.startsWith('/outfits/')

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
    <ToolbarSlot
      lead={
        <IconButton component="a" href={`/${backUrl}`}>
          <ChevronLeft />
        </IconButton>
      }
    >
      {showImageSwap && (
        <Tooltip title={IMAGE_MODE_LABEL[mode]}>
          <IconButton aria-label={IMAGE_MODE_LABEL[mode]} onClick={cycleMode}>
            <Compare />
          </IconButton>
        </Tooltip>
      )}
      {seasonFilter && <SeasonVisibilityMenu />}
      {isAdmin && (
        <IconButton component="a" href={`/admin/${path}/edit/${slug}`}>
          <Edit />
        </IconButton>
      )}
      {hasBody && (
        <Tooltip title={sidebarOpen ? 'Hide details' : 'Show details'}>
          <IconButton
            aria-label={sidebarOpen ? 'Hide details' : 'Show details'}
            color={sidebarOpen ? 'primary' : 'default'}
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <InfoOutlined />
          </IconButton>
        </Tooltip>
      )}
    </ToolbarSlot>
  )
}
