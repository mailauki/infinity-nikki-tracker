'use client'

import { IconButton, Tooltip } from '@mui/material'
import ToolbarSlot from '@/components/navbar/toolbar-slot'
import { useParams, usePathname } from 'next/navigation'
import { ChevronLeft, Edit, InfoOutlined, Toc } from '@mui/icons-material'
import ImageModeButton from '@/components/navbar/image-mode-button'
import MakeupImageModeButton from '@/components/makeup/makeup-image-mode-button'
import SeasonImageModeButton from '@/components/navbar/season-image-mode-button'
import { SortButton } from '@/components/navbar/appbar-actions'
import FilterMenu from '@/components/filter/filter-menu'
import { useSidebar } from '@/components/navbar/navbar-toolbar-context'
import { useSeasonFilterOptional } from '@/app/seasons/[slug]/season-filter-context'

export default function SlugToolBar({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname()
  const { slug } = useParams()
  // The details sidebar toggle only shows once a page has mounted a <SidebarBody>
  // (e.g. the outfit set-detail card) — self-activating and inert elsewhere.
  const { sidebarOpen, setSidebarOpen, hasBody, activePanel, setActivePanel } = useSidebar()
  // null outside the seasons route tree (no throw) — SlugToolBar renders on every
  // domain's slug page, so this doubles as "is this a season page" without a
  // pathname check. SeasonFilterProvider wraps both /seasons and /seasons/<slug>
  // in app/seasons/layout.tsx, so a non-null value here is specific enough: this
  // component only ever renders on a slug page in the first place.
  const seasonFilter = useSeasonFilterOptional()

  // The image swap is available to everyone on the outfits slug pages, including
  // a season's page — its cards render through the same image-mode-aware cards —
  // and on momo-cloaks and makeup, whose detail pages render a set image with an
  // alternate. Each domain has its own image-mode context, so the matching
  // button is rendered rather than the context being picked here.
  const isMakeupSlug = pathname.startsWith('/makeup/')
  const showImageSwap =
    isMakeupSlug ||
    pathname.startsWith('/outfits/') ||
    pathname.startsWith('/momo-cloaks/') ||
    pathname.startsWith('/seasons/')

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

  // A season page renders outfit AND makeup cards together, and each domain has
  // its own image-mode context — so it needs the button that drives both, not
  // the outfit-only one, which left every makeup piece on its main image.
  let imageSwapButton = <ImageModeButton />
  if (seasonFilter) imageSwapButton = <SeasonImageModeButton />
  else if (isMakeupSlug) imageSwapButton = <MakeupImageModeButton />

  return (
    <ToolbarSlot
      lead={
        <IconButton aria-label="Back" component="a" href={`/${backUrl}`}>
          <ChevronLeft />
        </IconButton>
      }
    >
      {showImageSwap && imageSwapButton}
      {isAdmin && (
        <IconButton aria-label="Edit in admin" component="a" href={`/admin/${path}/edit/${slug}`}>
          <Edit />
        </IconButton>
      )}
      {seasonFilter && <SortButton />}
      {/* FilterMenu's isSeasons branch supplies its own IconButton (density,
          visibility, obtained/rarity/style — Task 4's panel) and its own
          <SidebarBody panelId="filters">. This is the only place that branch is
          reachable from — no other toolbar mounts FilterMenu on a season page —
          so without this, the filter panel exists but has no way to open. */}
      {seasonFilter && <FilterMenu />}
      {seasonFilter && (
        <ContentsButton
          activePanel={activePanel}
          setActivePanel={setActivePanel}
          setSidebarOpen={setSidebarOpen}
          sidebarOpen={sidebarOpen}
        />
      )}
      {/* The season page mounts its own sidebar body (SeasonContents) covered by
          ContentsButton above — this generic details toggle is for every other
          slug page's single SidebarBody (outfit/eureka/makeup set-detail cards),
          so it's suppressed here to avoid a second, redundant toggle for the same
          sidebar on the season page. */}
      {hasBody && !seasonFilter && (
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

// Toggles the season page's table-of-contents panel. Claims `activePanel` so
// opening it replaces whatever else is showing in the same sidebar (the filter
// panel from FilterMenu's isSeasons branch) rather than portaling both bodies in
// at once — see SidebarBody's panelId prop.
function ContentsButton({
  sidebarOpen,
  setSidebarOpen,
  activePanel,
  setActivePanel,
}: {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  activePanel: string | null
  setActivePanel: (panel: string | null) => void
}) {
  const contentsOpen = sidebarOpen && activePanel === 'contents'

  const toggleContents = () => {
    if (contentsOpen) {
      setSidebarOpen(false)
    } else {
      setActivePanel('contents')
      setSidebarOpen(true)
    }
  }

  return (
    <Tooltip title={contentsOpen ? 'Hide contents' : 'Show contents'}>
      <IconButton
        aria-label={contentsOpen ? 'Hide contents' : 'Show contents'}
        color={contentsOpen ? 'primary' : 'default'}
        onClick={toggleContents}
      >
        <Toc />
      </IconButton>
    </Tooltip>
  )
}
