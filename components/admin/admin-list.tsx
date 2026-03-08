'use client'

import { Fragment, ReactNode } from 'react'
import { List } from '@mui/material'
import PaginationContainer from './pagination-container'

interface AdminListProps<T> {
  title: string
  rows: T[] | null | undefined
  slug: string
  getKey: (row: T) => string | number
  renderRow: (row: T) => ReactNode
}

export function AdminList<T>({ title, rows, slug, getKey, renderRow }: AdminListProps<T>) {
  return (
    <PaginationContainer title={title} slug={slug} rows={rows}>
      {(visibleRows) => (
        <List>
          {visibleRows.map((row) => (
            <Fragment key={getKey(row)}>{renderRow(row)}</Fragment>
          ))}
        </List>
      )}
    </PaginationContainer>
  )
}
