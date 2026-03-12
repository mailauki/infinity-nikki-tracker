'use client'
import { lime, pink } from '@mui/material/colors'
import { alpha, createTheme, responsiveFontSizes } from '@mui/material/styles'
import { AvatarSize } from './types/props'

declare module '@mui/material/Avatar' {
  interface AvatarOwnProps {
    size?: AvatarSize
  }
}

let theme = createTheme({
  cssVariables: {
    colorSchemeSelector: 'class',
  },
  typography: {
    fontFamily: 'var(--font-roboto)',
  },
  colorSchemes: {
    light: {
      palette: {
        primary: {
          main: lime['900'],
        },
        secondary: {
          main: pink['400'],
        },
      },
    },
    dark: {
      palette: {
        primary: {
          main: lime['500'],
        },
        secondary: {
          main: pink['100'],
        },
      },
    },
  },
  components: {
    MuiCard: {
      defaultProps: {
        elevation: 3,
      },
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
        },
      },
    },
    MuiAvatar: {
      defaultProps: {
        size: 'sm',
      },
      styleOverrides: {
        root: {
          variants: [
            {
              props: { size: 'xs' },
              style: { width: 24, height: 24, fontSize: '0.75rem' },
            },
            {
              props: { size: 'sm' },
              style: { width: 40, height: 40 },
            },
            {
              props: { size: 'md' },
              style: { width: 56, height: 56, fontSize: '1.5rem' },
            },
            {
              props: { size: 'lg' },
              style: { width: 94, height: 94, fontSize: '2rem' },
            },
            {
              props: { size: 'xl' },
              style: { width: 140, height: 140, fontSize: '3rem' },
            },
          ],
        },
      },
    },
		MuiToggleButtonGroup: {
			styleOverrides: {
				root: {
					gap: '0.25rem',
				},
				firstButton: ({ theme }) => ({
					backgroundColor: alpha(theme.palette.secondary.main, 0.15),

					border: '1px solid',
					borderColor: 'transparent',
					borderRadius: '6px',
					borderTopLeftRadius: '40px',
					borderBottomLeftRadius: '40px',
					'&:hover': {
						borderRadius: '12px',
						backgroundColor: alpha(theme.palette.secondary.main, 0.35),
					},
					'&.Mui-selected': {
						borderRadius: '40px',
						backgroundColor: theme.palette.secondary.main,
					},
					'&.Mui-selected:hover': {
						borderRadius: '12px',
						backgroundColor: alpha(theme.palette.secondary.main, 0.35),
					},
				}),
				middleButton: ({ theme }) => ({
					backgroundColor: alpha(theme.palette.secondary.main, 0.15),

					border: '1px solid',
					borderColor: 'transparent',
					borderRadius: '6px',
					'&:hover': {
						borderRadius: '12px',
						backgroundColor: alpha(theme.palette.secondary.main, 0.35),
					},
					'&.Mui-selected': {
						borderRadius: '40px',
						backgroundColor: theme.palette.secondary.main,
					},
					'&.Mui-selected:hover': {
						borderRadius: '12px',
						backgroundColor: alpha(theme.palette.secondary.main, 0.35),
					},
				}),
				lastButton: ({ theme }) => ({
					backgroundColor: alpha(theme.palette.secondary.main, 0.15),

					border: '1px solid',
					borderColor: 'transparent',
					borderRadius: '6px',
					borderTopRightRadius: '40px',
					borderBottomRightRadius: '40px',
					'&:hover': {
						borderRadius: '12px',
						backgroundColor: alpha(theme.palette.secondary.main, 0.35),
					},
					'&.Mui-selected': {
						borderRadius: '40px',
						backgroundColor: theme.palette.secondary.main,
					},
					'&.Mui-selected:hover': {
						borderRadius: '12px',
						backgroundColor: alpha(theme.palette.secondary.main, 0.35),
					},
				})
			}
		}
  },
})

theme = responsiveFontSizes(theme)

export default theme
