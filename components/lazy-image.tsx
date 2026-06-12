'use client'
import Avatar, { type AvatarProps } from '@mui/material/Avatar'
import CardMedia, { type CardMediaProps } from '@mui/material/CardMedia'
import Box, { type BoxProps } from '@mui/material/Box'
import Skeleton from '@mui/material/Skeleton'
import { type SxProps, type Theme } from '@mui/material/styles'
import { useLazyImage } from '@/hooks/use-lazy-image'

// Subtle dim so bright outfit art is easier on the eyes in dark mode.
const darkDim = (theme: Theme) => theme.applyStyles('dark', { filter: 'brightness(0.85)' })

// Normalize an sx prop (object | array | function) into array entries so the
// caller's styles compose with ours instead of overwriting them.
const toSxArray = (sx: SxProps<Theme> | undefined) => (Array.isArray(sx) ? sx : [sx])

type AvatarCorner = 'circular' | 'rounded' | 'square'

// Avatar render path (default): thumbnails. `variant` = corner style, default 'rounded'.
type AvatarKind = {
  kind?: 'avatar'
  variant?: AvatarCorner
} & Omit<AvatarProps, 'variant'>

// Square (1:1) poster, also Avatar-rendered, sized full-width.
type SquareKind = {
  kind: 'square'
  src?: string | null
  alt: string
  variant?: AvatarCorner
  maxWidth?: number | string
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
    const { alt, maxWidth = 300, src, sx, variant = 'rounded' } = props
    return <SquareImage alt={alt} maxWidth={maxWidth} src={src} sx={sx} variant={variant} />
  }
  const { children, kind, src, sx, variant = 'rounded', ...rest } = props
  void kind
  return (
    <AvatarImage src={src} sx={sx} variant={variant} {...rest}>
      {children}
    </AvatarImage>
  )
}

function AvatarImage({
  variant,
  src,
  sx,
  children,
  ...props
}: { variant: AvatarCorner } & Omit<AvatarProps, 'variant'>) {
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

function SquareImage({
  src,
  alt,
  variant,
  maxWidth,
  sx,
}: {
  src?: string | null
  alt: string
  variant: AvatarCorner
  maxWidth: number | string
  sx?: BoxProps['sx']
}) {
  const { loaded, retrySrc, imgRef, handleLoad, handleError } = useLazyImage(src)

  return (
    <Box sx={{ position: 'relative', display: 'inline-flex', width: '100%', maxWidth }}>
      {!loaded && src && (
        <Skeleton
          sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          variant={variant === 'circular' ? 'circular' : 'rounded'}
        />
      )}
      <Avatar
        alt={alt}
        slotProps={{
          img: retrySrc ? { ref: imgRef, onLoad: handleLoad, onError: handleError } : undefined,
        }}
        src={retrySrc}
        sx={[
          { width: '100%', height: 'auto', aspectRatio: '1 / 1', opacity: loaded || !src ? 1 : 0 },
          ...toSxArray(sx),
          darkDim,
        ]}
        variant={variant}
      />
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
        sx={[{ height: '100%', opacity: loaded || !image ? 1 : 0 }, darkDim]}
        {...props}
      />
    </Box>
  )
}
