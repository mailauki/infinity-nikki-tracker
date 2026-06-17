'use client'

import { Box, Card, CardActions, CardContent, CardHeader, List, ListItem, ListItemAvatar, Stack, Typography } from '@mui/material'

import { useOutfitData } from '@/components/outfits/outfit-context'
import { Season } from '@/lib/types/outfit'
import LazyImage from '../lazy-image'
import RarityStars from '../rarity-stars'
import { ViewAllButton } from '../view-all-button'

export default function FilterOutfitsBySeason({ seasons }: { seasons: Season[] }) {
  const {
    outfitSets,
  } = useOutfitData()
	return (
		<Box sx={{ containerType: 'inline-size' }}>
		<Box
			sx={{
				display: 'grid',
				gridTemplateColumns: '1fr',
				'@container (min-width: 600px)': { gridTemplateColumns: '1fr 1fr' },
				gap: 3,
			}}
		>
		{seasons.map((season) => (
			<Card key={season.slug}>
      <CardHeader
        disableTypography
        title={
          <Typography noWrap component="h2" sx={{ maxWidth: { xs: 300, sm: 360 } }} variant="h6">
            {season.title}
          </Typography>
        }
      />
			{/* <LazyImage image={season.image_url!} kind="media" sx={{ height: 160 }} title={season.title} /> */}
      <CardContent>
        <List sx={{ width: '100%' }}>
          {outfitSets.filter((set) => set.seasons === season.slug).slice(0,2).map((set) => (
            <ListItem key={set.id} disablePadding>
							<ListItemAvatar>
							<LazyImage kind='avatar' size='lg' src={set.alt_image_url!} />
						</ListItemAvatar>
						<Stack spacing={2} sx={{ ml: 2 }}>
							<Typography variant='subtitle1'>{set.title}</Typography>
							<Typography color='textSecondary'>
								<RarityStars rarity={set.rarity} />
								</Typography>
						</Stack>
            </ListItem>
          ))}
        </List>
      </CardContent>
      <CardActions>
        <ViewAllButton href={`/outfits/seasons/${season.slug}`} />
      </CardActions>
    </Card>
		))}
		</Box>
		</Box>
	)
}
