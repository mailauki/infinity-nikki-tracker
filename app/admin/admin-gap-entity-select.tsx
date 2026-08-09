'use client'

import { MenuItem, TextField } from '@mui/material'
import { useRouter } from 'next/navigation'
import {
  ADMIN_ENTITIES,
  ADMIN_ENTITY_KEYS,
  type AdminEntityKey,
  type GapKind,
} from '@/lib/admin-entities'
import { buildDashboardHref } from '@/lib/admin-routes'

export default function AdminGapEntitySelect({
  entity,
  gap,
}: {
  entity: AdminEntityKey
  gap: GapKind
}) {
  const router = useRouter()

  return (
    <TextField
      select
      label="Entity"
      size="small"
      sx={{ minWidth: 200 }}
      value={entity}
      onChange={(e) => router.push(buildDashboardHref({ entity: e.target.value, gap }))}
    >
      {ADMIN_ENTITY_KEYS.map((key) => (
        <MenuItem key={key} value={key}>
          {ADMIN_ENTITIES[key].title}
        </MenuItem>
      ))}
    </TextField>
  )
}
