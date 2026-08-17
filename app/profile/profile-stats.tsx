'use client'

import { EurekaSet } from '@/lib/types/eureka'
import { MakeupSet } from '@/lib/types/makeup'
import { OutfitSet } from '@/lib/types/outfit'
import { isGlowup } from '@/hooks/outfit'
import { isStandaloneMakeupSet } from '@/hooks/makeup'
import { Divider, Stack, Typography } from '@mui/material'

export default function ProfileStats({
  eurekaSets,
  makeupSets,
  momoCloaksObtained,
  outfitSets,
}: {
  eurekaSets: EurekaSet[]
  makeupSets: MakeupSet[]
  /** Cloaks are flat rows with no variants, so the count is resolved server-side. */
  momoCloaksObtained: number
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
  // A base makeup set carries its evolutions' variants too (createMakeupSet
  // concatenates them), so scope to the set's own variants the same way the
  // outfit count above does — otherwise an unfinished evolution would keep a
  // completed base set from ever counting.
  const makeupSetsObtained = makeupSets.filter((set) => {
    const baseVariants = set.makeup_variants.filter((v) =>
      // The synthetic "Standalone Pieces" bucket also collects straggler
      // variants whose makeup_set is still NULL, so match those to it the way
      // createMakeupSet does — otherwise they'd be dropped from its own
      // completion check.
      isStandaloneMakeupSet(set)
        ? !v.makeup_set || v.makeup_set === set.slug
        : v.makeup_set === set.slug
    )
    return baseVariants.length > 0 && baseVariants.every((v) => v.obtained)
  }).length

  return (
    <Stack
      direction="row"
      divider={<Divider flexItem orientation="vertical" variant="middle" />}
      spacing={{ xs: 1, sm: 2, md: 3 }}
      // Six stats crowd the card on small screens, so Makeup and Cloaks drop
      // out below md. Stack interleaves its dividers into its own child list
      // ([Stat, Div, Stat, Div, ...], 11 nodes here), so hiding the two Stats
      // alone would strand the dividers beside them. Hiding from the 8th child
      // on takes the trailing `Div, Stat, Div, Stat` as one unit — which is why
      // this lives on the container rather than as a prop on Stat.
      sx={{ '& > :nth-child(n + 8)': { display: { xs: 'none', md: 'flex' } } }}
    >
      <Stat obtained={outfitSetsObtained || 0} title="Outfit Sets" />
      <Stat obtained={evolutionsObtained || 0} title="Evolutions" />
      <Stat obtained={glowupsObtained || 0} title="Glow-ups" />
      <Stat obtained={eurekaSetsObtained || 0} title="Eureka Sets" />
      <Stat obtained={makeupSetsObtained || 0} title="Makeup" />
      <Stat obtained={momoCloaksObtained || 0} title="Cloaks" />
    </Stack>
  )
}

function Stat({ title, obtained }: { title: string; obtained: number }) {
  return (
    <Stack sx={{ alignItems: 'center', flexGrow: { xs: 1, sm: 1, md: 0 } }}>
      <Typography size="small" variant="label">{title}</Typography>
      <Typography component="span" size="small" variant="headline">
        {obtained}
      </Typography>
    </Stack>
  )
}
