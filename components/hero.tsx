'use client'

import { alpha, Box, Card, CardMedia, Stack, Typography, useTheme } from '@mui/material'
import { useColorTheme } from './color-theme-context';
import { COLOR_THEME_PRESETS } from '@/lib/theme-presets';

export function Hero() {
  const theme = useTheme()
  const { colorTheme } = useColorTheme()

  const preset = COLOR_THEME_PRESETS[colorTheme]
  const gradient = (surface: string) =>
    `linear-gradient(to top, ${alpha(surface, 1)} 20%, ${alpha(surface, 0.7)} 70%, ${alpha(surface, 0.3)} 90%, ${alpha(surface, 0)} 100%)`
  const background = gradient(preset.light.surface.main)
  const darkBackground = gradient(preset.dark.surface.main)
	
  return (
    <Card
      surface="base"
      sx={{
				position: 'relative',
				overflow: 'hidden', 
				mx: 1,
				borderRadius: 0,
				height: { xs: '20vh', sm: '25vh', md: '30vh' },
				minHeight: 100,
				maxHeight: 360,
				}}>
			<Box sx={{ position: 'absolute', inset: 0 }}>
        <CardMedia
					alt="Infinity Nikki Hero Image"
					component="img"
					// 1400w WebP (~107 KB) instead of the 2560×1440 JPEG (~347 KB) — this is
					// the homepage LCP element, so keep it small and fetch it first.
					fetchPriority="high"
					image="/hero.webp"
					loading="eager"
					sx={{ borderRadius: 2, height: '100%' }}
				/>
      </Box>
			<Stack
				sx={{
					position: 'absolute',
					bottom: 0,
					left: 0,
					width: '100%',
					pt: 8,
					background,
					...theme.applyStyles('dark', { background: darkBackground }),
				}}
			>
				<Typography noWrap component="h1" size="small" sx={{ textAlign: 'center' }} variant="display">
					Infinity Nikki Tracker
				</Typography>
				<Typography
					size='small'
					sx={{
						textAlign: 'center',
						textWrap: 'pretty',
						textTransform: 'uppercase',
						maxWidth: '300px',
						mx: 'auto',
					}}
					variant='title'
				>
					Track your collection from your favorite cozy open-world game
				</Typography>
			</Stack>
    </Card>
  )
}
