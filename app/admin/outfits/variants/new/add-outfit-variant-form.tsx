'use client'

import { useActionState, useEffect, useState } from 'react'
import {
  Alert,
  FormControl,
  FormControlLabel,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
} from '@mui/material'
import { Edit, EditOff } from '@mui/icons-material'
import { OutfitCategory, OutfitSetRaw } from '@/lib/types/outfit'
import { useFormConfig } from '@/app/admin/form-context'
import { addOutfitVariant } from '../actions'
import { navLinksData } from '@/lib/nav-links'
import { MENU_PROPS } from '@/lib/types/props'

const FORM_ID = 'add-outfit-variant'

export default function AddOutfitVariantForm({
  outfitSets,
  outfitCategories,
}: {
  outfitSets: OutfitSetRaw[]
  outfitCategories: OutfitCategory[]
}) {
  const { setFormConfig } = useFormConfig()
  const [outfitSet, setOutfitSet] = useState('')
  const [outfitCategory, setOutfitCategory] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const [slug, setSlug] = useState('')
  const [editSlug, setEditSlug] = useState(false)

  useEffect(() => {
    if (!editSlug) {
      const parts = [outfitSet, outfitCategory].filter(Boolean)
      setSlug(parts.length > 0 ? parts.join('-') : '')
    }
  }, [outfitSet, outfitCategory, editSlug])

  const [state, action, pending] = useActionState(addOutfitVariant, null)

  useEffect(() => {
    setFormConfig({
      formId: FORM_ID,
      backUrl: navLinksData.admin.outfits.variants.list,
      pending,
      showAddAnother: true,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending])

  useEffect(() => {
    if (state && 'addAnother' in state) {
      setFormConfig({ savedTitle: state.savedTitle })
      setOutfitSet('')
      setOutfitCategory('')
      setTitle('')
      setDescription('')
      setIsDefault(false)
      setSlug('')
      setEditSlug(false)
    }
  }, [state]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <form action={action} id={FORM_ID}>
      <Stack spacing={2} sx={{ maxWidth: 'sm' }}>
        {state?.error && <Alert severity="error">{state.error}</Alert>}

        <FormControl>
          <InputLabel>Outfit Set</InputLabel>
          <Select
            MenuProps={MENU_PROPS}
            label="Outfit Set"
            name="outfit_set"
            value={outfitSet}
            onChange={(e) => setOutfitSet(e.target.value)}
          >
            <MenuItem value="">— None (standalone piece) —</MenuItem>
            {outfitSets
              .filter((s) => s.base_set === null)
              .map((set) => (
                <MenuItem key={set.id} value={set.slug ?? ''}>
                  {set.title}
                </MenuItem>
              ))}
          </Select>
        </FormControl>

        <FormControl>
          <InputLabel>Category</InputLabel>
          <Select
            MenuProps={MENU_PROPS}
            label="Category"
            name="outfit_category"
            value={outfitCategory}
            onChange={(e) => setOutfitCategory(e.target.value)}
          >
            <MenuItem value="">—</MenuItem>
            {outfitCategories.map((c) => (
              <MenuItem key={c.slug} value={c.slug}>
                {c.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="Title"
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <TextField
          label="Description"
          multiline
          name="description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <input name="slug" type="hidden" value={slug} />
        <TextField
          required
          disabled={!editSlug}
          helperText="Auto-generated from outfit set and category — edit if needed"
          label="Slug"
          slotProps={{
            htmlInput: { style: { fontFamily: 'monospace' } },
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setEditSlug(!editSlug)}>
                    {editSlug ? <EditOff /> : <Edit />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
        />

        <input name="default" type="hidden" value={String(isDefault)} />
        <FormControlLabel
          control={
            <Switch checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
          }
          label="Default variant"
        />
      </Stack>
    </form>
  )
}
