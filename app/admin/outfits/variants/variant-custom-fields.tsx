'use client'

import {
  Box,
  Chip,
  FormControl,
  InputLabel,
  ListSubheader,
  MenuItem,
  OutlinedInput,
  Select,
} from '@mui/material'
import { CheckBox, CheckBoxOutlineBlank } from '@mui/icons-material'
import { OutfitSetRaw } from '@/lib/types/outfit'
import { Label } from '@/lib/types/eureka'
import { FieldValues } from '@/lib/types/form-fields'
import { MENU_PROPS } from '@/lib/types/props'

/**
 * Outfit-set picker grouped by base → evolution, matching the standalone
 * ordering the original form used. Selecting a set back-fills rarity, style,
 * and labels from that set; deselecting clears them. In edit mode the very
 * first render is skipped so the variant's own saved values are preserved
 * (the original used an isFirstRender ref for this).
 */
export function GroupedOutfitSetSelect({
  values,
  setValue,
  outfitSets,
  mode,
}: {
  values: FieldValues
  setValue: (name: string, value: unknown) => void
  outfitSets: OutfitSetRaw[]
  mode: 'add' | 'edit'
}) {
  const value = String(values.outfit_set ?? '')

  function applyBackfill(nextSlug: string) {
    const set = outfitSets.find((s) => s.slug === nextSlug)
    if (set) {
      setValue('rarity', typeof set.rarity === 'number' ? set.rarity : '')
      setValue('style', set.style ?? '')
      setValue('label', set.label ?? '')
      setValue('label_2', set.label_2 ?? '')
    } else if (mode === 'add') {
      // In add mode, clearing the set resets the inherited fields. Edit mode
      // leaves the variant's own values in place.
      setValue('rarity', '')
      setValue('style', '')
      setValue('label', '')
      setValue('label_2', '')
    }
  }

  const baseSets = outfitSets
    .filter((s) => s.base_set === null)
    .sort((a, b) => (a.title ?? '').localeCompare(b.title ?? ''))
  const evosByBase = outfitSets
    .filter((s) => s.base_set !== null)
    .reduce<Record<string, OutfitSetRaw[]>>((acc, s) => {
      const key = s.base_set!
      acc[key] = acc[key] ?? []
      acc[key].push(s)
      return acc
    }, {})

  return (
    <FormControl>
      <InputLabel shrink>Outfit Set</InputLabel>
      <input name="outfit_set" type="hidden" value={value} />
      <Select
        displayEmpty
        MenuProps={MENU_PROPS}
        label="Outfit Set"
        value={value}
        onChange={(e) => {
          setValue('outfit_set', e.target.value)
          applyBackfill(e.target.value)
        }}
      >
        <MenuItem value="">— Standalone piece —</MenuItem>
        {baseSets.flatMap((base) => {
          const evos = (evosByBase[base.slug ?? ''] ?? []).sort(
            (a, b) => (a.order ?? 0) - (b.order ?? 0)
          )
          if (evos.length === 0) {
            return [
              <MenuItem key={base.slug} value={base.slug ?? ''}>
                {base.title}
              </MenuItem>,
            ]
          }
          return [
            <ListSubheader key={`header-${base.slug}`}>{base.title}</ListSubheader>,
            <MenuItem key={base.slug} sx={{ pl: 3 }} value={base.slug ?? ''}>
              {base.title}
            </MenuItem>,
            ...evos.map((evo) => (
              <MenuItem key={evo.slug} sx={{ pl: 3 }} value={evo.slug ?? ''}>
                {evo.title}
              </MenuItem>
            )),
          ]
        })}
      </Select>
    </FormControl>
  )
}

/**
 * Two-slot label picker: posts the first two selected labels as `label` and
 * `label_2` scalar hidden inputs (the shared multiSelect field JSON-encodes
 * into one input, which these two columns can't consume).
 */
export function LabelPairSelect({
  values,
  setValue,
  labels,
}: {
  values: FieldValues
  setValue: (name: string, value: unknown) => void
  labels: Label[]
}) {
  const selected = [values.label, values.label_2].filter(Boolean) as string[]

  function setSelected(next: string[]) {
    setValue('label', next[0] ?? '')
    setValue('label_2', next[1] ?? '')
  }

  return (
    <>
      <input name="label" type="hidden" value={selected[0] ?? ''} />
      <input name="label_2" type="hidden" value={selected[1] ?? ''} />
      <FormControl>
        <InputLabel>Labels</InputLabel>
        <Select
          multiple
          MenuProps={MENU_PROPS}
          input={<OutlinedInput label="Labels" />}
          renderValue={(picked) => (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {(picked as string[]).map((s) => (
                <Chip key={s} label={labels.find((l) => l.slug === s)?.title ?? s} size="small" />
              ))}
            </Box>
          )}
          value={selected}
          onChange={(e) => {
            const raw = e.target.value
            const next = typeof raw === 'string' ? raw.split(',') : raw
            if (next.length <= 2) setSelected(next)
          }}
        >
          {labels.map((l) => {
            const isSelected = selected.includes(l.slug)
            return (
              <MenuItem key={l.slug} disabled={!isSelected && selected.length >= 2} value={l.slug}>
                {isSelected ? (
                  <CheckBox fontSize="small" sx={{ mr: 1 }} />
                ) : (
                  <CheckBoxOutlineBlank fontSize="small" sx={{ mr: 1 }} />
                )}
                {l.title}
              </MenuItem>
            )
          })}
        </Select>
      </FormControl>
    </>
  )
}
