'use client'

import { EurekaSet } from '@/lib/types/eureka'
import { OutfitSet } from '@/lib/types/outfit'
import { isGlowup } from '@/hooks/outfit'
import { Divider, Stack, Typography } from '@mui/material'

export default function ProfileStats({
  eurekaSets,
  outfitSets,
}: {
  eurekaSets: EurekaSet[]
  outfitSets: OutfitSet[]
}) {
  const eurekaSetsObtained = eurekaSets.filter(
    (set) => set.eureka_variants.length > 0 && set.eureka_variants.every((v) => v.obtained)
  ).length
  // A set is complete when all its base-state variants (outfit_set === set.slug) are obtained.
  const outfitSetsObtained = outfitSets.filter((set) => {
    const baseVariants = set.outfit_variants.filter((v) => v.outfit_set === set.slug)
    return baseVariants.length > 0 && baseVariants.every((v) => v.obtained)
  }).length
  const isEvolutionObtained = (set: OutfitSet, evolutionSlug: string) => {
    const variants = set.outfit_variants.filter((v) => v.outfit_set === evolutionSlug)
    return variants.length > 0 && variants.every((v) => v.obtained)
  }
  const evolutionsObtained = outfitSets.reduce((count, set) => {
    return (
      count +
      set.evolutions.filter(
        (evolution) => !isGlowup(evolution) && isEvolutionObtained(set, evolution.slug)
      ).length
    )
  }, 0)
  const glowupsObtained = outfitSets.reduce((count, set) => {
    return (
      count +
      set.evolutions.filter(
        (evolution) => isGlowup(evolution) && isEvolutionObtained(set, evolution.slug)
      ).length
    )
  }, 0)

  return (
    <Stack
      direction="row"
      divider={<Divider flexItem orientation="vertical" variant="middle" />}
      spacing={{ xs: 1, sm: 2, md: 3 }}
    >
      <Stat obtained={outfitSetsObtained || 0} title="Outfit Sets" />
      <Stat obtained={evolutionsObtained || 0} title="Evolutions" />
      <Stat obtained={glowupsObtained || 0} title="Glow-ups" />
      <Stat obtained={eurekaSetsObtained || 0} title="Eureka Sets" />
    </Stack>
  )
}

function Stat({ title, obtained }: { title: string; obtained: number }) {
  return (
    <Stack sx={{ alignItems: 'center', flexGrow: { xs: 1, sm: 1, md: 0 } }}>
      <Typography variant="overline">{title}</Typography>
      <Typography component="span" variant="h6">
        {obtained}
      </Typography>
    </Stack>
  )
}
