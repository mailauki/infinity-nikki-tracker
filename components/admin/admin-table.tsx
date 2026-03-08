'use client'

import { ReactNode } from 'react'
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'
import { SxProps, Theme } from '@mui/material/styles'
import PaginationContainer from './pagination-container'

export interface Column<T> {
  header: string
  cell: (row: T) => ReactNode
  align?: 'left' | 'right' | 'center'
  cellSx?: SxProps<Theme>
}

interface AdminTableProps<T> {
  title: string
  rows: T[] | null | undefined
  columns: Column<T>[]
  slug: string
  getKey: (row: T) => string | number
}

export function AdminTable<T>({ title, rows, columns, slug, getKey }: AdminTableProps<T>) {
  return (
    <PaginationContainer title={title} slug={slug} rows={rows}>
      {(visibleRows) => (
        <TableContainer sx={{ overflowX: 'auto', flex: 1, height: '100%', minHeight: '592px' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                {columns.map((col) => (
                  <TableCell key={col.header} align={col.align} sx={{ whiteSpace: 'nowrap' }}>
                    {col.header}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {visibleRows.map((row) => (
                <TableRow key={getKey(row)}>
                  {columns.map((col) => (
                    <TableCell
                      key={col.header}
                      align={col.align}
                      sx={{ whiteSpace: 'nowrap', ...col.cellSx }}
                    >
                      {col.cell(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </PaginationContainer>
  )
}
