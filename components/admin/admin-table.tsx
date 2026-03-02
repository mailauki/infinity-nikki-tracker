'use client'

import { ReactNode, useState } from 'react'
import {
  Button,
  CardHeader,
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from '@mui/material'
import { SxProps, Theme } from '@mui/material/styles'
import AddIcon from '@mui/icons-material/Add'

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
  addHref: string
  addLabel: string
  getKey: (row: T) => string | number
}

export function AdminTable<T>({
  title,
  rows,
  columns,
  addHref,
  addLabel,
  getKey,
}: AdminTableProps<T>) {
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(20)

  const allRows = rows ?? []
  const visibleRows = allRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  return (
    <>
      <CardHeader
        disableTypography
        title={
          <Typography variant="h3" component="h1">
            {title}
          </Typography>
        }
        action={<Chip variant="outlined" color="secondary" label={`Total: ${allRows.length}`} />}
      />
      <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
        <Button variant="outlined" startIcon={<AddIcon />} size="small" href={addHref}>
          {addLabel}
        </Button>
      </Stack>
      <Paper>
        <TableContainer sx={{ overflowX: 'auto' }}>
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
        <TablePagination
          component="div"
          count={allRows.length}
          page={page}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[10, 20, 50, 100]}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10))
            setPage(0)
          }}
        />
      </Paper>
    </>
  )
}
