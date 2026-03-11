import { ViewList, ViewHeadline } from "@mui/icons-material";
import { Box, Container, Stack, Tab, Tabs, ToggleButton, ToggleButtonGroup, Toolbar, Tooltip } from "@mui/material";

export default function DashboardToolbar({
	tab,
	handleTabChange,
	view,
	handleViewChange,
}: {
	tab: string
	handleTabChange: (_: React.MouseEvent<HTMLElement>, value: string) => void
	view: string
	handleViewChange: (_: React.MouseEvent<HTMLElement>, nextView: 'list' | 'table') => void
}) {
	return (
		<>
		{/* <Paper variant="outlined" sx={{ mb: 1, overflow: 'hidden' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Tabs value={tab} onChange={handleTabChange}>
            <Tab label="Eureka Sets" />
            <Tab label="Eureka Variants" />
            <Tab label="Trials" />
          </Tabs>
          <Stack direction="row" justifyContent="flex-end" sx={{ flex: 1, mx: 1 }}>
            <ToggleButtonGroup size="small" value={view} onChange={handleViewChange} exclusive>
              <ToggleButton value="list" aria-label="list">
                <ViewList />
              </ToggleButton>
              <ToggleButton value="table" aria-label="table">
                <ViewHeadline />
              </ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        </Stack>
      </Paper> */}
			<Box
				sx={{
					py: 2,
					position: 'sticky',
					top: 0,
					zIndex: 1,
					backdropFilter: 'blur(8px)',
					mask: 'linear-gradient(to bottom, black 60%, transparent 100%)',
				}}
			>
				<Container maxWidth="md">
					<Toolbar disableGutters>
						{/* <Tabs value={tab} onChange={handleTabChange}>
							<Tab label="Eureka Sets" />
							<Tab label="Eureka Variants" />
							<Tab label="Trials" />
						</Tabs> */}
						<Stack direction='row' justifyContent='space-between' sx={{ flex: 1 }}>
						<ToggleButtonGroup
							value={tab}
							onChange={handleTabChange}
							exclusive
						>
							<ToggleButton value="eureka-sets" aria-label="Eureka Sets">Eureka Sets</ToggleButton>
							<ToggleButton value="eureka-variants" aria-label="Eureka Variants">Eureka Variants</ToggleButton>
							<ToggleButton value="trials" aria-label="Trials">Trials</ToggleButton>
						</ToggleButtonGroup>

						<ToggleButtonGroup
							// size="small"
							value={view}
							onChange={handleViewChange}
							exclusive
						>
							<Tooltip title='List view'>
								<ToggleButton value="list" aria-label="list">
									<ViewList />
								</ToggleButton>
							</Tooltip>
							<Tooltip title='Table view'>
								<ToggleButton value="table" aria-label="table">
									<ViewHeadline />
								</ToggleButton>
							</Tooltip>
						</ToggleButtonGroup>
						</Stack>
					</Toolbar>
				</Container>
			</Box>
		</>
	)
}