import { OutfitSet } from '@/lib/types/outfit'
import { RadioButtonUncheckedOutlined, TaskAlt } from '@mui/icons-material'
import { Card, CardActionArea, CardHeader, IconButton, Typography } from '@mui/material'
import RarityStars from '../rarity-stars'
import Link from 'next/link'
import OutfitSetImage from './outfit-set-image'

export default function OutfitSetCard({
  set,
  isLoggedIn,
  obtained,
  onToggle,
}: {
  set: OutfitSet
  isLoggedIn: boolean
  obtained: boolean
  onToggle: () => void
}) {
  return (
    <Card sx={{ flexGrow: 1 }}>
			<CardActionArea component={Link} href={`/outfits/${set.slug}`}>
      <OutfitSetImage set={set} />
			</CardActionArea>
      <CardHeader
        disableTypography
        action={
          isLoggedIn && (
            <IconButton
              aria-label={obtained ? 'Mark as not obtained' : 'Mark as obtained'}
              onClick={onToggle}
            >
              {obtained ? <TaskAlt /> : <RadioButtonUncheckedOutlined />}
            </IconButton>
          )
        }
        subheader={<RarityStars rarity={set.rarity} />}
				title={<Typography noWrap sx={{ pb: 0.5 }} variant='subtitle1'>{set.title}</Typography>}
      />
    </Card>
  )
}
