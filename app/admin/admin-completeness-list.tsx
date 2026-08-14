import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material'
import type { AdminStat } from '@/hooks/data/admin/stats'
import AdminCompletenessToggle from './admin-completeness-toggle'

function Row({ stat }: { stat: AdminStat }) {
  return (
    <Stack sx={{ px: 1 }}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', py: 1 }}>
        <Typography variant="body2">{stat.title}</Typography>
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
          <Typography sx={{ fontWeight: 600, textAlign: 'right', width: 50 }} variant="body2">
            {stat.total.toLocaleString()}
          </Typography>
        </Box>
      </Stack>
      <Box>
        <LinearProgress
          aria-label={`${stat.title} ${stat.percentComplete}% complete`}
          color={stat.gaps === 0 ? 'success' : 'warning'}
          value={stat.percentComplete}
          variant="determinate"
        />
      </Box>
    </Stack>
  )
}

export default function AdminCompletenessList({ stats }: { stats: AdminStat[] }) {
  const withGaps = stats.filter((s) => s.gaps > 0).sort((a, b) => b.total - a.total)
  const complete = stats.filter((s) => s.gaps === 0).sort((a, b) => b.total - a.total)
  const completeTotal = complete.reduce((n, s) => n + s.total, 0)

  const all = stats.reduce((n, s) => n + s.total, 0)
  const allGaps = stats.reduce((n, s) => n + s.gaps, 0)

  return (
    <Card elevation={3} sx={{ backgroundColor: 'surface.containerLowest' }} variant="elevation">
      <CardHeader
        slotProps={{
          title: { color: 'text.secondary', component: 'p', variant: 'overline' },
          subheader: { color: 'text.secondary', component: 'p', variant: 'caption' },
        }}
        subheader={`${(all - allGaps).toLocaleString()} of ${all.toLocaleString()} complete`}
        title="Completeness"
      />
      <CardContent sx={{ pt: 0 }}>
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
