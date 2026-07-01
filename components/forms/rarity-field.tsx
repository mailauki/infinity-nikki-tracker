'use client'

import RarityToggle from '@/components/filter/rarity-toggle'

/**
 * The shared rarity picker: `RarityToggle` plus the hidden input that carries
 * the value in FormData. The value is kept as `number | ''` (empty when unset)
 * so it matches the existing forms' state and posts `''` for "no rarity".
 */
export default function RarityField({
  name = 'rarity',
  value,
  onChange,
}: {
  name?: string
  value: number | ''
  onChange: (value: number | '') => void
}) {
  return (
    <>
      <input name={name} type="hidden" value={value} />
      <RarityToggle
        selectedRarity={typeof value === 'number' ? value : null}
        onRarityChange={(_, next) => onChange(next ?? '')}
      />
    </>
  )
}
