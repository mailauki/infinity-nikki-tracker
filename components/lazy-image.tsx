'use client'
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

type AvatarCorner = 'circular' | 'rounded' | 'square'

// Avatar render path (default): thumbnails. `variant` = corner style, default 'rounded'.
// `optimized` swaps the raw <img> for next/image (AVIF/WebP, srcset, lazy-load),
// keeping the same skeleton + retry UX — opt in on the heavy grids only.
type AvatarKind = {
  kind?: 'avatar'
  variant?: AvatarCorner
  optimized?: boolean
  size?: AvatarSize
} & Omit<AvatarProps, 'variant'>

// CardMedia render path: full-width, rectangular. No `variant` (always rectangular).
// The caller sets the aspect ratio via sx (e.g. 1/1 or 2/3).
type MediaKind = { kind: 'media' } & CardMediaProps<'div'>

export type LazyImageProps = AvatarKind | MediaKind

export default function LazyImage(props: LazyImageProps) {
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

function AvatarImage({
  variant,
  src,
  sx,
  size,
  children,
  ...props
}: { variant: AvatarCorner; size?: AvatarSize } & Omit<AvatarProps, 'variant'>) {
  const { loaded, retrySrc, imgRef, handleLoad, handleError } = useLazyImage(src)

  // With no src, fall back to a caller-supplied child or the shared category icon
  // rather than MUI's default person silhouette.
  const placeholder = children ?? <CategoryIcon fontSize="inherit" />

  return (
    <Box sx={{ position: 'relative', display: 'inline-flex', width: 'fit-content' }}>
      {!loaded && src && (
        <Skeleton
          sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          variant={variant === 'circular' ? 'circular' : 'rounded'}
        />
      )}
      <Avatar
        size={size}
        slotProps={{
          img: retrySrc
            ? {
                ref: imgRef,
                loading: 'lazy',
                decoding: 'async',
                onLoad: handleLoad,
                onError: handleError,
              }
            : undefined,
        }}
        src={retrySrc}
        sx={[{ opacity: loaded || !src ? 1 : 0 }, ...toSxArray(sx), darkDim]}
        variant={variant}
        {...props}
      >
        {src ? children : placeholder}
      </Avatar>
    </Box>
  )
}

// next/image variant of the Avatar thumbnail: same fixed box + rounded corners +
// skeleton + retry UX, but the image is served via /_next/image (AVIF/WebP,
// DPR-aware srcset, native lazy-load). `children` (fallback icon) shows when src
// is absent. Drives useLazyImage's load/error so the skeleton/retry still work.
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
  const { loaded, retrySrc, imgRef, handleLoad, handleError } = useLazyImage(src)
  const px = SIZE_PX[size]
  const radiusByVariant: Record<AvatarCorner, string | number> = {
    circular: '50%',
    square: 0,
    rounded: 1,
  }
  const radius = radiusByVariant[variant]

  return (
    <Box sx={{ position: 'relative', display: 'inline-flex', width: px, height: px }}>
      {!loaded && src && (
        <Skeleton
          sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          variant={variant === 'circular' ? 'circular' : 'rounded'}
        />
      )}
      {src ? (
        <Box
          sx={[
            {
              position: 'relative',
              width: px,
              height: px,
              borderRadius: radius,
              overflow: 'hidden',
              opacity: loaded ? 1 : 0,
            },
            ...toSxArray(sx),
            darkDim,
          ]}
        >
          <Image
            ref={imgRef}
            fill
            alt={alt}
            sizes={`${px * 2}px`}
            src={retrySrc!}
            style={{ objectFit: 'cover' }}
            onError={handleError}
            onLoad={handleLoad}
          />
        </Box>
      ) : (
        <Avatar size={size} sx={[...toSxArray(sx)]} variant={variant}>
          {children ?? <CategoryIcon fontSize="inherit" />}
        </Avatar>
      )}
    </Box>
  )
}

function MediaImage({ image, sx, title }: CardMediaProps<'div'>) {
  const { loaded, retrySrc, imgRef, handleLoad, handleError } = useLazyImage(image)

  return (
    <Stack sx={{ position: 'relative', ...sx }}>
      {!loaded && image && (
        <Skeleton sx={{ position: 'absolute', inset: 0, height: '100%' }} variant="rectangular" />
      )}
      {image ? (
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
          src={retrySrc}
          sx={[
            {
              borderRadius: 1.5,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
              opacity: loaded ? 1 : 0,
            },
            darkDim,
          ]}
          onError={handleError}
          onLoad={handleLoad}
        />
      ) : (
        <ImagePlaceholder title={title} />
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
        <Typography align="center" color="text.secondary" variant="caption">
          {title}
        </Typography>
      )}
    </Stack>
  )
}
