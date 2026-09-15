'use client'

import { Box, Card, CardActionArea, Stack, Typography, CardContent } from '@mui/material'
import Link from 'next/link'
import { SimpleGrid } from './card-grid'
import ToggleIcon from './toggle-icon'
import { navLinksData } from '@/lib/nav-links'

export function QuickAccess() {
  return (
    <Box sx={{ py: 3 }}>
      <Typography
        size="small"
        sx={{ display: 'block', textAlign: 'center', mb: 2, textTransform: 'uppercase' }}
        variant="label"
      >
        Quick Access
      </Typography>
      <SimpleGrid
        columns={{
          xs: 'repeat(2, 1fr)',
          sm: 'repeat(3, 1fr)',
          md: 'repeat(4, 1fr)',
          lg: 'repeat(6, 1fr)',
        }}
      >
        {navLinksData.collection.map(({ title, url, image }) => (
          <Card key={url} level="low">
            <CardActionArea component={Link} href={url} sx={{ height: '100%' }}>
              <CardContent>
                <Stack sx={{ alignItems: 'center', justifyContent: 'center' }}>
                  <ToggleIcon image={image} size="md" />
                  <Typography
                    component="span"
                    size="large"
                    sx={{ textAlign: 'center', pt: 0, pb: 1 }}
                    variant="title"
                  >
                    {title}
                  </Typography>
                </Stack>
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </SimpleGrid>
    </Box>
  )
}
