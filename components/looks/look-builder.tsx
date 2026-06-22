'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardActionArea,
  Chip,
  Divider,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CloseIcon from '@mui/icons-material/Close'
import SearchIcon from '@mui/icons-material/Search'
import DiamondOutlinedIcon from '@mui/icons-material/DiamondOutlined'
import CheckroomIcon from '@mui/icons-material/Checkroom'
import WatchOutlinedIcon from '@mui/icons-material/WatchOutlined'
import CategoryIcon from '@mui/icons-material/Category'
import DoNotDisturbIcon from '@mui/icons-material/DoNotDisturb'
import SaveIcon from '@mui/icons-material/Save'
import { toTitle } from '@/lib/utils'
import { categoryIconSrc } from '@/lib/look-utils'
import LazyImage from '@/components/lazy-image'
import type { FlatVariant, CustomLook } from '@/lib/types/looks'
import type { EurekaCategory } from '@/lib/types/eureka'
import type { OutfitCategory } from '@/lib/types/outfit'
import { DRESS_SLUGS, isCategoryDisabled } from '@/components/filter/outfit-category-select'
import ToggleIcon from '../toggle-icon'
import ImageUpload from '@/components/forms/image-upload'
import NavBarToolbar from '@/components/navbar/navbar-toolbar'
import { ExpandMore } from '@mui/icons-material'

// Outfit categories carry a `part` that buckets them into these two groups.
const PIECES_PART = 'Pieces'
const ACCESSORIES_PART = 'Accessories'

type TabKey = 'pieces' | 'accessories' | 'eureka'

type SavePayload = {
  name: string
  description: string | null
  eureka_variant_slugs: string[]
  outfit_variant_slugs: string[]
}

// Short detail caption for a selected variant: the eureka color, or the outfit
// evolution (sans the set prefix; the unevolved "base" has none). Empty when
// there's no distinguishing detail.
function variantCaption(v: FlatVariant): string {
  if (v.type === 'eureka') return v.color ? toTitle(v.color) : ''
  if (!v.evolution) return ''
  // Outfit evolution slugs look like `{setSlug}-{evolution}`; "base" is unevolved.
  const evolution = v.evolution.startsWith(`${v.setSlug}-`)
    ? v.evolution.slice(v.setSlug.length + 1)
    : v.evolution
  return evolution === 'base' ? '' : toTitle(evolution)
}

type VariantCardProps = {
  variant: FlatVariant
  selected: boolean
  onToggle: (slug: string) => void
}

function VariantCard({ variant, selected, onToggle }: VariantCardProps) {
  const label =
    variant.type === 'eureka'
      ? `${toTitle(variant.category)}${variant.color ? ` · ${toTitle(variant.color)}` : ''}`
      : `${toTitle(variant.category)}${variant.evolution ? ` · ${toTitle(variant.evolution)}` : ''}`

  return (
    <Card
      sx={{
        outline: selected ? '2px solid' : '1px solid',
        outlineColor: selected ? 'primary.main' : 'transparent',
        bgcolor: selected ? 'surface.containerLow' : 'surface.containerHighest',
        transition: 'all 0.15s',
        position: 'relative',
        minWidth: 0,
      }}
    >
      <CardActionArea sx={{ p: 0.75 }} onClick={() => onToggle(variant.slug)}>
        <Stack sx={{ alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ position: 'relative' }}>
            <LazyImage
              alt={variant.slug}
              color="transparent"
              size="md"
              src={variant.image_url ?? undefined}
              sx={{ bgcolor: 'transparent', color: 'text.disabled' }}
            >
              <CategoryIcon fontSize="inherit" />
            </LazyImage>
            {selected && (
              <CheckCircleIcon
                color="primary"
                sx={{
                  position: 'absolute',
                  bottom: -4,
                  right: -4,
                  fontSize: 18,
                  bgcolor: 'surface.containerLowest',
                  borderRadius: '50%',
                }}
              />
            )}
          </Box>
          <Typography
            align="center"
            color="textSecondary"
            sx={{
              fontSize: '0.65rem',
              lineHeight: 1.2,
              maxWidth: 72,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              width: '100%',
            }}
            variant="caption"
          >
            {label}
          </Typography>
        </Stack>
      </CardActionArea>
    </Card>
  )
}

type CategoryRowProps = {
  categorySlug: string
  categoryTitle: string
  iconSrc?: string
  totalCount: number
  selectedLabel?: string
  disabled?: boolean
  disabledReason?: string
  onSelect: (slug: string) => void
}

function CategoryRow({
  categorySlug,
  categoryTitle,
  iconSrc,
  totalCount,
  selectedLabel,
  disabled,
  disabledReason,
  onSelect,
}: CategoryRowProps) {
  const card = (
    <Card
      sx={{
        opacity: disabled ? 0.55 : 1,
        borderStyle: disabled ? 'dashed' : 'solid',
        borderColor: disabled ? 'divider' : undefined,
        transition: 'opacity 0.15s',
      }}
      variant="outlined"
    >
      <CardActionArea
        disabled={disabled}
        sx={{ px: 1.5, py: 1 }}
        onClick={() => onSelect(categorySlug)}
      >
        <Stack direction="row" sx={{ alignItems: 'center', gap: 1.5 }}>
          {disabled ? (
            <Avatar
              sx={{
                width: 40,
                height: 40,
                bgcolor: 'surface.containerHighest',
                color: 'text.disabled',
                flexShrink: 0,
              }}
              variant="rounded"
            >
              <DoNotDisturbIcon fontSize="small" />
            </Avatar>
          ) : (
            <ToggleIcon item={{ title: categoryTitle, image: iconSrc }} size="sm" />
          )}
          <Stack sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              noWrap
              color={disabled ? 'textDisabled' : 'textPrimary'}
              sx={{ fontWeight: 500 }}
              variant="body2"
            >
              {categoryTitle}
            </Typography>
            <Typography color="textSecondary" variant="caption">
              {disabled
                ? (disabledReason ?? 'Unavailable')
                : `${totalCount} piece${totalCount !== 1 ? 's' : ''}`}
            </Typography>
          </Stack>
          {selectedLabel && !disabled && (
            <Chip
              color="primary"
              label={selectedLabel}
              size="small"
              sx={{ maxWidth: 140, flexShrink: 0 }}
              variant="outlined"
            />
          )}
        </Stack>
      </CardActionArea>
    </Card>
  )

  if (disabled && disabledReason) {
    return (
      <Tooltip placement="top" title={disabledReason}>
        <span>{card}</span>
      </Tooltip>
    )
  }

  return card
}

export default function LookBuilder({
  initialLook,
  eurekaVariants,
  outfitVariants,
  eurekaCategories,
  outfitCategories,
  cancelHref = '/looks',
  onSave,
}: {
  initialLook?: Pick<
    CustomLook,
    | 'id'
    | 'name'
    | 'description'
    | 'image_url'
    | 'slug'
    | 'eureka_variant_slugs'
    | 'outfit_variant_slugs'
  >
  eurekaVariants: FlatVariant[]
  outfitVariants: FlatVariant[]
  eurekaCategories: EurekaCategory[]
  outfitCategories: OutfitCategory[]
  cancelHref?: string
  onSave: (data: SavePayload) => Promise<{ error?: string } | { id?: string }>
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [name, setName] = useState(initialLook?.name ?? '')
  const [description, setDescription] = useState(initialLook?.description ?? '')
  const [imageUrl, setImageUrl] = useState(initialLook?.image_url ?? null)
  const [selectedSlugs, setSelectedSlugs] = useState<Set<string>>(
    () =>
      new Set([
        ...(initialLook?.eureka_variant_slugs ?? []),
        ...(initialLook?.outfit_variant_slugs ?? []),
      ])
  )
  const [tab, setTab] = useState<TabKey>('pieces')
  const [search, setSearch] = useState('')
  const [activeCategorySlug, setActiveCategorySlug] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Selected variants as FlatVariant (for chips in composer)
  const allVariants = useMemo(
    () => [...eurekaVariants, ...outfitVariants],
    [eurekaVariants, outfitVariants]
  )
  // slug → FlatVariant lookup, used to resolve a slug's category/type on select
  const variantBySlug = useMemo(() => new Map(allVariants.map((v) => [v.slug, v])), [allVariants])

  // Toggle a piece. Selecting one auto-deselects any other selected piece in the
  // same category and type (one piece per category, scoped per type).
  function selectPiece(slug: string) {
    setSelectedSlugs((prev) => {
      const next = new Set(prev)
      if (next.has(slug)) {
        next.delete(slug)
        return next
      }
      const picked = variantBySlug.get(slug)
      if (picked) {
        for (const s of next) {
          const v = variantBySlug.get(s)
          if (v && v.type === picked.type && v.category === picked.category) next.delete(s)
        }
      }
      next.add(slug)
      return next
    })
  }

  // Plain deselect (no replacement) — used by composer chips.
  function removeSlug(slug: string) {
    setSelectedSlugs((prev) => {
      const next = new Set(prev)
      next.delete(slug)
      return next
    })
  }

  const currentVariants = useMemo(() => {
    if (tab === 'eureka') return eurekaVariants
    const part = tab === 'pieces' ? PIECES_PART : ACCESSORIES_PART
    return outfitVariants.filter((v) => v.part === part)
  }, [tab, eurekaVariants, outfitVariants])
  const currentCategories = useMemo(() => {
    if (tab === 'eureka') return eurekaCategories
    const part = tab === 'pieces' ? PIECES_PART : ACCESSORIES_PART
    return outfitCategories.filter((c) => c.part === part)
  }, [tab, eurekaCategories, outfitCategories])

  // Outfit category slugs that currently have a selected piece. Drives the
  // mutually-exclusive dress vs tops/bottoms rule in the Pieces tab.
  const selectedOutfitCategorySlugs = useMemo(() => {
    const slugs = new Set<string>()
    for (const v of allVariants) {
      if (v.type === 'outfit' && v.category && selectedSlugs.has(v.slug)) slugs.add(v.category)
    }
    return Array.from(slugs)
  }, [allVariants, selectedSlugs])

  // Why outfit rows get disabled, given the current selection (same for every
  // disabled row in a given state).
  const hasDressSelected = selectedOutfitCategorySlugs.some((s) => DRESS_SLUGS.includes(s))
  const outfitConflictReason = hasDressSelected
    ? "Can't combine with a dress — remove the dress first"
    : "Can't combine with tops or bottoms — remove them first"

  // Group variants by category, in canonical category order; drop empty categories.
  const categoryGroups = useMemo(() => {
    const map = new Map<string, { title: string; variants: FlatVariant[] }>()
    for (const c of currentCategories) {
      map.set(c.slug, { title: c.title, variants: [] })
    }
    for (const v of currentVariants) {
      if (!v.category) continue
      const group = map.get(v.category)
      if (group) group.variants.push(v)
      else map.set(v.category, { title: v.categoryTitle, variants: [v] })
    }
    for (const [slug, group] of map) {
      if (group.variants.length === 0) map.delete(slug)
    }
    return map
  }, [currentVariants, currentCategories])

  // Filter categories by search
  const filteredCategorySlugs = useMemo(() => {
    const q = search.toLowerCase()
    return Array.from(categoryGroups.keys()).filter((slug) =>
      q ? categoryGroups.get(slug)!.title.toLowerCase().includes(q) : true
    )
  }, [categoryGroups, search])

  const activeCategoryVariants = useMemo(() => {
    if (!activeCategorySlug) return []
    return categoryGroups.get(activeCategorySlug)?.variants ?? []
  }, [categoryGroups, activeCategorySlug])

  const selectedItems = useMemo(
    () => allVariants.filter((v) => selectedSlugs.has(v.slug)),
    [allVariants, selectedSlugs]
  )
  const selectedPieces = selectedItems.filter((v) => v.type === 'outfit' && v.part === PIECES_PART)
  const selectedAccessories = selectedItems.filter(
    (v) => v.type === 'outfit' && v.part === ACCESSORIES_PART
  )
  const selectedEureka = selectedItems.filter((v) => v.type === 'eureka')

  function handleSave() {
    if (!name.trim()) return
    setSaveError(null)
    startTransition(async () => {
      const eurekaSlugSet = new Set(eurekaVariants.map((v) => v.slug))
      const result = await onSave({
        name: name.trim(),
        description: description.trim() || null,
        eureka_variant_slugs: [...selectedSlugs].filter((s) => eurekaSlugSet.has(s)),
        outfit_variant_slugs: [...selectedSlugs].filter((s) => !eurekaSlugSet.has(s)),
      })
      if ('error' in result && result.error) {
        if (result.error === 'free_limit_reached') {
          setSaveError("You've reached the 5-look limit for free accounts. Upgrade to save more.")
        } else {
          setSaveError(result.error)
        }
      } else {
        router.push('/looks')
      }
    })
  }

  // ── Composer panel (right / top) ────────────────────────────────────────
  const saveLabel = initialLook ? 'Save changes' : 'Create look'

  // One labelled group of selected-item chips, in tab order (Pieces /
  // Accessories / Eureka).
  function selectedSection(label: string, icon: React.ReactNode, items: FlatVariant[]) {
    if (items.length === 0) return null
    return (
      <List
        dense
        disablePadding
        subheader={
          <Stack direction="row" sx={{ alignItems: 'center', gap: 0.5, pb: 1, pt: 1.5 }}>
            {icon}
            <Typography color="textSecondary" variant="caption">
              {label}
            </Typography>
          </Stack>
        }
      >
        {items.map((v) => {
          const caption = variantCaption(v)
          const primary = v.title || v.setTitle
          return (
            <ListItem
              key={v.slug}
              disablePadding
              secondaryAction={
                <IconButton
                  aria-label="delete"
                  edge="end"
                  size="small"
                  onClick={() => removeSlug(v.slug)}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              }
            >
              <ListItemAvatar>
                <LazyImage alt={primary} kind="square" size="sm" src={v.image_url ?? undefined} />
              </ListItemAvatar>
              <ListItemText disableTypography>
                <Stack sx={{ height: 40 }}>
                  <Typography component="span" variant="subtitle2">
                    {primary}
                  </Typography>
                  <Typography variant="caption">{caption || undefined}</Typography>
                </Stack>
              </ListItemText>
            </ListItem>
          )
        })}
      </List>
    )
  }
  const composerPanel = (
    <Stack spacing={2} sx={{ minWidth: 0 }}>
      <TextField
        fullWidth
        required
        label="Look name"
        placeholder="e.g. Moonlit Wanderer"
        size="small"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <TextField
        fullWidth
        multiline
        label="Description"
        maxRows={3}
        minRows={2}
        placeholder="Optional notes about this look…"
        size="small"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      {initialLook?.slug && (
        <ImageUpload
          caption="Cover image"
          column="image_url"
          size="lg"
          slug={initialLook.slug}
          table="custom_looks"
          url={imageUrl}
          onUpload={setImageUrl}
        />
      )}

      {!initialLook && (
        <Alert severity="info">
          A cover image can be added after saving — edit the look to upload one.
        </Alert>
      )}

      <Stack spacing={1}>
        {selectedItems.length > 0 && (
          <Accordion disableGutters>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography color="textSecondary" variant="caption">
                {selectedItems.length} piece{selectedItems.length !== 1 ? 's' : ''} selected
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ pr: 0 }}>
              {selectedSection(
                'Pieces',
                <CheckroomIcon sx={{ fontSize: 14, color: 'text.secondary' }} />,
                selectedPieces
              )}
              {selectedSection(
                'Accessories',
                <WatchOutlinedIcon sx={{ fontSize: 14, color: 'text.secondary' }} />,
                selectedAccessories
              )}
              {selectedSection(
                'Eureka',
                <DiamondOutlinedIcon sx={{ fontSize: 14, color: 'text.secondary' }} />,
                selectedEureka
              )}
            </AccordionDetails>
          </Accordion>
        )}

        {selectedItems.length === 0 && (
          <Typography color="textSecondary" variant="caption">
            Pick pieces from the panel to add them here.
          </Typography>
        )}
      </Stack>

      {saveError && <Alert severity="error">{saveError}</Alert>}
    </Stack>
  )

  // ── Picker panel (left / bottom) ─────────────────────────────────────────
  const pickerPanel = (
    <Stack spacing={1.5} sx={{ minWidth: 0 }}>
      <Tabs
        value={tab}
        variant="fullWidth"
        onChange={(_, v: TabKey) => {
          setTab(v)
          setActiveCategorySlug(null)
          setSearch('')
        }}
      >
        <Tab
          icon={<CheckroomIcon fontSize="small" />}
          iconPosition="start"
          label="Pieces"
          sx={{ minHeight: 40, minWidth: 0 }}
          value="pieces"
        />
        <Tab
          icon={<WatchOutlinedIcon fontSize="small" />}
          iconPosition="start"
          label="Accessories"
          sx={{ minHeight: 40, minWidth: 0 }}
          value="accessories"
        />
        <Tab
          icon={<DiamondOutlinedIcon fontSize="small" />}
          iconPosition="start"
          label="Eureka"
          sx={{ minHeight: 40, minWidth: 0 }}
          value="eureka"
        />
      </Tabs>

      {activeCategorySlug ? (
        <Stack spacing={1.5}>
          <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
            <IconButton size="small" onClick={() => setActiveCategorySlug(null)}>
              <ArrowBackIcon fontSize="small" />
            </IconButton>
            <Typography sx={{ fontWeight: 500 }} variant="body2">
              {categoryGroups.get(activeCategorySlug)?.title}
            </Typography>
          </Stack>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
              gap: 1,
            }}
          >
            {activeCategoryVariants.map((v) => (
              <VariantCard
                key={v.slug}
                selected={selectedSlugs.has(v.slug)}
                variant={v}
                onToggle={selectPiece}
              />
            ))}
          </Box>
        </Stack>
      ) : (
        <Stack spacing={1}>
          <TextField
            fullWidth
            placeholder="Search categories…"
            size="small"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: search ? (
                  <InputAdornment position="end">
                    <IconButton edge="end" size="small" onClick={() => setSearch('')}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              },
            }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Stack spacing={0.75}>
            {filteredCategorySlugs.length === 0 && (
              <Typography color="textSecondary" sx={{ py: 2, textAlign: 'center' }} variant="body2">
                No categories found.
              </Typography>
            )}
            {filteredCategorySlugs.map((slug) => {
              const group = categoryGroups.get(slug)!
              const selectedVariant = group.variants.find((v) => selectedSlugs.has(v.slug))
              const disabled =
                tab === 'pieces' &&
                isCategoryDisabled({ slug } as OutfitCategory, selectedOutfitCategorySlugs)
              return (
                <CategoryRow
                  key={slug}
                  categorySlug={slug}
                  categoryTitle={group.title}
                  disabled={disabled}
                  disabledReason={disabled ? outfitConflictReason : undefined}
                  iconSrc={categoryIconSrc(slug)}
                  selectedLabel={selectedVariant?.setTitle}
                  totalCount={group.variants.length}
                  onSelect={setActiveCategorySlug}
                />
              )
            })}
          </Stack>
        </Stack>
      )}
    </Stack>
  )

  return (
    <>
      <NavBarToolbar>
        <Typography variant="subtitle2">{initialLook ? 'Edit Look' : 'New Look'}</Typography>
        <Stack direction="row" spacing={1} sx={{ flex: 1, justifyContent: 'flex-end' }}>
          <Button component="a" href={cancelHref} variant="outlined">
            Cancel
          </Button>
          <Button
            color="primary"
            disabled={!name.trim() || isPending}
            startIcon={<SaveIcon />}
            variant="contained"
            onClick={handleSave}
          >
            {isPending ? 'Saving…' : saveLabel}
          </Button>
        </Stack>
      </NavBarToolbar>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 340px' },
          gap: 3,
          alignItems: 'start',
        }}
      >
        {/* On mobile, composer comes first */}
        <Box sx={{ display: { xs: 'block', md: 'none' } }}>{composerPanel}</Box>
        <Box sx={{ display: { xs: 'block', md: 'none' } }}>
          <Divider />
        </Box>

        {/* Picker (left on desktop, bottom on mobile) */}
        {pickerPanel}

        {/* Composer (right on desktop, hidden on mobile since it's at top) */}
        <Box
          sx={{
            display: { xs: 'none', md: 'block' },
            position: 'sticky',
            top: 80,
          }}
        >
          {composerPanel}
        </Box>
      </Box>
    </>
  )
}
