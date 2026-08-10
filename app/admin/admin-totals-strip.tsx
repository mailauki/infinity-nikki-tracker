import { Box, Card, CardContent, Chip, Typography } from '@mui/material'
import { ADMIN_DOMAINS, type AdminEntityKey } from '@/lib/admin-entities'
import type { AdminStat } from '@/hooks/data/admin/stats'

export default function AdminTotalsStrip({ stats }: { stats: AdminStat[] }) {
  const by = new Map(stats.map((s) => [s.key, s]))
  const get = (k: AdminEntityKey) => by.get(k)

  const allEntries = stats.reduce((n, s) => n + s.total, 0)
  const allGaps = stats.reduce((n, s) => n + s.gaps, 0)
  const percent = allEntries === 0 ? 100 : Math.round(((allEntries - allGaps) / allEntries) * 100)

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr 1fr', md: '1.25fr 1fr 1fr 1fr 1fr' },
        gap: 2,
      }}
    >
      <Card sx={{ borderWidth: 2 }} variant="outlined">
        <CardContent>
          <Typography color="text.secondary" component="p" variant="overline">
            All entries
          </Typography>
          <Typography component="p" variant="h2">
            {allEntries.toLocaleString()}
          </Typography>
          <Chip label={`${percent}% complete`} size="small" sx={{ mt: 1 }} variant="outlined" />
        </CardContent>
      </Card>

      {ADMIN_DOMAINS.map((domain) => {
        const lead = get(domain.lead)
        return (
          <Card key={domain.title} variant="outlined">
            <CardContent>
              <Typography color="text.secondary" component="p" variant="overline">
                {domain.title}
              </Typography>
              <Typography component="p" variant="h2">
                {(lead?.total ?? 0).toLocaleString()}
              </Typography>
              <Typography color="text.secondary" component="p" variant="caption">
                {domain.leadNoun}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                {domain.chips.length === 0 ? (
                  <Chip
                    disabled
                    label="no sets"
                    size="small"
                    sx={{ opacity: 0.6 }}
                    variant="outlined"
                  />
                ) : (
                  domain.chips.map((chip) => (
                    <Chip
                      key={chip.key}
                      label={`${(get(chip.key)?.total ?? 0).toLocaleString()} ${chip.label}`}
                      size="small"
                      variant="outlined"
                    />
                  ))
                )}
              </Box>
            </CardContent>
          </Card>
        )
      })}
    </Box>
  )
}
