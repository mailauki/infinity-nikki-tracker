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
import ImageUpload from '@/components/forms/image-upload'
import { EurekaCategory, EurekaColor, EurekaSetRaw, EurekaVariantRaw } from '@/lib/types/eureka'
import { useFormConfig } from '@/app/admin/form-context'
import { editEurekaVariant } from '../../actions'
import { MENU_PROPS } from '@/lib/types/props'

const FORM_ID = 'edit-eureka-variant'

export default function EditEurekaVariantForm({
  variant,
  eurekaSets,
  categories,
  colors,
  variants,
  back,
}: {
  variant: EurekaVariantRaw
  eurekaSets: EurekaSetRaw[]
  categories: EurekaCategory[]
  colors: EurekaColor[]
  variants: EurekaVariantRaw[]
  back: string
}) {
  const { setFormConfig } = useFormConfig()
  const [eurekaSet, setEurekaSet] = useState(variant.eureka_set ?? '')
  const [category, setCategory] = useState(variant.category ?? '')
  const [color, setColor] = useState(variant.color ?? '')
  const [imageUrl, setImageUrl] = useState<string | null>(variant.image_url)
  const [isDefault, setIsDefault] = useState(variant.default)
  const [slug, setSlug] = useState(
    variant.slug ??
      toSlugVariant(variant.eureka_set ?? '', variant.category ?? '', variant.color ?? '')
  )
  const [editSlug, setEditSlug] = useState(false)

  const hasDefault = variants.some(
    (v) => v.id !== variant.id && v.eureka_set === eurekaSet && v.category === category && v.default
  )

  useEffect(() => {
    if (!editSlug && eurekaSet && category && color) {
      setSlug(toSlugVariant(eurekaSet, category, color))
    }
  }, [eurekaSet, category, color, editSlug])

  const boundAction = editEurekaVariant.bind(null, variant.id, back)
  const [state, action, pending] = useActionState(boundAction, null)

  useEffect(() => {
    setFormConfig({
      formId: FORM_ID,
      backUrl: back,
      pending,
      showUpdateOnly: true,
      showUpdateNext: true,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending, back])

  useEffect(() => {
    if (state && 'savedTitle' in state && !('error' in state)) {
      setFormConfig({ savedTitle: state.savedTitle })
    }
  }, [state]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <form action={action} id={FORM_ID}>
      <Stack spacing={2} sx={{ maxWidth: 'sm' }}>
        {state?.error && <Alert severity="error">{state.error}</Alert>}

        <FormControl required>
          <InputLabel>Eureka Set</InputLabel>
          <Select
            MenuProps={MENU_PROPS}
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
            MenuProps={MENU_PROPS}
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
            MenuProps={MENU_PROPS}
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

        <input name="image_url" type="hidden" value={imageUrl ?? ''} />
        <ImageUpload
          slug={slug || undefined}
          table="eureka_variants"
          url={imageUrl}
          onUpload={(url) => setImageUrl(url)}
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
