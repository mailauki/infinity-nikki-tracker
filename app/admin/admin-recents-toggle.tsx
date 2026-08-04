'use client'
import { useId, useState } from 'react'
import ToggleIcon from '@/components/toggle-icon'
import { navLinksData } from '@/lib/nav-links'
import { ExpandLess, ExpandMore } from '@mui/icons-material'
import {
  Box,
  CardContent,
  CardHeader,
  Collapse,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material'

const VISIBLE_ITEM_COUNT = 3
const OVERFLOW_VALUE = '__overflow__'

type Props = {
  title: string
  item: string
  tab: string
  onItemChange: (item: string) => void
  onTabChange: (tab: string) => void
}

export default function AdminRecentsToggle({ title, item, tab, onItemChange, onTabChange }: Props) {
  const id = useId()
  const [isExpanded, setIsExpanded] = useState(false)

  const currentTab = navLinksData.admin.tabs.find((t) => t.title === tab)
  const items = currentTab?.items ?? []

  // The first row is fixed; anything past it lives in a second row the expand toggle
  // reveals. Row contents never change, so a toggle stays put under the cursor.
  const visibleItems = items.slice(0, VISIBLE_ITEM_COUNT)
  const overflowItems = items.slice(VISIBLE_ITEM_COUNT)

  // Keep the overflow row open whenever its item is the active filter, so switching tabs
  // or landing on a hidden selection never leaves the pressed toggle out of sight.
  const isOverflowSelected = overflowItems.some((i) => i.title === item)
  const showOverflow = isExpanded || isOverflowSelected

  return (
    <>
      <CardHeader
        disableTypography
        action={
          <ToggleButtonGroup
            exclusive
            size="small"
            value={tab}
            onChange={(_, v) => {
              if (!v) return
              onTabChange(v)
              // The new tab always selects its first item, which is in row one — start it
              // collapsed rather than carrying the previous tab's expanded state over.
              setIsExpanded(false)
              const firstItem = navLinksData.admin.tabs.find((t) => t.title === v)?.items?.[0]
              if (firstItem) onItemChange(firstItem.title)
            }}
          >
            {navLinksData.admin.tabs.map((t) => (
              <Tooltip key={t.title} title={t.title}>
                <ToggleButton size="small" value={t.title}>
                  <ToggleIcon
                    image={t.image}
                    isSelected={tab === t.title}
                    size="xs"
                    title={t.title}
                  />
                </ToggleButton>
              </Tooltip>
            ))}
          </ToggleButtonGroup>
        }
        sx={{ pb: 0 }}
        title={
          <Typography color="text.secondary" variant="overline">
            {title}
          </Typography>
        }
      />
      <CardContent>
        <Stack spacing={1} sx={{ flexGrow: 1 }}>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={item}
            onChange={(_, v) => {
              // The expand trigger lives inside the exclusive group, so its value reaches
              // onChange too — it toggles the second row instead of becoming the filter.
              if (!v || v === OVERFLOW_VALUE) return
              onItemChange(v)
            }}
          >
            {visibleItems.map((i) => (
              <ToggleButton key={i.title} size="small" value={i.title}>
                {i.title}
              </ToggleButton>
            ))}
            {overflowItems.length > 0 && (
              <ToggleButton
                aria-controls={showOverflow ? `${id}-overflow-row` : undefined}
                aria-expanded={showOverflow}
                aria-label={showOverflow ? 'Hide more sections' : 'Show more sections'}
                size="small"
                value={OVERFLOW_VALUE}
                onClick={() => {
                  // Closing the row would strand a selection inside it, so fall back to the
                  // first item. Without this the row is forced back open by isOverflowSelected.
                  if (showOverflow && isOverflowSelected && visibleItems[0]) {
                    onItemChange(visibleItems[0].title)
                  }
                  setIsExpanded(!showOverflow)
                }}
              >
                {showOverflow ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
              </ToggleButton>
            )}
          </ToggleButtonGroup>
          {overflowItems.length > 0 && (
            <Collapse unmountOnExit in={showOverflow} timeout="auto">
              <Box id={`${id}-overflow-row`}>
                <ToggleButtonGroup
                  exclusive
                  size="small"
                  value={item}
                  onChange={(_, v) => {
                    if (!v) return
                    onItemChange(v)
                  }}
                >
                  {overflowItems.map((i) => (
                    <ToggleButton key={i.title} size="small" value={i.title}>
                      {i.title}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Box>
            </Collapse>
          )}
        </Stack>
      </CardContent>
    </>
  )
}
