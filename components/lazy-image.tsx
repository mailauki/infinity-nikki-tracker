'use client'
import { memo } from 'react'
import Avatar, { type AvatarProps } from '@mui/material/Avatar'
import { type CardMediaProps } from '@mui/material/CardMedia'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Skeleton from '@mui/material/Skeleton'
import Typography from '@mui/material/Typography'
import CategoryIcon from '@mui/icons-material/Category'
import ImageIcon from '@mui/icons-material/Image'
import { type SxProps, type Theme } from '@mui/material/styles'
import Image from 'next/image'
import { useLazyImage } from '@/hooks/use-lazy-image'
import type { AvatarSize } from '@/lib/types/props'

// Subtle dim so bright outfit art is easier on the eyes in dark mode.
const darkDim = (theme: Theme) => theme.applyStyles('dark', { filter: 'brightness(0.85)' })

// Normalize an sx prop (object | array | function) into array entries so the
// caller's styles compose with ours instead of overwriting them.
const toSxArray = (sx: SxProps<Theme> | undefined) => (Array.isArray(sx) ? sx : [sx])

// Pixel sizes for the MUI Avatar `size` variants (kept in sync with lib/theme.ts).
// Used to give next/image explicit dimensions on the `optimized` path.
const SIZE_PX: Record<AvatarSize, number> = { xs: 24, sm: 40, md: 56, lg: 94, xl: 140 }

// Hoisted so the object identity is stable across renders — these grids re-render
// on every scroll frame, and a fresh sx object per render defeats MUI's style cache.
const OVERLAY_SX = { position: 'absolute', inset: 0, width: '100%', height: '100%' } as const
const FILL_STYLE = { objectFit: 'cover' } as const

// Mirrors MUI's own `AvatarImg` styles (Avatar.js), because the <img> below is
// rendered as an Avatar *child* rather than through Avatar's `src` prop.
const AVATAR_IMG_SX = {
  width: '100%',
  height: '100%',
  textAlign: 'center',
  objectFit: 'cover',
  // Hide alt text and the broken-image glyph.
  color: 'transparent',
  textIndent: 10000,
} as const

type AvatarCorner = 'circular' | 'rounded' | 'square'

// Avatar render path (default): thumbnails. `variant` = corner style, default 'rounded'.
// `optimized` swaps the raw <img> for next/image (AVIF/WebP, srcset, lazy-load),
// keeping the same skeleton + retry UX — opt in on the heavy grids only.
// `src` is widened to allow null so callers can pass a nullable DB column
// (e.g. profiles.avatar_url) straight through — the no-src path already renders
// the fallback child.
type AvatarKind = {
  kind?: 'avatar'
  variant?: AvatarCorner
  optimized?: boolean
  size?: AvatarSize
  src?: string | null
} & Omit<AvatarProps, 'variant' | 'src'>

// CardMedia render path: full-width, rectangular. No `variant` (always rectangular).
// The caller sets the aspect ratio via sx (e.g. 1/1 or 2/3).
type MediaKind = { kind: 'media' } & CardMediaProps<'div'>

export type LazyImageProps = AvatarKind | MediaKind

// Three render states, uniform across every path below:
//   pending     -> skeleton, no visible <img>
//   loaded      -> the image, faded in
//   placeholder -> an icon (no src, or every retry attempt errored)
//
// The one thing that never happens is the browser's broken-image glyph: an <img>
// is only ever painted once it has actually decoded. See hooks/use-lazy-image.ts
// for the retry/backoff ladder and the session-scoped outcome cache that keeps
// remounted rows in a virtualized grid from re-running it.
function LazyImage(props: LazyImageProps) {
  if (props.kind === 'media') {
    const { kind, ...rest } = props
    void kind
    return <MediaImage {...rest} />
  }
  const { children, kind, optimized, size, src, sx, variant = 'rounded', ...rest } = props
  void kind
  if (optimized && size) {
    return (
      <OptimizedAvatarImage
        alt={typeof rest.alt === 'string' ? rest.alt : ''}
        size={size}
        src={src}
        sx={sx}
        variant={variant}
      >
        {children}
      </OptimizedAvatarImage>
    )
  }
  return (
    <AvatarImage size={size} src={src} sx={sx} variant={variant} {...rest}>
      {children}
    </AvatarImage>
  )
}

// Memoized because the virtualized grids re-render every mounted row on each
// scroll-driven layout pass. Call sites pass primitives plus a hoisted sx, so
// the shallow compare actually holds; an inline sx object at a call site would
// silently defeat it.
export default memo(LazyImage)

// The <img> is deliberately NOT handed to Avatar's `src` prop. Avatar's internal
// `useLoaded` hook constructs a detached `new Image()` for every src it is given,
// on top of the <img> it renders — so each thumbnail costs two requests, and that
// detached probe ignores `loading="lazy"` entirely, fetching every off-screen
// overscan row the instant it mounts. Rendering our own <img> as an Avatar *child*
// keeps the theme's size/shape styling (the size variants live on the Avatar root,
// see lib/theme.ts) while issuing exactly one, genuinely lazy request per thumbnail.
function AvatarImage({
  variant,
  src,
  sx,
  size,
  alt,
  children,
  ...props
}: { variant: AvatarCorner; size?: AvatarSize; src?: string | null } & Omit<
  AvatarProps,
  'variant' | 'src'
>) {
  const { currentSrc, isPending, imgRef, handleLoad, handleError } = useLazyImage(src)

  // With no usable image, fall back to a caller-supplied child or the shared
  // category icon rather than MUI's default person silhouette.
  const placeholder = children ?? <CategoryIcon fontSize="inherit" />

  return (
    <Box sx={{ position: 'relative', display: 'inline-flex', width: 'fit-content' }}>
      {isPending && (
        <Skeleton sx={OVERLAY_SX} variant={variant === 'circular' ? 'circular' : 'rounded'} />
      )}
      <Avatar
        size={size}
        sx={[
          { opacity: isPending ? 0 : 1 },
          // Avatar decides it is "empty" (colorDefault -> grey fill) purely from
          // its own `src` prop, which we no longer set. Suppress that fill while
          // our <img> covers the box; the placeholder branch keeps it, which is
          // what an image-less Avatar looked like before. Listed ahead of the
          // caller's sx so a call site can still paint its own background.
          currentSrc ? { backgroundColor: 'transparent' } : false,
          ...toSxArray(sx),
          darkDim,
        ]}
        variant={variant}
        {...props}
      >
        {currentSrc ? (
          <Box
            ref={imgRef}
            alt={alt}
            component="img"
            decoding="async"
            loading="lazy"
            src={currentSrc}
            sx={AVATAR_IMG_SX}
            onError={handleError}
            onLoad={handleLoad}
          />
        ) : (
          placeholder
        )}
      </Avatar>
    </Box>
  )
}

// next/image variant of the Avatar thumbnail: same fixed box + rounded corners +
// skeleton + retry UX, but the image goes through next/image (which, with
// `images.unoptimized`, emits a plain <img> — see next.config.ts). `children`
// (fallback icon) shows when there is no src or every attempt failed.
function OptimizedAvatarImage({
  variant,
  src,
  sx,
  size,
  alt,
  children,
}: {
  variant: AvatarCorner
  size: AvatarSize
  src?: string | null
  sx?: AvatarProps['sx']
  alt: string
  children?: React.ReactNode
}) {
  const { currentSrc, isPending, isPlaceholder, imgRef, handleLoad, handleError } =
    useLazyImage(src)
  const px = SIZE_PX[size]
  const radiusByVariant: Record<AvatarCorner, string | number> = {
    circular: '50%',
    square: 0,
    rounded: 1,
  }
  const radius = radiusByVariant[variant]

  return (
    <Box sx={{ position: 'relative', display: 'inline-flex', width: px, height: px }}>
      {isPending && (
        <Skeleton sx={OVERLAY_SX} variant={variant === 'circular' ? 'circular' : 'rounded'} />
      )}
      {isPlaceholder ? (
        <Avatar size={size} sx={[...toSxArray(sx)]} variant={variant}>
          {children ?? <CategoryIcon fontSize="inherit" />}
        </Avatar>
      ) : (
        <Box
          sx={[
            {
              position: 'relative',
              width: px,
              height: px,
              borderRadius: radius,
              overflow: 'hidden',
              opacity: isPending ? 0 : 1,
            },
            ...toSxArray(sx),
            darkDim,
          ]}
        >
          {currentSrc && (
            <Image
              ref={imgRef}
              fill
              alt={alt}
              decoding="async"
              sizes={`${px * 2}px`}
              src={currentSrc}
              style={FILL_STYLE}
              onError={handleError}
              onLoad={handleLoad}
            />
          )}
        </Box>
      )}
    </Box>
  )
}

function MediaImage({ image, sx, title }: CardMediaProps<'div'>) {
  const { currentSrc, isPending, isPlaceholder, imgRef, handleLoad, handleError } =
    useLazyImage(image)

  return (
    <Stack sx={{ position: 'relative', ...sx }}>
      {isPending && (
        <Skeleton sx={{ position: 'absolute', inset: 0, height: '100%' }} variant="rectangular" />
      )}
      {isPlaceholder && <ImagePlaceholder title={title} />}
      {currentSrc && (
        // A real <img loading="lazy"> (not a CardMedia CSS background) so the
        // browser defers off-screen thumbnails on the large /eureka and /outfits
        // grids — background-image can't be natively lazy-loaded, so those grids
        // used to fetch every card's image eagerly on load. object-fit: cover
        // reproduces CardMedia's cover crop; the wrapper Stack supplies the aspect
        // ratio, so the box is reserved before the image loads (no CLS).
        <Box
          ref={imgRef}
          alt=""
          component="img"
          decoding="async"
          loading="lazy"
          src={currentSrc}
          sx={[
            {
              borderRadius: 1.5,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
              opacity: isPending ? 0 : 1,
            },
            darkDim,
          ]}
          onError={handleError}
          onLoad={handleLoad}
        />
      )}
    </Stack>
  )
}

function ImagePlaceholder({ title }: { title?: string }) {
  // No image: show the placeholder icon + optional caption. Absolutely fill
  // the parent so it inherits the caller's aspect ratio instead of stretching
  // to the surrounding card's (taller) row height.
  return (
    <Stack
      spacing={1}
      sx={{
        position: 'absolute',
        inset: 0,
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        color: 'text.disabled',
      }}
    >
      <ImageIcon fontSize="large" />
      {title && (
        // sx, not the color prop: MUI resolves color="text.secondary" to
        // `inherit` here, so the Stack's text.disabled won and the title
        // rendered at 2.65:1. sx sets the value directly.
        <Typography align="center" sx={{ color: 'text.secondary' }} variant="caption">
          {title}
        </Typography>
      )}
    </Stack>
  )
}
