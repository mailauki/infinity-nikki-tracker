'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
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
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CloseIcon from '@mui/icons-material/Close'
import SearchIcon from '@mui/icons-material/Search'
import StyleOutlinedIcon from '@mui/icons-material/StyleOutlined'
import DiamondOutlinedIcon from '@mui/icons-material/DiamondOutlined'
import CategoryIcon from '@mui/icons-material/Category'
import SaveIcon from '@mui/icons-material/Save'
import { toTitle } from '@/lib/utils'
import LazyAvatar from '@/components/lazy-avatar'
import type { FlatVariant, CustomLook } from '@/lib/types/looks'

type SavePayload = {
  name: string
  description: string | null
  eureka_variant_slugs: string[]
  outfit_variant_slugs: string[]
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
            <LazyAvatar
              alt={variant.slug}
              color="transparent"
              size="md"
              src={variant.image_url ?? undefined}
              sx={{ bgcolor: 'transparent', color: 'text.disabled' }}
            >
              <CategoryIcon fontSize="inherit" />
            </LazyAvatar>
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

type SetRowProps = {
  setSlug: string
  setTitle: string
  thumbnail: string | null
  totalCount: number
  selectedCount: number
  onSelect: (slug: string) => void
}

function SetRow({
  setSlug,
  setTitle,
  thumbnail,
  totalCount,
  selectedCount,
  onSelect,
}: SetRowProps) {
  return (
    <Card variant="outlined">
      <CardActionArea sx={{ px: 1.5, py: 1 }} onClick={() => onSelect(setSlug)}>
        <Stack direction="row" sx={{ alignItems: 'center', gap: 1.5 }}>
          <Avatar
            src={thumbnail ?? undefined}
            sx={{ width: 40, height: 40, bgcolor: 'surface.containerHighest', flexShrink: 0 }}
            variant="rounded"
          >
            <CategoryIcon fontSize="small" />
          </Avatar>
          <Stack sx={{ flex: 1, minWidth: 0 }}>
            <Typography noWrap sx={{ fontWeight: 500 }} variant="body2">
              {setTitle}
            </Typography>
            <Typography color="textSecondary" variant="caption">
              {totalCount} piece{totalCount !== 1 ? 's' : ''}
            </Typography>
          </Stack>
          {selectedCount > 0 && (
            <Chip color="primary" label={selectedCount} size="small" sx={{ minWidth: 28 }} />
          )}
        </Stack>
      </CardActionArea>
    </Card>
  )
}

export default function LookBuilder({
  initialLook,
  eurekaVariants,
  outfitVariants,
  onSave,
}: {
  initialLook?: Pick<
    CustomLook,
    'id' | 'name' | 'description' | 'eureka_variant_slugs' | 'outfit_variant_slugs'
  >
  eurekaVariants: FlatVariant[]
  outfitVariants: FlatVariant[]
  onSave: (data: SavePayload) => Promise<{ error?: string } | { id?: string }>
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [name, setName] = useState(initialLook?.name ?? '')
  const [description, setDescription] = useState(initialLook?.description ?? '')
  const [selectedSlugs, setSelectedSlugs] = useState<Set<string>>(
    () =>
      new Set([
        ...(initialLook?.eureka_variant_slugs ?? []),
        ...(initialLook?.outfit_variant_slugs ?? []),
      ])
  )
  const [tab, setTab] = useState<'eureka' | 'outfit'>('eureka')
  const [search, setSearch] = useState('')
  const [activeSetSlug, setActiveSetSlug] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  function toggleSlug(slug: string) {
    setSelectedSlugs((prev) => {
      const next = new Set(prev)
      if (next.has(slug)) next.delete(slug)
      else next.add(slug)
      return next
    })
  }

  const currentVariants = tab === 'eureka' ? eurekaVariants : outfitVariants

  // Group variants by set
  const setGroups = useMemo(() => {
    const map = new Map<
      string,
      { title: string; thumbnail: string | null; variants: FlatVariant[] }
    >()
    for (const v of currentVariants) {
      if (!map.has(v.setSlug)) {
        map.set(v.setSlug, {
          title: v.setTitle,
          thumbnail: v.image_url,
          variants: [],
        })
      }
      map.get(v.setSlug)!.variants.push(v)
    }
    return map
  }, [currentVariants])

  // Filter sets by search
  const filteredSetSlugs = useMemo(() => {
    const q = search.toLowerCase()
    return Array.from(setGroups.keys()).filter((slug) =>
      q ? setGroups.get(slug)!.title.toLowerCase().includes(q) : true
    )
  }, [setGroups, search])

  const activeSetVariants = useMemo(() => {
    if (!activeSetSlug) return []
    return setGroups.get(activeSetSlug)?.variants ?? []
  }, [setGroups, activeSetSlug])

  // Selected variants as FlatVariant (for chips in composer)
  const allVariants = useMemo(
    () => [...eurekaVariants, ...outfitVariants],
    [eurekaVariants, outfitVariants]
  )
  const selectedItems = useMemo(
    () => allVariants.filter((v) => selectedSlugs.has(v.slug)),
    [allVariants, selectedSlugs]
  )
  const selectedEureka = selectedItems.filter((v) => v.type === 'eureka')
  const selectedOutfit = selectedItems.filter((v) => v.type === 'outfit')

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

      <Stack spacing={1}>
        <Typography color="textSecondary" variant="caption">
          {selectedItems.length} piece{selectedItems.length !== 1 ? 's' : ''} selected
        </Typography>

        {selectedEureka.length > 0 && (
          <Stack spacing={0.5}>
            <Stack direction="row" sx={{ alignItems: 'center', gap: 0.5 }}>
              <DiamondOutlinedIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
              <Typography color="textSecondary" variant="caption">
                Eureka
              </Typography>
            </Stack>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {selectedEureka.map((v) => (
                <Chip
                  key={v.slug}
                  avatar={<Avatar src={v.image_url ?? undefined} />}
                  deleteIcon={<CloseIcon />}
                  label={`${toTitle(v.category)}${v.color ? ` · ${toTitle(v.color)}` : ''}`}
                  size="small"
                  variant="outlined"
                  onDelete={() => toggleSlug(v.slug)}
                />
              ))}
            </Box>
          </Stack>
        )}

        {selectedOutfit.length > 0 && (
          <Stack spacing={0.5}>
            <Stack direction="row" sx={{ alignItems: 'center', gap: 0.5 }}>
              <StyleOutlinedIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
              <Typography color="textSecondary" variant="caption">
                Outfit
              </Typography>
            </Stack>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {selectedOutfit.map((v) => (
                <Chip
                  key={v.slug}
                  avatar={<Avatar src={v.image_url ?? undefined} />}
                  deleteIcon={<CloseIcon />}
                  label={`${toTitle(v.category)}${v.evolution ? ` · ${toTitle(v.evolution)}` : ''}`}
                  size="small"
                  variant="outlined"
                  onDelete={() => toggleSlug(v.slug)}
                />
              ))}
            </Box>
          </Stack>
        )}

        {selectedItems.length === 0 && (
          <Typography color="textSecondary" variant="caption">
            Pick pieces from the panel to add them here.
          </Typography>
        )}
      </Stack>

      {saveError && <Alert severity="error">{saveError}</Alert>}

      <Button
        fullWidth
        color="primary"
        disabled={!name.trim() || isPending}
        startIcon={<SaveIcon />}
        variant="contained"
        onClick={handleSave}
      >
        {isPending ? 'Saving…' : initialLook ? 'Save changes' : 'Create look'}
      </Button>
    </Stack>
  )

  // ── Picker panel (left / bottom) ─────────────────────────────────────────
  const pickerPanel = (
    <Stack spacing={1.5} sx={{ minWidth: 0 }}>
      <Tabs
        value={tab}
        onChange={(_, v) => {
          setTab(v)
          setActiveSetSlug(null)
          setSearch('')
        }}
      >
        <Tab
          icon={<DiamondOutlinedIcon fontSize="small" />}
          iconPosition="start"
          label="Eureka"
          sx={{ minHeight: 40 }}
          value="eureka"
        />
        <Tab
          icon={<StyleOutlinedIcon fontSize="small" />}
          iconPosition="start"
          label="Outfit"
          sx={{ minHeight: 40 }}
          value="outfit"
        />
      </Tabs>

      {activeSetSlug ? (
        <Stack spacing={1.5}>
          <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
            <IconButton size="small" onClick={() => setActiveSetSlug(null)}>
              <ArrowBackIcon fontSize="small" />
            </IconButton>
            <Typography sx={{ fontWeight: 500 }} variant="body2">
              {setGroups.get(activeSetSlug)?.title}
            </Typography>
          </Stack>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
              gap: 1,
            }}
          >
            {activeSetVariants.map((v) => (
              <VariantCard
                key={v.slug}
                selected={selectedSlugs.has(v.slug)}
                variant={v}
                onToggle={toggleSlug}
              />
            ))}
          </Box>
        </Stack>
      ) : (
        <Stack spacing={1}>
          <TextField
            fullWidth
            placeholder={`Search ${tab} sets…`}
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
            {filteredSetSlugs.length === 0 && (
              <Typography color="textSecondary" sx={{ py: 2, textAlign: 'center' }} variant="body2">
                No sets found.
              </Typography>
            )}
            {filteredSetSlugs.map((slug) => {
              const group = setGroups.get(slug)!
              const selectedCount = group.variants.filter((v) => selectedSlugs.has(v.slug)).length
              const thumbnail = group.variants.find((v) => v.image_url)?.image_url ?? null
              return (
                <SetRow
                  key={slug}
                  selectedCount={selectedCount}
                  setSlug={slug}
                  setTitle={group.title}
                  thumbnail={thumbnail}
                  totalCount={group.variants.length}
                  onSelect={setActiveSetSlug}
                />
              )
            })}
          </Stack>
        </Stack>
      )}
    </Stack>
  )

  return (
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
  )
}
