import { Skeleton, Stack, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material'

export default function EurekaSetsDashboardLoading() {
  return (
    <Stack spacing={2} sx={{ pt: 2 }}>
      <Table>
        <TableHead>
          <TableRow>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableCell key={i}>
                <Skeleton height={20} variant="text" width={80} />
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {Array.from({ length: 10 }).map((_, i) => (
            <TableRow key={i}>
              {Array.from({ length: 5 }).map((_, j) => (
                <TableCell key={j}>
                  <Skeleton height={20} variant="text" width={j === 0 ? 160 : 80} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Stack>
  )
}
