'use client'

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  DialogActions,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useRef, useState } from 'react'
import FeedbackReceipt, { type ReceiptData } from './feedback-receipt'
import ImagePicker from './image-picker'
import { createClient } from '@/lib/supabase/client'
import { validateSubmission } from '@/lib/feedback/validate'
import {
  MAX_DESCRIPTION_LENGTH,
  categoriesFor,
  type FeedbackType,
  type ReportContext,
} from '@/lib/types/feedback'

interface FeedbackFormProps {
  type: FeedbackType
  context?: ReportContext
  onClose: () => void
}

interface Success {
  submission: ReceiptData
  imageNames: string[]
  imagesFailed: boolean
}

export default function FeedbackForm({ type, context, onClose }: FeedbackFormProps) {
  const categories = categoriesFor(type)
  const [category, setCategory] = useState(categories[0])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [email, setEmail] = useState('')
  const [images, setImages] = useState<File[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [success, setSuccess] = useState<Success | null>(null)
  const errorAlertRef = useRef<HTMLDivElement>(null)

  // Resolved here rather than passed in: the two call sites (the help page and
  // the global footer link) are both auth-unaware client components, so a prop
  // would have to be threaded through unrelated trees. `null` means "not yet
  // known" and keeps the email field hidden until the answer arrives, so it
  // never flashes in for a logged-in user.
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)

  useEffect(() => {
    let active = true
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (active) setIsLoggedIn(Boolean(data.user))
    })
    return () => {
      active = false
    }
  }, [])

  const subject = context?.entity_title ?? context?.entity_slug

  // The Alert mounts in place without a focus change, so screen reader users
  // relying on virtual-cursor navigation may never encounter it. Move focus
  // to it whenever a new server error appears.
  useEffect(() => {
    if (submitError) errorAlertRef.current?.focus()
  }, [submitError])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSubmitError(null)

    // Same validator the server runs, so inline errors match what would be
    // rejected rather than approximating it.
    const result = validateSubmission({ type, category, title, description, email })
    if (!result.ok) {
      setErrors(result.errors)
      return
    }
    setErrors({})

    const body = new FormData()
    body.set('type', type)
    body.set('category', category)
    body.set('title', title)
    body.set('description', description)
    body.set('email', email)
    if (context) {
      body.set('page_path', context.page_path)
      if (context.entity_type) body.set('entity_type', context.entity_type)
      if (context.entity_slug) body.set('entity_slug', context.entity_slug)
      if (context.entity_title) body.set('entity_title', context.entity_title)
    }
    images.forEach((file) => body.append('images', file))

    setPending(true)
    try {
      const response = await fetch('/api/feedback', { method: 'POST', body })
      const payload = await response.json()

      if (!response.ok) {
        if (response.status === 400 && payload.errors) {
          setErrors(payload.errors)
        } else {
          setSubmitError(payload.error ?? 'Something went wrong. Please try again.')
        }
        return
      }

      setSuccess({
        submission: payload.feedback,
        imageNames: payload.imageNames ?? [],
        imagesFailed: Boolean(payload.imagesFailed),
      })
    } catch {
      setSubmitError('Could not reach the server. Please check your connection and try again.')
    } finally {
      setPending(false)
    }
  }

  if (success) {
    return (
      <FeedbackReceipt
        imageNames={success.imageNames}
        imagesFailed={success.imagesFailed}
        submission={success.submission}
        onClose={onClose}
      />
    )
  }

  return (
    <form noValidate onSubmit={handleSubmit}>
      <Stack spacing={2} sx={{ pt: 1 }}>
        {submitError && (
          <Alert
            ref={errorAlertRef}
            severity="error"
            tabIndex={-1}
            onClose={() => setSubmitError(null)}
          >
            {submitError}
          </Alert>
        )}

        {/* Captured context is shown, never hidden — people should know what
            they are sending along with their words. */}
        {context && (
          <Box sx={{ mb: 1 }}>
            <Typography color="text.secondary" id="feedback-context-label" variant="caption">
              Reporting about
            </Typography>
            <Box sx={{ mt: 0.5 }}>
              <Chip
                aria-describedby="feedback-context-label"
                label={subject ?? context.page_path}
                size="small"
              />
            </Box>
          </Box>
        )}

        <FormControl fullWidth required error={Boolean(errors.category)}>
          <InputLabel id="feedback-category-label">Category</InputLabel>
          <Select
            label="Category"
            labelId="feedback-category-label"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            {categories.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
          {errors.category && <FormHelperText>{errors.category}</FormHelperText>}
        </FormControl>

        <TextField
          fullWidth
          required
          error={Boolean(errors.title)}
          helperText={errors.title}
          label="Title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />

        <TextField
          fullWidth
          multiline
          required
          error={Boolean(errors.description)}
          helperText={
            errors.description ?? `${description.length}/${MAX_DESCRIPTION_LENGTH} characters`
          }
          label={type === 'feature' ? 'What would you like to see?' : 'What went wrong?'}
          rows={4}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />

        {/* Logged-in users already have an address on file, so asking again is
            noise. Anonymous users are told what the field is for. Hidden while
            auth is still resolving (null) to avoid a flash. */}
        {isLoggedIn === false && (
          <TextField
            fullWidth
            error={Boolean(errors.email)}
            helperText={errors.email ?? "Optional — we'll send you a copy."}
            label="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        )}

        <ImagePicker disabled={pending} files={images} onChange={setImages} />
      </Stack>

      <DialogActions sx={{ px: 0, pb: 0, pt: 2 }}>
        <Button disabled={pending} onClick={onClose}>
          Cancel
        </Button>
        <Button
          disabled={pending}
          startIcon={pending ? <CircularProgress size={16} /> : null}
          type="submit"
          variant="contained"
        >
          {pending ? 'Sending…' : 'Send'}
        </Button>
      </DialogActions>
    </form>
  )
}
