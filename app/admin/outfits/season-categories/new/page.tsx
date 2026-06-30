import { Suspense } from 'react'
import { Stack } from '@mui/material'
import { Metadata } from 'next'
import AddSeasonCategoryForm from './add-season-category-form'

export const metadata: Metadata = {
  title: 'Add Season Category',
}

export default function NewSeasonCategoryPage() {
  return (
    <Suspense>
      <Stack spacing={3} sx={{ flexGrow: 1, py: 3 }}>
        <AddSeasonCategoryForm />
      </Stack>
    </Suspense>
  )
}
