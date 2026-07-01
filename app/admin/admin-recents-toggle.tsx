'use client'
import ToggleIcon from '@/components/toggle-icon'
import { navLinksData } from '@/lib/nav-links'
import {
  CardContent,
  CardHeader,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'

type Props = {
  title: string
  item: string
  tab: string
  onItemChange: (item: string) => void
  onTabChange: (tab: string) => void
}

export default function AdminRecentsToggle({ title, item, tab, onItemChange, onTabChange }: Props) {
  const currentTab = navLinksData.admin.tabs.find((t) => t.title === tab)

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
              const firstItem = navLinksData.admin.tabs.find((t) => t.title === v)?.items?.[0]
              if (firstItem) onItemChange(firstItem.title)
            }}
          >
            {navLinksData.admin.tabs.map((t) => (
              <ToggleButton key={t.title} size="small" value={t.title}>
                <ToggleIcon isSelected={tab === t.title} item={t} size="xs" />
              </ToggleButton>
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
        <Stack direction="row" spacing={1} sx={{ flexGrow: 1, justifyContent: 'space-between' }}>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={item}
            onChange={(_, v) => {
              if (!v) return
              onItemChange(v)
            }}
          >
            {currentTab?.items?.slice(0, 3).map((i) => (
              <ToggleButton key={i.title} size="small" value={i.title}>
                {i.title}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Stack>
      </CardContent>
    </>
  )
}
