'use client'

import { Fragment, useActionState, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Breakpoint,
  Chip,
  FormControl,
  FormControlLabel,
  FormHelperText,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  Stack,
  Switch,
  TextField,
} from '@mui/material'
import { CheckBox, CheckBoxOutlineBlank } from '@mui/icons-material'
import { toSlug } from '@/lib/utils'
import { MENU_PROPS } from '@/lib/types/props'
import { FieldConfig, FieldLookups, FieldOption, FieldValues } from '@/lib/types/form-fields'
import { useFormConfig } from '@/app/admin/form-context'
import SlugField from '@/components/forms/slug-field'
import RarityField from '@/components/forms/rarity-field'
import ToggleField from '@/components/forms/toggle-field'
import ImageUpload from '@/components/forms/image-upload'
import ImageUploadPair from '@/components/forms/image-upload-pair'

/** Result shapes the admin server actions return (they otherwise redirect). */
type ActionState =
  | { error: string }
  | { addAnother: true; savedTitle?: string }
  | { savedTitle?: string }
  | null

type EntityAction = (state: unknown, formData: FormData) => Promise<unknown>

function typeDefault(field: FieldConfig): unknown {
  switch (field.type) {
    case 'switch':
      return false
    case 'rarity':
      return ''
    case 'multiSelect':
      return []
    case 'imagePair':
      return null
    default:
      return field.type === 'text' || field.type === 'textarea' ? (field.defaultValue ?? '') : ''
  }
}

function buildInitialValues(fields: FieldConfig[], initial?: FieldValues): FieldValues {
  const values: FieldValues = {}
  for (const field of fields) {
    values[field.name] = initial?.[field.name] ?? typeDefault(field)
    if (field.type === 'imagePair') {
      const altName = field.altName ?? `${field.name}_alt`
      values[altName] = initial?.[altName] ?? null
    }
  }
  return values
}

function resolveText(
  value: string | ((values: FieldValues) => string) | undefined,
  values: FieldValues
): string | undefined {
  return typeof value === 'function' ? value(values) : value
}

function resolveBool(
  value: boolean | ((values: FieldValues) => boolean) | undefined,
  values: FieldValues
): boolean {
  return typeof value === 'function' ? value(values) : !!value
}

export default function EntityForm({
  mode,
  formId,
  fields,
  action,
  backUrl,
  initialValues,
  lookups = {},
  showAddAnother,
  showUpdateOnly,
  showUpdateNext,
  maxWidth = 'sm',
}: {
  mode: 'add' | 'edit'
  formId: string
  fields: FieldConfig[]
  action: EntityAction
  backUrl: string
  initialValues?: FieldValues
  lookups?: FieldLookups
  showAddAnother?: boolean
  showUpdateOnly?: boolean
  showUpdateNext?: boolean
  maxWidth?: Breakpoint
}) {
  const { setFormConfig } = useFormConfig()
  const [values, setValues] = useState<FieldValues>(() => buildInitialValues(fields, initialValues))
  const [slugEdited, setSlugEdited] = useState(false)

  const setValue = (name: string, value: unknown) =>
    setValues((prev) => ({ ...prev, [name]: value }))

  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    action as (state: ActionState, formData: FormData) => Promise<ActionState>,
    null
  )

  const slugField = useMemo(() => fields.find((f) => f.type === 'slug'), [fields])

  // Auto-derive the slug from its source(s) until the user edits it manually.
  useEffect(() => {
    if (!slugField || slugField.type !== 'slug' || slugEdited) return
    const next =
      typeof slugField.slugFrom === 'function'
        ? slugField.slugFrom(values)
        : toSlug(String(values[slugField.slugFrom ?? 'title'] ?? ''))
    if (next !== values[slugField.name]) setValue(slugField.name, next)
  }, [values, slugEdited, slugField])

  // Push config into the shared FormContext that FormToolbar reads.
  useEffect(() => {
    setFormConfig({ formId, backUrl, pending, showAddAnother, showUpdateOnly, showUpdateNext })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending, backUrl])

  // React to the action result: reset on add-another, surface savedTitle on edit.
  useEffect(() => {
    if (!state) return
    if ('addAnother' in state) {
      setFormConfig({ savedTitle: state.savedTitle })
      setValues(buildInitialValues(fields))
      setSlugEdited(false)
    } else if ('savedTitle' in state && !('error' in state)) {
      setFormConfig({ savedTitle: state.savedTitle })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  function renderField(field: FieldConfig) {
    if (field.hidden?.(values)) return null

    const label = field.label
    const helperText = resolveText(field.helperText, values)
    const disabled = resolveBool(field.disabled, values)
    const required = resolveBool(field.required, values)

    switch (field.type) {
      case 'text':
        return (
          <TextField
            disabled={disabled}
            helperText={helperText}
            label={label}
            name={field.name}
            required={required}
            value={String(values[field.name] ?? '')}
            onChange={(e) => setValue(field.name, e.target.value)}
          />
        )

      case 'textarea':
        return (
          <TextField
            multiline
            disabled={disabled}
            helperText={helperText}
            label={label}
            minRows={field.minRows ?? 3}
            name={field.name}
            required={required}
            value={String(values[field.name] ?? '')}
            onChange={(e) => setValue(field.name, e.target.value)}
          />
        )

      case 'slug':
        return (
          <SlugField
            helperText={helperText}
            label={label}
            name={field.name}
            required={required}
            value={String(values[field.name] ?? '')}
            onChange={(v) => setValue(field.name, v)}
            onUserEdit={() => setSlugEdited(true)}
          />
        )

      case 'select': {
        const options = sortOptions(lookups[field.optionsKey] ?? [], field.sortOptions)
        return (
          <FormControl required={required}>
            <InputLabel>{label}</InputLabel>
            <Select
              MenuProps={MENU_PROPS}
              disabled={disabled}
              label={label}
              name={field.name}
              value={String(values[field.name] ?? '')}
              onChange={(e) => setValue(field.name, e.target.value)}
            >
              {field.includeEmpty !== false && <MenuItem value="">—</MenuItem>}
              {options.map((o) => (
                <MenuItem key={o.slug} value={o.slug}>
                  {o.title ?? o.slug}
                </MenuItem>
              ))}
            </Select>
            {helperText && <FormHelperText>{helperText}</FormHelperText>}
          </FormControl>
        )
      }

      case 'multiSelect': {
        const options = sortOptions(lookups[field.optionsKey] ?? [], field.sortOptions)
        const selected = (values[field.name] as string[]) ?? []
        const atMax = field.max !== undefined && selected.length >= field.max
        return (
          <>
            <input name={field.name} type="hidden" value={JSON.stringify(selected)} />
            <FormControl>
              <InputLabel>{label}</InputLabel>
              <Select
                multiple
                MenuProps={MENU_PROPS}
                disabled={disabled}
                input={<OutlinedInput label={label} />}
                renderValue={(picked) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(picked as string[]).map((s) => (
                      <Chip
                        key={s}
                        label={options.find((o) => o.slug === s)?.title ?? s}
                        size="small"
                      />
                    ))}
                  </Box>
                )}
                value={selected}
                onChange={(e) => {
                  const raw = e.target.value
                  const next = typeof raw === 'string' ? raw.split(',') : raw
                  if (field.max === undefined || next.length <= field.max)
                    setValue(field.name, next)
                }}
              >
                {options.map((o) => {
                  const isSelected = selected.includes(o.slug)
                  return (
                    <MenuItem key={o.slug} disabled={!isSelected && atMax} value={o.slug}>
                      {isSelected ? (
                        <CheckBox fontSize="small" sx={{ mr: 1 }} />
                      ) : (
                        <CheckBoxOutlineBlank fontSize="small" sx={{ mr: 1 }} />
                      )}
                      {o.title ?? o.slug}
                    </MenuItem>
                  )
                })}
              </Select>
              {helperText && <FormHelperText>{helperText}</FormHelperText>}
            </FormControl>
          </>
        )
      }

      case 'switch':
        return (
          <FormControl>
            <input name={field.name} type="hidden" value={String(!!values[field.name])} />
            <FormControlLabel
              control={
                <Switch
                  checked={!!values[field.name]}
                  disabled={disabled}
                  onChange={(e) => setValue(field.name, e.target.checked)}
                />
              }
              label={label}
            />
            {helperText && <FormHelperText>{helperText}</FormHelperText>}
          </FormControl>
        )

      case 'rarity':
        return (
          <RarityField
            name={field.name}
            value={values[field.name] === '' ? '' : (Number(values[field.name]) as number)}
            onChange={(v) => setValue(field.name, v)}
          />
        )

      case 'toggle':
        return (
          <ToggleField
            label={label ?? ''}
            name={field.name}
            options={lookups[field.optionsKey] ?? []}
            value={String(values[field.name] ?? '')}
            onChange={(v) => setValue(field.name, v)}
          />
        )

      case 'image':
        return (
          <>
            <input
              name={field.column ?? 'image_url'}
              type="hidden"
              value={String(values[field.name] ?? '')}
            />
            <ImageUpload
              caption={field.caption ?? label}
              column={field.column}
              size={field.size}
              slug={String(values.slug ?? '') || undefined}
              table={field.table}
              url={(values[field.name] as string | null) ?? null}
              onUpload={(url) => setValue(field.name, url)}
            />
          </>
        )

      case 'imagePair': {
        const altName = field.altName ?? `${field.name}_alt`
        return (
          <ImageUploadPair
            altImage={(values[altName] as string | null) ?? null}
            hiddenInputName={field.hiddenInputName}
            image={(values[field.name] as string | null) ?? null}
            size={field.size}
            slug={String(values.slug ?? '') || undefined}
            table={field.table}
            onAltImageChange={(url) => setValue(altName, url)}
            onImageChange={(url) => setValue(field.name, url)}
          />
        )
      }

      case 'custom':
        return field.render(values, setValue, { mode, lookups })
    }
  }

  const errorMessage = state && 'error' in state ? state.error : undefined

  return (
    <form action={formAction} id={formId}>
      <Stack spacing={2} sx={{ maxWidth }}>
        {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
        {fields.map((field) => (
          <Fragment key={field.name}>{renderField(field)}</Fragment>
        ))}
      </Stack>
    </form>
  )
}

function sortOptions(
  options: FieldOption[],
  compare?: (a: FieldOption, b: FieldOption) => number
): FieldOption[] {
  return compare ? [...options].sort(compare) : options
}
