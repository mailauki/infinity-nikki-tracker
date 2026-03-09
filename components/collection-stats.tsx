import { Box, Card, CardHeader, Chip, Typography } from '@mui/material'
import { countObtained, percent } from '@/hooks/count-obtained'
import { EurekaSet } from '@/lib/types/eureka'
import EurekaCardProgress from './eureka/eureka-card-progress'

function CollectionStatCard({
  title,
  obtained,
  total,
}: {
  title: string
  obtained: number
  total: number
}) {
  const percentage = percent(obtained, total)

  return (
    <Card variant="outlined">
      <CardHeader
        disableTypography
        title={
          <Typography variant="overline" color="text.secondary">
            {title}
          </Typography>
        }
        action={<Chip label={`${obtained} / ${total}`} size="small" variant="outlined" />}
      />
      <EurekaCardProgress percentage={percentage} size="xs" />
    </Card>
  )
}

export default function CollectionStats({ sets }: { sets: EurekaSet[] }) {
  const allVariants = sets.flatMap((s) => s.eureka_variants)

  const setsObtained = sets.filter((s) => s.eureka_variants.every((v) => v.obtained)).length
  const { obtained: itemsObtained, total: itemsTotal } = countObtained(allVariants)

  const allCategories = [...new Set(allVariants.map((v) => v.category).filter(Boolean))]
  const categoriesObtained = allCategories.filter((cat) =>
    allVariants.filter((v) => v.category === cat).every((v) => v.obtained)
  ).length

  const allColors = [...new Set(allVariants.map((v) => v.color).filter(Boolean))]
  const colorsObtained = allColors.filter((color) =>
    allVariants.filter((v) => v.color === color).every((v) => v.obtained)
  ).length

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr 1fr', md: '1fr 1fr 1fr 1fr' },
        gap: 2,
        mb: 3,
      }}
    >
      <CollectionStatCard title="Sets" obtained={setsObtained} total={sets.length} />
      <CollectionStatCard title="Items" obtained={itemsObtained} total={itemsTotal} />
      <CollectionStatCard
        title="Categories"
        obtained={categoriesObtained}
        total={allCategories.length}
      />
      <CollectionStatCard title="Colors" obtained={colorsObtained} total={allColors.length} />
    </Box>
  )
}
