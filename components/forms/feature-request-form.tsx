'use client'

import {
  Button,
  DialogActions,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material'
import { useState } from 'react'

const CATEGORIES = ['New feature', 'Improvement', 'Other']

interface FeatureRequestFormProps {
  onClose: () => void
}

export default function FeatureRequestForm({ onClose }: FeatureRequestFormProps) {
  const [category, setCategory] = useState('New feature')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [email, setEmail] = useState('')

  function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()

    const body = [description, email ? `From: ${email}` : ''].filter(Boolean).join('\n\n')
    const mailto = `mailto:julie.ux.dev@gmail.com?subject=${encodeURIComponent(`[${category}] ${title}`)}&body=${encodeURIComponent(body)}`

    window.location.href = mailto
    onClose()
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing={2} sx={{ pt: 1 }}>
        <FormControl fullWidth required>
          <InputLabel>Category</InputLabel>
          <Select
            value={category}
            label="Category"
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          fullWidth
        />
        <TextField
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          fullWidth
          multiline
          rows={4}
        />
        <TextField
          label="Your email (optional)"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          fullWidth
        />
      </Stack>
      <DialogActions sx={{ px: 0, pb: 0, pt: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="contained" disabled={!title || !description}>
          Send
        </Button>
      </DialogActions>
    </form>
  )
}
