import { Box, Card, CardContent, Chip, LinearProgress, Typography } from '@mui/material'
import type { AdminStat } from '@/hooks/data/admin/stats'
import AdminCompletenessToggle from './admin-completeness-toggle'

function Row({ stat }: { stat: AdminStat }) {
  return (
    <Box
      sx={{
        alignItems: 'center',
        display: 'grid',
        gap: 1.5,
        gridTemplateColumns: { xs: '1fr auto', md: '150px 1fr auto 70px' },
        py: 1,
      }}
    >
      <Typography variant="body2">{stat.title}</Typography>
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <LinearProgress
          aria-label={`${stat.title} ${stat.percentComplete}% complete`}
          color={stat.gaps === 0 ? 'success' : 'warning'}
          value={stat.percentComplete}
          variant="determinate"
        />
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {stat.gaps === 0 ? (
          <Chip color="success" label="complete" size="small" variant="outlined" />
        ) : (
          <>
            {/* Chips render only where the field is tracked — a chip for an
                untracked column would imply a backlog that cannot exist. */}
            {stat.noTitle !== null && stat.noTitle > 0 && (
              <Chip
                label={`${stat.noTitle.toLocaleString()} title`}
                size="small"
                variant="outlined"
              />
            )}
            {stat.noImage !== null && stat.noImage > 0 && (
              <Chip
                label={`${stat.noImage.toLocaleString()} img`}
                size="small"
                variant="outlined"
              />
            )}
          </>
        )}
      </Box>
      <Typography sx={{ fontWeight: 600, textAlign: 'right' }} variant="body2">
        {stat.total.toLocaleString()}
      </Typography>
    </Box>
  )
}

export default function AdminCompletenessList({ stats }: { stats: AdminStat[] }) {
  const withGaps = stats.filter((s) => s.gaps > 0).sort((a, b) => b.total - a.total)
  const complete = stats.filter((s) => s.gaps === 0).sort((a, b) => b.total - a.total)
  const completeTotal = complete.reduce((n, s) => n + s.total, 0)

  const all = stats.reduce((n, s) => n + s.total, 0)
  const allGaps = stats.reduce((n, s) => n + s.gaps, 0)

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography color="text.secondary" component="p" variant="overline">
          Completeness — {(all - allGaps).toLocaleString()} of {all.toLocaleString()} complete
        </Typography>
        {withGaps.map((s) => (
          <Row key={s.key} stat={s} />
        ))}
        {complete.length > 0 && (
          <AdminCompletenessToggle
            summary={`${complete.length} entities complete · ${completeTotal.toLocaleString()} entries`}
          >
            {complete.map((s) => (
              <Row key={s.key} stat={s} />
            ))}
          </AdminCompletenessToggle>
        )}
      </CardContent>
    </Card>
  )
}
