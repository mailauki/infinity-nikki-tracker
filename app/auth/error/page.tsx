import { Suspense } from 'react'

import { Card, CardContent, CardHeader, Typography } from '@mui/material'

async function ErrorContent({ searchParams }: { searchParams: Promise<{ error: string }> }) {
  const params = await searchParams

  return (
    <Typography color="textSecondary" variant="body2">
      {params?.error ? `Code error: ${params.error}` : 'An unspecified error occurred.'}
    </Typography>
  )
}

export default function ErrorPage({ searchParams }: { searchParams: Promise<{ error: string }> }) {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader title="Sorry, something went wrong." />
          <CardContent>
            <Suspense>
              <ErrorContent searchParams={searchParams} />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
