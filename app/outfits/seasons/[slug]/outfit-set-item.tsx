'use client'
import LazyImage from "@/components/lazy-image";
import RarityStars from "@/components/rarity-stars";
import { OutfitSet } from "@/lib/types/outfit";
import { Box, Card, CardActionArea, ListItem, ListItemAvatar, ListItemText } from "@mui/material";
import Link from "next/link";

export default function OutfitSetListItem({ set }: { set: OutfitSet }) {
	return (
		<ListItem disablePadding sx={{ overflow: 'clip' }}>
			<CardActionArea component={Link} href={`/outfits/${set.slug}`}>
				<Card sx={{ display: 'flex', alignItems: 'center', p: 1, boxShadow: 'none' }}>
					<ListItemAvatar>
						<LazyImage
							alt={set.title}
							kind="square"
							maxWidth={56}
							src={set.image_url || ''}
						/>
					</ListItemAvatar>
					<ListItemText
						primary={set.title}
						secondary={
							<Box component="span" sx={{ color: 'text.secondary' }}>
								<RarityStars rarity={set.rarity} />
							</Box>
						}
					/>
				</Card>
			</CardActionArea>
		</ListItem>
	)
}