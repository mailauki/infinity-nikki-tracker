'use client'

import { IconButton, Tooltip } from '@mui/material'
import ToolbarSlot from '@/components/navbar/toolbar-slot'
import { useParams, usePathname } from 'next/navigation'
import { ChevronLeft, Edit, InfoOutlined } from '@mui/icons-material'
import ImageModeButton from '@/components/navbar/image-mode-button'
import MakeupImageModeButton from '@/components/makeup/makeup-image-mode-button'
import { useSeasonFilterOptional } from '@/app/outfits/seasons/[slug]/season-filter-context'
import { useSidebar } from '@/components/navbar/navbar-toolbar-context'
import SeasonVisibilityMenu from '@/app/outfits/seasons/[slug]/season-visibility-menu'

export default function SlugToolBar({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname()
  const { slug } = useParams()
  const seasonFilter = useSeasonFilterOptional()
  // The details sidebar toggle only shows once a page has mounted a <SidebarBody>
  // (e.g. the outfit set-detail card) — self-activating and inert elsewhere.
  const { sidebarOpen, setSidebarOpen, hasBody } = useSidebar()

  // The image swap is available to everyone on the outfits slug pages, including
  // a season's page — its cards render through the same image-mode-aware cards —
  // and on momo-cloaks and makeup, whose detail pages render a set image with an
  // alternate. Each domain has its own image-mode context, so the matching
  // button is rendered rather than the context being picked here.
  const isMakeupSlug = pathname.startsWith('/makeup/')
  const showImageSwap =
    isMakeupSlug || pathname.startsWith('/outfits/') || pathname.startsWith('/momo-cloaks/')

  // Most domains nest their admin CRUD under a `/sets` segment
  // (/admin/eureka/sets/edit/…), so a top-level slug page maps to `<domain>/sets`.
  // Momo's Cloaks is flat — its admin route is /admin/momo-cloaks/edit/… with no
  // `/sets` — because a cloak has no variants to separate sets from.
  const domain = pathname.split('/')[1]
  const isTopLevelSlug = pathname.split('/')[2] === slug
  const adminRoot = domain === 'momo-cloaks' ? domain : `${domain}/sets`
  const path = isTopLevelSlug ? adminRoot : pathname.split('/').slice(1, 3).join('/')
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
      {seasonFilter && <SeasonVisibilityMenu />}
      {showImageSwap && (isMakeupSlug ? <MakeupImageModeButton /> : <ImageModeButton />)}
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
