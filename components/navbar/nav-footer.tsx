import { AppBar, Stack, Toolbar, Typography } from "@mui/material";
import ThemeSwitcher from "./theme-switcher";

export default function Footer() {
	return (
		<AppBar component="footer" position="fixed" sx={{ top: 'auto', bottom: 0, zIndex: (theme) => theme.zIndex.drawer + 1 }} color="default">
			<Toolbar>
				<Stack direction="row" alignItems="center" justifyContent="space-between" flex={1} sx={{ mx: 1, mb: 1 }}>
					<Typography variant="caption" color="textDisabled">
						&copy; 2026 mailauki
					</Typography>
					<ThemeSwitcher />
				</Stack>
			</Toolbar>
		</AppBar>
	)
}