'use client'

import { Fragment, ReactNode } from 'react'
import { Divider, List } from '@mui/material'
import PaginationContainer from './pagination-container'

interface AdminListProps<T> {
  title: string
  rows: T[] | null | undefined
  addHref: string
  getKey: (row: T) => string | number
  renderRow: (row: T) => ReactNode
  page?: number
  rowsPerPage?: number
  onPageChange?: (page: number) => void
  onRowsPerPageChange?: (rowsPerPage: number) => void
}

export function AdminList<T>({
  title,
  rows,
  addHref,
  getKey,
  renderRow,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
}: AdminListProps<T>) {
  return (
    <PaginationContainer
      addHref={addHref}
      page={page}
      rows={rows}
      rowsPerPage={rowsPerPage}
      title={title}
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
    >
      {(visibleRows) => (
        <List disablePadding>
          {visibleRows.map((row) => (
            <Fragment key={getKey(row)}>
              {renderRow(row)}
              {row !== visibleRows.at(-1) && (
                <Divider component="li" sx={{ mr: 2 }} variant="inset" />
              )}
            </Fragment>
          ))}
        </List>
      )}
    </PaginationContainer>
  )
}
