'use client'
import { Category, Eureka } from '@/lib/types/types'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Avatar,
  Box,
  Chip,
  Divider,
  LinearProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListSubheader,
  Paper,
  Typography,
} from '@mui/material'
import PaletteIcon from '@mui/icons-material/Palette'
import CategoryIcon from '@mui/icons-material/Category'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { count, percent } from '@/hooks/count'
import React from 'react'

export default function ProgressList({
  items,
  eureka,
  filter,
}: {
  items: Category[]
  eureka: Eureka[]
  filter?: 'colors' | 'categories'
}) {
  return (
    <List
      sx={{
        width: '100%',
        // minWidth: 300,
        // maxWidth: { xs: "100%", sm: "50%", md: 360 }
      }}
      subheader={
        <ListSubheader disableSticky sx={{ textTransform: 'capitalize' }}>
          {filter}
        </ListSubheader>
      }
    >
      {items.map((item) => (
        <ProgressItem key={item.name} item={item} eureka={eureka} filter={filter} />
      ))}
    </List>
  )
}

function ProgressItem({
  item,
  eureka,
  filter,
}: {
  item: Category
  eureka: Eureka[]
  filter?: 'colors' | 'categories'
}) {
  const filteredEureka = eureka.filter(
    (eureka) => (filter === 'colors' ? eureka.color : eureka.category) === item.name
  )
  const obtainedCount = count(filter ? filteredEureka : eureka)
  const percentage = percent(obtainedCount.obtained, obtainedCount.total)

  return (
    <>
      <ListItem
        secondaryAction={
          <Chip
            label={`${obtainedCount.obtained} / ${obtainedCount.total}`}
            variant="outlined"
            size="small"
          />
        }
      >
        <ListItemAvatar>
          <Avatar alt={item.name}>
            {filter === 'colors' ? <PaletteIcon /> : <CategoryIcon />}
          </Avatar>
        </ListItemAvatar>
        <ListItemText primary={item.name} secondary={`${percentage}%`} />
      </ListItem>
      <ListItem disablePadding>
        <ListItemText inset>
          <LinearProgress value={percentage} variant="determinate" color="inherit" sx={{ mx: 2 }} />
        </ListItemText>
      </ListItem>
    </>
  )
}
