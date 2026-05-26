import { ViewHeadline, ViewList } from '@mui/icons-material'
import {
  FormControl,
  InputLabel,
  ListItemIcon,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Select,
  SelectChangeEvent,
} from '@mui/material'

const ITEM_HEIGHT = 48
const ITEM_PADDING_TOP = 8
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
}

export default function DashboardViewSelect({
	view,
	handleChange,
}: {
	view: string
  handleChange: (event: SelectChangeEvent<typeof view>) => void
}) {
  return (
    <FormControl sx={{ m: 1, minWidth: 300 }}>
      <InputLabel id="dashboard-view-label">View</InputLabel>
      <Select
        MenuProps={MenuProps}
        id="dashboard-view"
        input={<OutlinedInput id="select-view" label="View" />}
        labelId="dashboard-view-label"
        value={view}
        onChange={handleChange}
      >
					<MenuItem value='list'>
						<ListItemIcon><ViewList /></ListItemIcon>
            <ListItemText primary='List' />
					</MenuItem>
					<MenuItem value='table'>
						<ListItemIcon><ViewHeadline /></ListItemIcon>
            <ListItemText primary='Table' />
					</MenuItem>
      </Select>
    </FormControl>
  )
}