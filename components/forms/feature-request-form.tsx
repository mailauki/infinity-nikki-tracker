'use client'

import AttachFileIcon from '@mui/icons-material/AttachFile'
import {
  Alert,
  Box,
  Button,
  Chip,
  DialogActions,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
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
  const [screenshots, setScreenshots] = useState<File[]>([])
  const [showReminder, setShowReminder] = useState(false)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      setScreenshots((prev) => [...prev, ...Array.from(e.target.files!)])
      e.target.value = ''
    }
  }

  function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()

    const body = [description, email ? `From: ${email}` : ''].filter(Boolean).join('\n\n')
    const mailto = `mailto:julie.ux.dev@gmail.com?subject=${encodeURIComponent(`[${category}] ${title}`)}&body=${encodeURIComponent(body)}`

    window.location.href = mailto

    if (screenshots.length > 0) {
      setShowReminder(true)
    } else {
      onClose()
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing={2} sx={{ pt: 1 }}>
        {showReminder && (
          <Alert severity="info" onClose={onClose}>
            Your email app has opened — attach your screenshots before sending!
          </Alert>
        )}
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
        <Box>
          <Button component="label" size="small" startIcon={<AttachFileIcon />} variant="outlined">
            Add screenshots
            <input hidden multiple accept="image/*" type="file" onChange={handleFileChange} />
          </Button>
          {screenshots.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
              {screenshots.map((file, i) => (
                <Chip
                  key={i}
                  label={file.name}
                  size="small"
                  onDelete={() => setScreenshots((prev) => prev.filter((_, idx) => idx !== i))}
                />
              ))}
            </Box>
          )}
          <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="caption">
            Attach these to your email after clicking Send.
          </Typography>
        </Box>
      </Stack>
      <DialogActions sx={{ px: 0, pb: 0, pt: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button disabled={!title || !description || showReminder} type="submit" variant="contained">
          Send
        </Button>
      </DialogActions>
    </form>
  )
}
