'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Badge,
  Box,
  Button,
  Card,
  CardActionArea,
  CardHeader,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Stack,
  Step,
  StepButton,
  StepContent,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import DiamondOutlinedIcon from '@mui/icons-material/DiamondOutlined'
import CheckroomIcon from '@mui/icons-material/Checkroom'
import WatchOutlinedIcon from '@mui/icons-material/WatchOutlined'
import CategoryIcon from '@mui/icons-material/Category'
import EditNoteIcon from '@mui/icons-material/EditNote'
import SaveIcon from '@mui/icons-material/Save'
import { toTitle } from '@/lib/utils'
import LazyImage from '@/components/lazy-image'
import { FREE_LOOKS_LIMIT } from '@/lib/types/looks'
import type { FlatVariant, CustomLook } from '@/lib/types/looks'
import type { EurekaCategory } from '@/lib/types/eureka'
import type { OutfitCategory } from '@/lib/types/outfit'
import { DRESS_SLUGS, isCategoryDisabled } from '@/components/filter/outfit-category-select'
import ToggleIcon from '@/components/toggle-icon'
import ImageUpload from '@/components/forms/image-upload'
import NavBarToolbar from '@/components/navbar/navbar-toolbar'
import PageShell from '@/components/page-shell'
import { ExpandMore, TaskAlt } from '@mui/icons-material'
import SidebarBody from '@/components/sidebar/sidebar-body'
import { SIDEBAR_STORAGE_KEY } from '@/lib/layout-constants'
import { useSidebar } from '@/components/navbar/navbar-toolbar-context'
import TuneIcon from '@mui/icons-material/Tune'

// Outfit categories carry a `part` that buckets them into these two groups.
const PIECES_PART = 'Pieces'
const ACCESSORIES_PART = 'Accessories'

type SavePayload = {
  name: string
  description: string | null
  eureka_variant_slugs: string[]
  outfit_variant_slugs: string[]
}

type StepBucket = 'pieces' | 'accessories' | 'eureka'
type CategoryStep = {
  bucket: StepBucket
  slug: string
  title: string
  variants: FlatVariant[]
  selectedVariant?: FlatVariant
  disabled: boolean
  disabledReason?: string
}

// Detail caption for a selected variant, matching the VariantCard label format.
// Eureka always shows `color • category`. Outfits carry the set title for
// context when a variant title is the primary, otherwise lead with the category.
function variantCaption(v: FlatVariant): string {
  if (v.type === 'eureka') {
    return v.color ? `${toTitle(v.color)} • ${v.categoryTitle}` : v.categoryTitle
  }
  return v.title ? `${v.setTitle} • ${v.categoryTitle}` : v.categoryTitle
}

type VariantCardProps = {
  variant: FlatVariant
  selected: boolean
  onToggle: (slug: string) => void
}

function VariantCard({ variant, selected, onToggle }: VariantCardProps) {
  // Eureka always shows `color • category`. Outfits lead with the variant
  // title when present, otherwise fall back to `set title • category`.
  let label: string
  if (variant.type === 'eureka') {
    label = variant.color
      ? `${toTitle(variant.color)} • ${variant.categoryTitle}`
      : variant.categoryTitle
  } else {
    label = variant.title ? variant.title : `${variant.setTitle} • ${variant.categoryTitle}`
  }

  return (
    <Card>
      <CardActionArea
        data-active={selected ? '' : undefined}
        sx={{
          '&[data-active]': {
            backgroundColor: 'action.selected',
            '&:hover': {
              backgroundColor: 'action.selectedHover',
            },
          },
        }}
        onClick={() => onToggle(variant.slug)}
      >
        <Stack sx={{ pt: 1, alignItems: 'center' }}>
          <Badge
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            badgeContent={<TaskAlt fontSize="small" />}
            color="primary"
            invisible={!selected}
            sx={{ '& .MuiBadge-badge': { px: 0.25, py: 1.5, borderRadius: 40 } }}
          >
            <LazyImage
              alt={variant.slug}
              color="transparent"
              size="lg"
              src={variant.image_url ?? undefined}
              sx={{ bgcolor: 'transparent', color: 'text.disabled' }}
            >
              <CategoryIcon fontSize="inherit" />
            </LazyImage>
          </Badge>
        </Stack>
        <CardHeader
          slotProps={{
            title: { variant: 'subtitle2', noWrap: true },
            subheader: { variant: 'caption', noWrap: true },
          }}
          subheader={variant.setTitle}
          sx={{ p: 1.5, '& .MuiCardHeader-content': { maxWidth: '100%' } }}
          title={label}
        />
      </CardActionArea>
    </Card>
  )
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
  const { sidebarOpen, setSidebarOpen } = useSidebar()

  // The look name lives in the Details step (main content), so the sidebar — now
  // just the selected-items summary + cover image — stays at its persisted
  // open/closed state for both new and edit; the toolbar toggle drives it.

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
  // Outer stepper: 0 Details · 1 Pieces · 2 Accessories · 3 Eureka.
  // Inner stepper: index of the active category within the active bucket.
  const [activeSection, setActiveSection] = useState(0)
  const [activeCategory, setActiveCategory] = useState(0)
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

  // First enabled category index in a section's step list (0 if none/empty).
  function firstEnabledCategory(steps: CategoryStep[]) {
    const i = steps.findIndex((s) => !s.disabled)
    return i === -1 ? 0 : i
  }

  // Jump to an outer section, opening its first available category.
  function goToSection(section: number) {
    setActiveSection(section)
    setActiveCategory(firstEnabledCategory(sectionSteps(section)))
  }

  // Move to the next enabled category in the current section. When the section
  // runs out, roll over into the next section (opening its first category).
  function advanceCategory(section: number, from: number) {
    const steps = sectionSteps(section)
    for (let i = from + 1; i < steps.length; i++) {
      if (!steps[i].disabled) {
        setActiveCategory(i)
        return
      }
    }
    // No more categories in this section — roll into the next one, if any.
    if (section < sections.length) goToSection(section + 1)
  }

  // Pick a variant, then advance to the next available category/section.
  function pickAndAdvance(slug: string, section: number, categoryIndex: number) {
    selectPiece(slug)
    advanceCategory(section, categoryIndex)
  }

  // Group a bucket's variants by category, in canonical category order; drop
  // empty categories. Mirrors the previous per-tab grouping, now per bucket.
  function groupByCategory(cats: { slug: string; title: string }[], variants: FlatVariant[]) {
    const map = new Map<string, { title: string; variants: FlatVariant[] }>()
    for (const c of cats) map.set(c.slug, { title: c.title, variants: [] })
    for (const v of variants) {
      if (!v.category) continue
      const group = map.get(v.category)
      if (group) group.variants.push(v)
      else map.set(v.category, { title: v.categoryTitle, variants: [v] })
    }
    for (const [slug, group] of map) {
      if (group.variants.length === 0) map.delete(slug)
    }
    return map
  }

  const piecesGroups = useMemo(
    () =>
      groupByCategory(
        outfitCategories.filter((c) => c.part === PIECES_PART),
        outfitVariants.filter((v) => v.part === PIECES_PART)
      ),
    [outfitCategories, outfitVariants]
  )
  const accessoriesGroups = useMemo(
    () =>
      groupByCategory(
        outfitCategories.filter((c) => c.part === ACCESSORIES_PART),
        outfitVariants.filter((v) => v.part === ACCESSORIES_PART)
      ),
    [outfitCategories, outfitVariants]
  )
  const eurekaGroups = useMemo(
    () => groupByCategory(eurekaCategories, eurekaVariants),
    [eurekaCategories, eurekaVariants]
  )

  // Outfit category slugs that currently have a selected piece. Drives the
  // mutually-exclusive dress vs tops/bottoms rule in the Pieces bucket.
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

  // Turn one bucket's category groups into category steps, in group order.
  const bucketToSteps = (
    bucket: StepBucket,
    groups: Map<string, { title: string; variants: FlatVariant[] }>
  ): CategoryStep[] =>
    Array.from(groups.entries()).map(([slug, group]) => {
      const selectedVariant = group.variants.find((v) => selectedSlugs.has(v.slug))
      // Conflict rule only applies to the outfit Pieces bucket.
      const disabled =
        bucket === 'pieces' &&
        isCategoryDisabled({ slug } as OutfitCategory, selectedOutfitCategorySlugs)
      return {
        bucket,
        slug,
        title: group.title,
        variants: group.variants,
        selectedVariant,
        disabled,
        disabledReason: disabled ? outfitConflictReason : undefined,
      }
    })

  // bucketToSteps is a plain function redefined each render; it reads only the
  // values already listed as deps, so it's safe to omit as a dep in each memo.
  /* eslint-disable react-hooks/exhaustive-deps */
  const piecesSteps = useMemo(
    () => bucketToSteps('pieces', piecesGroups),
    [piecesGroups, selectedSlugs, selectedOutfitCategorySlugs, outfitConflictReason]
  )
  const accessoriesSteps = useMemo(
    () => bucketToSteps('accessories', accessoriesGroups),
    [accessoriesGroups, selectedSlugs]
  )
  const eurekaSteps = useMemo(
    () => bucketToSteps('eureka', eurekaGroups),
    [eurekaGroups, selectedSlugs]
  )
  /* eslint-enable react-hooks/exhaustive-deps */

  // The three outfit/eureka buckets, in outer-stepper order. The Details
  // section (index 0) is rendered separately; these are sections 1-3.
  const sections: { bucket: StepBucket; label: string; steps: CategoryStep[] }[] = [
    { bucket: 'pieces', label: 'Pieces', steps: piecesSteps },
    { bucket: 'accessories', label: 'Accessories', steps: accessoriesSteps },
    { bucket: 'eureka', label: 'Eureka', steps: eurekaSteps },
  ]

  // Category steps for a given outer section index (1-based; section 0 is Details).
  const sectionSteps = (section: number) => sections[section - 1]?.steps ?? []

  // Category slug → its position in the DB id-ordered category list, so selected
  // items can be sorted by their category's id.
  const categoryOrder = useMemo(() => {
    const order = new Map<string, number>()
    eurekaCategories.forEach((c, i) => order.set(`eureka:${c.slug}`, i))
    outfitCategories.forEach((c, i) => order.set(`outfit:${c.slug}`, i))
    return order
  }, [eurekaCategories, outfitCategories])

  const sortByCategory = (items: FlatVariant[]) =>
    [...items].sort(
      (a, b) =>
        (categoryOrder.get(`${a.type}:${a.category}`) ?? Infinity) -
        (categoryOrder.get(`${b.type}:${b.category}`) ?? Infinity)
    )

  const selectedItems = useMemo(
    () => allVariants.filter((v) => selectedSlugs.has(v.slug)),
    [allVariants, selectedSlugs]
  )
  const selectedPieces = sortByCategory(
    selectedItems.filter((v) => v.type === 'outfit' && v.part === PIECES_PART)
  )
  const selectedAccessories = sortByCategory(
    selectedItems.filter((v) => v.type === 'outfit' && v.part === ACCESSORIES_PART)
  )
  const selectedEureka = sortByCategory(selectedItems.filter((v) => v.type === 'eureka'))

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
          setSaveError(
            `You've reached the ${FREE_LOOKS_LIMIT}-look limit for free accounts. Upgrade to save more.`
          )
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
          const primary = v.title ?? v.setTitle
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
    <Stack sx={{ minWidth: 0 }}>
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

  // One bucket's category steps as an inner vertical stepper. Only mounted for
  // the active section, so `activeCategory` always indexes this section's list.
  function categoryStepper(section: number, steps: CategoryStep[]) {
    return (
      <Stepper nonLinear activeStep={activeCategory} orientation="vertical">
        {steps.map((step, index) => (
          <Step key={step.slug} completed={!!step.selectedVariant} disabled={step.disabled}>
            <StepLabel
              icon={<ToggleIcon category={step.slug} size="sm" />}
              optional={
                step.disabled ? (
                  <Typography color="textDisabled" variant="caption">
                    {step.disabledReason}
                  </Typography>
                ) : step.selectedVariant ? (
                  <Chip
                    color="success"
                    label={step.selectedVariant.setTitle}
                    size="small"
                    sx={{ maxWidth: 160 }}
                    variant="outlined"
                  />
                ) : null
              }
              sx={{ '& .MuiStepLabel-labelContainer': { display: 'flex', alignItems: 'center' } }}
            >
              <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
                <Box
                  component="span"
                  sx={{ cursor: 'pointer', flex: 1 }}
                  onClick={() => !step.disabled && setActiveCategory(index)}
                >
                  {step.title}
                </Box>
                {!step.disabled && !step.selectedVariant && index === activeCategory && (
                  <Button size="small" onClick={() => advanceCategory(section, index)}>
                    Skip
                  </Button>
                )}
              </Stack>
            </StepLabel>
            <StepContent>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                  gap: 1,
                  pt: 1,
                }}
              >
                {step.variants.map((v) => (
                  <VariantCard
                    key={v.slug}
                    selected={selectedSlugs.has(v.slug)}
                    variant={v}
                    onToggle={(slug) => pickAndAdvance(slug, section, index)}
                  />
                ))}
              </Box>
            </StepContent>
          </Step>
        ))}
      </Stepper>
    )
  }

  // ── Picker panel (nested stepper) ────────────────────────────────────────
  const pickerPanel = (
    <Stepper nonLinear activeStep={activeSection} orientation="vertical">
      <Step completed={activeSection > 0 && !!name.trim()}>
        <StepButton icon={<EditNoteIcon />} onClick={() => setActiveSection(0)}>
          <StepLabel optional={<Typography variant="caption">Name, notes and cover</Typography>}>
            Details
          </StepLabel>
        </StepButton>
        <StepContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
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
            <Box>
              <Button size="small" variant="contained" onClick={() => goToSection(1)}>
                Continue
              </Button>
            </Box>
          </Stack>
        </StepContent>
      </Step>

      {sections.map((section, i) => {
        const sectionIndex = i + 1
        const sectionIcon =
          section.bucket === 'pieces' ? (
            <CheckroomIcon />
          ) : section.bucket === 'accessories' ? (
            <WatchOutlinedIcon />
          ) : (
            <DiamondOutlinedIcon />
          )
        return (
          <Step key={section.bucket} completed={activeSection > sectionIndex}>
            <StepButton icon={sectionIcon} onClick={() => goToSection(sectionIndex)}>
              <StepLabel>{section.label}</StepLabel>
            </StepButton>
            <StepContent>{categoryStepper(sectionIndex, section.steps)}</StepContent>
          </Step>
        )
      })}
    </Stepper>
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
          <IconButton
            color={sidebarOpen ? 'primary' : 'default'}
            onClick={() => {
              const next = !sidebarOpen
              setSidebarOpen(next)
              localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next))
            }}
          >
            <TuneIcon />
          </IconButton>
        </Stack>
      </NavBarToolbar>

      <SidebarBody>{composerPanel}</SidebarBody>

      <PageShell maxWidth="wide">{pickerPanel}</PageShell>
    </>
  )
}
