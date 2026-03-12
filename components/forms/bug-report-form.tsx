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

const CATEGORIES = ['Bug report', 'Missing content', 'Other']

interface BugReportFormProps {
  onClose: () => void
}

export default function BugReportForm({ onClose }: BugReportFormProps) {
  const [category, setCategory] = useState('Bug report')
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
          <Select label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          fullWidth
          required
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <TextField
          fullWidth
          multiline
          required
          label="Description"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <TextField
          fullWidth
          label="Your email (optional)"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Stack>
      <DialogActions sx={{ px: 0, pb: 0, pt: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button disabled={!title || !description} type="submit" variant="contained">
          Send
        </Button>
      </DialogActions>
    </form>
  )
}
