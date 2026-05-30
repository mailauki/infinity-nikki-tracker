import { AppBar, Toolbar } from "@mui/material";

export default function SubAppBar({ children }: { children: React.ReactNode }) {
	return (
		<AppBar
		variant='outlined'
		position='fixed'
		sx={{
			top: 0,
			left: 0,
            backdropFilter: 'blur(8px)',
            bgcolor: 'surface.containerLowest',
						border: 'transparent',
						borderRadius: 0,
						}}
						>
			<Toolbar />
			<Toolbar>{children}</Toolbar>
		</AppBar>
	)
}