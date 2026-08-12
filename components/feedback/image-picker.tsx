'use client'

import AttachFileIcon from '@mui/icons-material/AttachFile'
import CloseIcon from '@mui/icons-material/Close'
import { Box, Button, IconButton, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { MAX_IMAGES, MAX_IMAGE_BYTES } from '@/lib/types/feedback'

interface ImagePickerProps {
  files: File[]
  onChange: (files: File[]) => void
  disabled?: boolean
}

export default function ImagePicker({ files, onChange, disabled }: ImagePickerProps) {
  const [previews, setPreviews] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  // Object URLs must be revoked or the blobs leak for the page's lifetime.
  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file))
    setPreviews(urls)
    return () => urls.forEach((url) => URL.revokeObjectURL(url))
  }, [files])

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (picked.length === 0) return

    const tooLarge = picked.filter((f) => f.size > MAX_IMAGE_BYTES)
    const room = MAX_IMAGES - files.length
    const accepted = picked.filter((f) => f.size <= MAX_IMAGE_BYTES).slice(0, room)

    // Both conditions can trip at once (an oversized pick that also exceeds
    // the remaining slots) — collect whichever clauses apply so neither
    // problem gets silently dropped from the message.
    const messages: string[] = []
    if (tooLarge.length > 0) {
      messages.push(`Each image must be under ${MAX_IMAGE_BYTES / 1024 / 1024}MB.`)
    }
    if (picked.length > room) {
      messages.push(`You can attach up to ${MAX_IMAGES} images.`)
    }
    setError(messages.length > 0 ? messages.join(' ') : null)

    if (accepted.length > 0) onChange([...files, ...accepted])
  }

  return (
    <Box>
      <Button
        component="label"
        disabled={disabled || files.length >= MAX_IMAGES}
        size="small"
        startIcon={<AttachFileIcon />}
        variant="outlined"
      >
        Add screenshots
        <input hidden multiple accept="image/*" type="file" onChange={handleChange} />
      </Button>

      {previews.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
          {previews.map((src, index) => (
            // Index key, not filename: the list is short, ordered, and fully
            // re-rendered on every change, and two picked files can share a
            // name (e.g. "screenshot.png" from different folders), which
            // would collide as a key and break reconciliation between the
            // two thumbnails.
            <Box key={index} sx={{ position: 'relative' }}>
              {/* Local object URL, not a remote asset — next/image adds nothing here. */}
              <Box
                alt=""
                component="img"
                src={src}
                sx={{
                  width: 72,
                  height: 72,
                  objectFit: 'cover',
                  borderRadius: 1,
                  display: 'block',
                }}
              />
              <IconButton
                aria-label={`Remove ${files[index]?.name ?? 'image'}`}
                disabled={disabled}
                size="small"
                sx={{
                  position: 'absolute',
                  top: -8,
                  right: -8,
                  bgcolor: 'background.paper',
                  '&:hover': { bgcolor: 'background.paper' },
                }}
                onClick={() => onChange(files.filter((_, i) => i !== index))}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Box>
      )}

      <Typography
        color={error ? 'error' : 'text.secondary'}
        role="status"
        sx={{ display: 'block', mt: 0.5 }}
        variant="caption"
      >
        {error ?? `Optional. Up to ${MAX_IMAGES} images, ${MAX_IMAGE_BYTES / 1024 / 1024}MB each.`}
      </Typography>
    </Box>
  )
}
