'use client'

import { Link as Anchor, Typography, Chip, IconButton, Tooltip } from '@mui/material'
import { Collections } from '@mui/icons-material'
import Link from 'next/link'
import { CarouselImage, OutfitSet, linkedSetHref } from '@/lib/types/outfit'
import { toTitle } from '@/lib/utils'
import LazyImage from '@/components/lazy-image'
import LinkedSetCard from '@/components/linked-set-card'
import SetDetailCard from '@/components/set-detail-card'
import OutfitCarousel from './outfit-carousel'

export interface OutfitSetDetailCardProps {
  outfitSet: OutfitSet
  selected: string | null
  isLoggedIn: boolean
  /** Progress numerator/denominator across the whole set. */
  obtained: number
  total: number
  /** Resolved image src for the current image mode + selected evolution. */
  imageSrc: string | null | undefined
  /** Whether the alt image is being shown (drives the square aspect ratio). */
  showingAlt: boolean
  /** Carousel images for the current selection; empty when none exist. */
  carouselImages: CarouselImage[]
  hasCarousel: boolean
  /** Gallery toggle state, owned by the parent so it can reset on evolution change. */
  showCarousel: boolean
  onToggleCarousel: () => void
}

// The outfit set-detail card: composes the shared SetDetailCard with the
// outfit-specific media (image or gallery carousel) and rows (ability + gallery
// toggle, season link + category). Kept prop-driven so the parent owns
// image-mode/selection/carousel state; standalone sets don't render it.
export default function OutfitSetDetailCard({
  outfitSet,
  selected,
  isLoggedIn,
  obtained,
  total,
  imageSrc,
  showingAlt,
  carouselImages,
  hasCarousel,
  showCarousel,
  onToggleCarousel,
}: OutfitSetDetailCardProps) {
  const { ability, rarity, label, label_2, style, description, season, seasonCategory } = outfitSet
  // Rendered as a suffix beside the base title, which is already the card heading —
  // so this uses the short `subtitle`, not the composed "{base}: {subtitle}" title.
  const selectedEvolution =
    outfitSet.evolutions.find((evolution) => evolution.slug === selected)?.subtitle || null

  const media =
    showCarousel && hasCarousel ? (
      <OutfitCarousel images={carouselImages} title={outfitSet.title} />
    ) : (
      <LazyImage
        image={imageSrc || outfitSet.image_url || ''}
        kind="media"
        sx={{ width: '100%', maxWidth: 260, aspectRatio: showingAlt ? '1 / 1' : '2 / 3' }}
        title={outfitSet.title}
      />
    )

  const abilityRow = (
    <>
      {ability && <Chip label={toTitle(ability)} />}
      {hasCarousel && (
        <Tooltip title={showCarousel ? 'Hide gallery' : 'Show gallery'}>
          <IconButton
            aria-label={showCarousel ? 'Hide gallery' : 'Show gallery'}
            color={showCarousel ? 'primary' : 'default'}
            onClick={onToggleCarousel}
          >
            <Collections fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </>
  )

  const seasonRow = (
    <>
      <Anchor
        component={Link}
        href={`/outfits/seasons/${outfitSet.seasons}`}
        sx={{ cursor: 'pointer' }}
        underline="hover"
        variant="subtitle2"
      >
        {season?.title}
      </Anchor>
      <Typography sx={{ textAlign: 'right' }} variant="body1">
        {seasonCategory?.title}
      </Typography>
    </>
  )

  // Linked makeup set and Momo's Cloak, resolved from their `outfit_set` FKs
  // rather than guessed from the slug: only 39 of 292 outfits follow the
  // `<slug>_makeup` pattern and 1 of 292 follows `momos_cloak_<slug>`, so a
  // derived href is a 404 for most sets. Each card renders only when the link
  // actually exists.
  //
  // Pairings are per-row, not per-set: the base outfit and each of its evolutions
  // carry their OWN makeup/cloak FK (e.g. `enchanted_encounter` pairs with the
  // `enchanted_encounter` makeup, while its `-dreamtrail` evolution pairs with
  // `polar_realm_radiance`). So the links follow the current selection, falling
  // back to the base set's own pairings when no evolution is selected.
  const linkSource = outfitSet.evolutions.find((e) => e.slug === selected) ?? outfitSet

  // The paired makeup row is itself often an evolution, which has no route of its
  // own — linkedSetHref() addresses its base plus an `?evolution=` param.
  // Momo's Cloaks are flat (no evolutions), so that link is just the slug.
  const linked: { href: string; title: string; image: string | null }[] = [
    linkSource.makeupSet && {
      href: linkedSetHref('makeup', linkSource.makeupSet),
      title: linkSource.makeupSet.title,
      image: linkSource.makeupSet.alt_image_url || linkSource.makeupSet.image_url,
    },
    linkSource.momoCloak && {
      href: `/momo-cloaks/${linkSource.momoCloak.slug}`,
      title: linkSource.momoCloak.title,
      image: linkSource.momoCloak.alt_image_url || linkSource.momoCloak.image_url,
    },
  ].filter((item): item is { href: string; title: string; image: string | null } => !!item)

  const associatedRow = linked.length ? (
    <>
      {linked.map((item) => (
        <LinkedSetCard
          key={item.href}
          half={linked.length > 1}
          href={item.href}
          image={item.image}
          title={item.title}
        />
      ))}
    </>
  ) : null

  return (
    <SetDetailCard
      description={description}
      extraRows={[seasonRow, associatedRow, abilityRow].filter(Boolean)}
      isLoggedIn={isLoggedIn}
      labels={[label, label_2]}
      media={media}
      obtained={obtained}
      rarity={rarity!}
      style={style}
      title={outfitSet.title}
      titleSuffix={selectedEvolution}
      total={total}
    />
  )
}
