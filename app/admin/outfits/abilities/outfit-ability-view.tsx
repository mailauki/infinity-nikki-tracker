'use client'

import { useAdminView } from '../../admin-view-context'
import { AbilityRaw } from '@/hooks/data/admin/abilities'
import { OutfitAbilityTable } from './outfit-ability-table'
import OutfitAbilityList from './outfit-ability-list'
import TableContainer from '../../table-container'

export default function OutfitAbilityView({ abilities }: { abilities: AbilityRaw[] }) {
  const { view } = useAdminView()

  return view === 'table' ? (
    <TableContainer>
      <OutfitAbilityTable rows={abilities} />
    </TableContainer>
  ) : (
    <OutfitAbilityList rows={abilities} />
  )
}
