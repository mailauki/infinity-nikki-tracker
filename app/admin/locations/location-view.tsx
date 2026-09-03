'use client'

import { useAdminView } from '../admin-view-context'
import { LocationRaw } from '@/hooks/data/admin/locations'
import { LocationTable } from './location-table'
import LocationList from './location-list'
import TableContainer from '../table-container'

export default function LocationView({ locations }: { locations: LocationRaw[] }) {
  const { view } = useAdminView()

  return view === 'table' ? (
    <TableContainer>
      <LocationTable rows={locations} />
    </TableContainer>
  ) : (
    <LocationList rows={locations} />
  )
}
