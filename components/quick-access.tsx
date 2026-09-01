'use client'

import {
  Accordion,
  AccordionDetails,
  AccordionSummary as MuiAccordionSummary,
  Box,
  Card,
  CardActionArea,
  CardHeader,
  Stack,
  Typography,
  AccordionSummaryProps,
  accordionSummaryClasses,
  styled,
  Divider,
  List,
  ListItemIcon,
  ListItemButton,
  ListItemText,
  ListItem,
} from '@mui/material'
import Link from 'next/link'
import LazyImage from './lazy-image'
import { SimpleGrid } from './card-grid'
import ToggleIcon from './toggle-icon'
import { navLinksData } from '@/lib/nav-links'
import { ArrowForward } from '@mui/icons-material'

const cards = [
  {
    title: 'Outfits',
    subtitle: 'Browse all outfit sets in the game',
    href: '/outfits',
    image: '/icons/outfits.png',
  },
  {
    title: 'Eureka Sets',
    subtitle: 'Track your collection progress',
    href: '/eureka',
    image: '/icons/eureka.png',
  },
]

const extraCards = navLinksData.collection.slice(2, -2)

const moreCards = [
  navLinksData.collection.slice(-1),
  navLinksData.collection.filter((link) => link.items).flatMap((link) => link.items!),
  navLinksData.support,
]

const AccordionSummary = styled((props: AccordionSummaryProps) => (
  <MuiAccordionSummary expandIcon={<ArrowForward fontSize="small" />} {...props} />
))(() => ({
  [`& .${accordionSummaryClasses.expandIconWrapper}.${accordionSummaryClasses.expanded}`]: {
    transform: 'rotate(90deg)',
  },
}))

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
      <SimpleGrid columns="1fr 1fr">
        {cards.map(({ title, subtitle, href }) => (
          <Card key={href} surface="dim">
            <CardActionArea component={Link} href={href} sx={{ height: '100%' }}>
              <Stack sx={{ alignItems: 'center', justifyContent: 'center' }}>
                <LazyImage
                  // Decorative: the CardActionArea is already named by the
                  // card's title/subtitle, so alt text here would just repeat it.
                  alt=""
                  size="xl"
                  src={
                    title === 'Outfits'
                      ? '/quick-access/perfect-start-alt.png'
                      : '/quick-access/first-snow-head-white.png'
                  }
                  variant="square"
                />
              </Stack>
              <CardHeader
                slotProps={{
                  title: { variant: 'title', size: 'large', component: 'span' },
                  subheader: {
                    variant: 'label',
                    size: 'small',
                    sx: { textTransform: 'uppercase' },
                  },
                }}
                subheader={subtitle}
                sx={{ textAlign: 'center', pt: 0 }}
                title={title}
              />
            </CardActionArea>
          </Card>
        ))}
        {extraCards.map((link) => (
          <Card key={link.url}>
            <CardActionArea component={Link} href={link.url}>
              <CardHeader
                avatar={<ToggleIcon image={link.image} />}
                slotProps={{
                  title: { variant: 'title', component: 'span' },
                }}
                title={link.title === 'Makeup' ? 'Makeup Sets' : link.title}
              />
            </CardActionArea>
          </Card>
        ))}
      </SimpleGrid>
      <Box sx={{ mt: 2 }}>
        <Accordion variant="filled">
          <AccordionSummary>See more</AccordionSummary>
          <AccordionDetails>
            {moreCards.map((links, index) => (
              <List key={index} disablePadding>
                <Divider
                  component="li"
                  role="listitem"
                  sx={{ display: index === 0 ? 'none' : 'flex' }}
                />
                {links.map((link) => (
                  <ListItem key={link.url} disablePadding>
                    <ListItemButton component={Link} href={link.url}>
                      <ListItemIcon>{link.icon}</ListItemIcon>
                      <ListItemText primary={link.title} sx={{ pl: 1 }} />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            ))}
          </AccordionDetails>
        </Accordion>
      </Box>
    </Box>
  )
}
