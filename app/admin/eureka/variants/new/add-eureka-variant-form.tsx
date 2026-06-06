'use client'

import { useActionState, useEffect, useState } from 'react'
import {
  Alert,
  FormControl,
  FormControlLabel,
  FormHelperText,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
} from '@mui/material'
import { toSlugVariant } from '@/lib/utils'
import { Edit, EditOff } from '@mui/icons-material'
import { EurekaCategory, EurekaColor, EurekaSetRaw, EurekaVariantRaw } from '@/lib/types/eureka'
import { useFormConfig } from '@/app/admin/form-context'
import { addEurekaVariant } from '../actions'
import { navLinksData } from '@/lib/nav-links'

const FORM_ID = 'add-eureka-variant'

export default function AddEurekaVariantForm({
  eurekaSets,
  categories,
  colors,
  variants,
}: {
  eurekaSets: EurekaSetRaw[]
  categories: EurekaCategory[]
  colors: EurekaColor[]
  variants: EurekaVariantRaw[]
}) {
  const { setFormConfig } = useFormConfig()
  const [eurekaSet, setEurekaSet] = useState('')
  const [category, setCategory] = useState('')
  const [color, setColor] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const [slug, setSlug] = useState('')
  const [editSlug, setEditSlug] = useState(false)

  const hasDefault = variants.some(
    (v) => v.eureka_set === eurekaSet && v.category === category && v.default
  )

  useEffect(() => {
    if (!editSlug && eurekaSet && category && color) {
      setSlug(toSlugVariant(eurekaSet, category, color))
    }
  }, [eurekaSet, category, color, editSlug])

  const [state, action, pending] = useActionState(addEurekaVariant, null)

  useEffect(() => {
    setFormConfig({
      formId: FORM_ID,
      backUrl: navLinksData.dashboard.eureka.variants.list,
      pending,
      showAddAnother: true,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending])

  useEffect(() => {
    if (state && 'addAnother' in state) {
      setFormConfig({ savedTitle: state.savedTitle })
      setEurekaSet('')
      setCategory('')
      setColor('')
      setIsDefault(false)
      setSlug('')
      setEditSlug(false)
    }
  }, [state]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <form action={action} id={FORM_ID}>
      <Stack spacing={2} sx={{ maxWidth: 'sm' }}>
        {state?.error && <Alert severity="error">{state.error}</Alert>}

        <FormControl required>
          <InputLabel>Eureka Set</InputLabel>
          <Select
            label="Eureka Set"
            name="eureka_set"
            value={eurekaSet}
            onChange={(e) => setEurekaSet(e.target.value)}
          >
            <MenuItem value="">—</MenuItem>
            {eurekaSets.map((set) => (
              <MenuItem key={set.id} value={set.slug ?? ''}>
                {set.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl>
          <InputLabel>Category</InputLabel>
          <Select
            label="Category"
            name="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <MenuItem value="">—</MenuItem>
            {categories.map((c) => (
              <MenuItem key={c.slug} value={c.slug}>
                {c.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl>
          <InputLabel>Color</InputLabel>
          <Select
            label="Color"
            name="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          >
            <MenuItem value="">—</MenuItem>
            {[...colors]
              .sort((a, b) => {
                if (a.slug === 'iridescent') return 1
                if (b.slug === 'iridescent') return -1
                return 0
              })
              .map((c) => (
                <MenuItem key={c.slug} value={c.slug}>
                  {c.title}
                </MenuItem>
              ))}
          </Select>
        </FormControl>

        <input name="slug" type="hidden" value={slug} />
        <TextField
          required
          disabled={!editSlug}
          helperText="Auto-generated from name, category, and color — edit if needed"
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
        <FormControl>
          <FormControlLabel
            control={
              <Switch
                checked={isDefault}
                disabled={hasDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
              />
            }
            label="Default variant"
          />
          <FormHelperText>
            {hasDefault
              ? 'This category already has a default variant for this set'
              : 'Used to determine the Eureka set thumbnail image — limit one per category'}
          </FormHelperText>
        </FormControl>
      </Stack>
    </form>
  )
}
