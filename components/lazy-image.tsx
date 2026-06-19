'use client'
import Avatar, { type AvatarProps } from '@mui/material/Avatar'
import CardMedia, { type CardMediaProps } from '@mui/material/CardMedia'
import Box, { type BoxProps } from '@mui/material/Box'
import Skeleton from '@mui/material/Skeleton'
import CategoryIcon from '@mui/icons-material/Category'
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

// Square (1:1) poster, also Avatar-rendered, sized full-width. `size` scales the
// fallback placeholder icon (the square itself stays full-width up to maxWidth).
type SquareKind = {
  kind: 'square'
  src?: string | null
  alt: string
  variant?: AvatarCorner
  maxWidth?: number | string
  size?: AvatarSize
  sx?: BoxProps['sx']
}

// CardMedia render path: 9:16 / full-width / rectangular. No `variant` (always rectangular).
type MediaKind = { kind: 'media' } & CardMediaProps<'div'>

export type LazyImageProps = AvatarKind | SquareKind | MediaKind

export default function LazyImage(props: LazyImageProps) {
  if (props.kind === 'media') {
    const { kind, ...rest } = props
    void kind
    return <MediaImage {...rest} />
  }
  if (props.kind === 'square') {
    const { alt, maxWidth = 300, size, src, sx, variant = 'rounded' } = props
    return (
      <SquareImage alt={alt} maxWidth={maxWidth} size={size} src={src} sx={sx} variant={variant} />
    )
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
          img: retrySrc ? { ref: imgRef, onLoad: handleLoad, onError: handleError } : undefined,
        }}
        src={retrySrc}
        sx={[{ opacity: loaded || !src ? 1 : 0 }, ...toSxArray(sx), darkDim]}
        variant={variant}
        {...props}
      >
        {children}
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
          {children}
        </Avatar>
      )}
    </Box>
  )
}

function SquareImage({
  src,
  alt,
  variant,
  maxWidth,
  size,
  sx,
}: {
  src?: string | null
  alt: string
  variant: AvatarCorner
  maxWidth: number | string
  size?: AvatarSize
  sx?: BoxProps['sx']
}) {
  const { loaded, retrySrc, imgRef, handleLoad, handleError } = useLazyImage(src)

  // With an explicit `size`, defer to the Avatar's fixed size variant; without
  // one, the square fills its container (full width up to maxWidth).
  const fullWidth = !size

  return (
    <Box
      sx={{
        position: 'relative',
        display: 'inline-flex',
        width: fullWidth ? '100%' : 'fit-content',
        maxWidth,
      }}
    >
      {!loaded && src && (
        <Skeleton
          sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          variant={variant === 'circular' ? 'circular' : 'rounded'}
        />
      )}
      <Avatar
        alt={alt}
        size={size}
        slotProps={{
          img: retrySrc ? { ref: imgRef, onLoad: handleLoad, onError: handleError } : undefined,
        }}
        src={retrySrc}
        sx={[
          {
            aspectRatio: '1 / 1',
            opacity: loaded || !src ? 1 : 0,
            ...(!size && { width: '100%', height: '100%' }),
          },
          ...toSxArray(sx),
          darkDim,
        ]}
        variant={variant}
      >
        <CategoryIcon fontSize="inherit" />
      </Avatar>
    </Box>
  )
}

function MediaImage({ image, sx, ...props }: CardMediaProps<'div'>) {
  const { loaded, retrySrc, imgRef, handleLoad, handleError } = useLazyImage(image)

  return (
    <Box sx={{ position: 'relative', ...sx }}>
      {!loaded && image && (
        <Skeleton sx={{ position: 'absolute', inset: 0, height: '100%' }} variant="rectangular" />
      )}
      {image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={imgRef}
          aria-hidden
          alt=""
          src={retrySrc}
          style={{ visibility: 'hidden', position: 'absolute', width: 0, height: 0 }}
          onError={handleError}
          onLoad={handleLoad}
        />
      )}
      <CardMedia
        image={retrySrc}
        sx={[{ borderRadius: 3, height: '100%', opacity: loaded || !image ? 1 : 0 }, darkDim]}
        {...props}
      />
    </Box>
  )
}
