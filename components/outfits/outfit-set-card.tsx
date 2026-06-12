import { Evolution, OutfitSet } from '@/lib/types/outfit'
import { RadioButtonUncheckedOutlined, TaskAlt } from '@mui/icons-material'
import { Card, CardActionArea, CardHeader, CardMedia, IconButton, Typography } from '@mui/material'
import RarityStars from '../rarity-stars'
import Link from 'next/link'
import { toTitle } from '@/lib/utils'
import OutfitSetImage from './outfit-set-image'

export default function OutfitSetCard({
  set,
  evolution = null,
  isLoggedIn,
  obtained,
  onToggle,
}: {
  set: OutfitSet
  // When provided, the card represents this evolution of the set (its image,
  // title, and link); otherwise it represents the base set.
  evolution?: Evolution | null
  isLoggedIn: boolean
  obtained: boolean
  onToggle: () => void
}) {
  const href = evolution ? `/outfits/${evolution.slug.replace('-','?evolution=')}` : `/outfits/${set.slug}`
  const title = evolution
    ? `${set.title}: ${toTitle(evolution.subtitle ?? evolution.slug)}`
    : set.title

  return (
    <Card sx={{ flexGrow: 1 }}>
      <CardActionArea component={Link} href={href}>
        <OutfitSetImage overrideSrc={evolution?.image_url} set={set} />
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
				subheader={
          <Typography color="textSecondary" variant="subtitle2">
            <RarityStars rarity={set.rarity} />
          </Typography>
        }
        sx={{ '& .MuiCardHeader-content': { maxWidth: 'calc(100% - 40px)' }}}
        title={
          <Typography noWrap sx={{ pb: 0.5, fontSize: { sm: 'subtitle2.fontSize', md: 'subtitle1.fontSize' } }} variant={'subtitle1'}>
            {title}
          </Typography>
        }
      />
    </Card>
  )
}
