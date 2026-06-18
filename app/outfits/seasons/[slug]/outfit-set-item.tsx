'use client'
import LazyImage from '@/components/lazy-image'
import RarityStars from '@/components/rarity-stars'
import { OutfitSet } from '@/lib/types/outfit'
import { Box, ListItem, ListItemAvatar, ListItemButton, ListItemText } from '@mui/material'
import Link from 'next/link'

export default function OutfitSetListItem({ set }: { set: OutfitSet }) {
  return (
    <ListItem disablePadding>
      <ListItemButton component={Link} href={`/outfits/${set.slug}`}>
          <ListItemAvatar>
            <LazyImage alt={set.title} kind="square" maxWidth={56} src={set.image_url || ''} />
          </ListItemAvatar>
          <ListItemText
            primary={set.title}
            secondary={
              <RarityStars rarity={set.rarity} />
            }
          />
      </ListItemButton>
    </ListItem>
  )
}
