'use client'

import { EurekaSet } from "@/lib/types/eureka";
import { OutfitSet } from "@/lib/types/outfit";
import { Divider, Stack, Typography } from "@mui/material";

export default function ProfileStats({
	eurekaSets, outfitSets,
}: {
	eurekaSets: EurekaSet[]
	outfitSets: OutfitSet[]
}) {
	const eurekaSetsObtained = eurekaSets.filter((set) =>
    set.eureka_variants.every((variant) => variant.obtained)
  ).length
	const outfitSetsObtained = outfitSets.filter((set) => {
    const baseVariants = set.outfit_variants.filter((v) => v.evolution === null)
    return baseVariants.length > 0 && baseVariants.every((v) => v.obtained)
  }).length

	return (
		<Stack direction='row' divider={<Divider flexItem orientation="vertical" variant="middle" />} spacing={3}>
			<Stack sx={{ alignItems: 'center' }}>
				<Typography variant='overline'>Eureka Sets</Typography>
				<Typography component='span' variant='h6'>{eurekaSetsObtained || 0}</Typography>
			</Stack>
			<Stack sx={{ alignItems: 'center' }}>
				<Typography variant='overline'>Outfit Sets</Typography>
				<Typography component='span' variant='h6'>{outfitSetsObtained || 0}</Typography>
			</Stack>
		</Stack>
	)
}