'use client'
import { brown, lime, pink } from '@mui/material/colors'
import { alpha, createTheme, PaletteColor } from '@mui/material/styles'
import { AvatarSize } from './types/props'

declare module '@mui/material/Avatar' {
  interface AvatarOwnProps {
    size?: AvatarSize
    color?: 'transparent'
  }
}
declare module '@mui/material/ToggleButton' {
  interface ToggleButtonOwnProps {
    variant?: 'filled'
  }
}
declare module '@mui/material/ToggleButtonGroup' {
  interface ToggleButtonGroupProps {
    variant?: 'filled'
  }
}

// declare module '@mui/material/Paper' {
//   interface PaperOwnProps {
//     color?: 'surface'
//   }
// }

declare module '@mui/material/styles' {
  interface PaletteColor {
    lowest: string
    lowestHover: string
    low: string
    lowHover: string
    main: string
    mainHover: string
    high: string
    highHover: string
    highest: string
    highestHover: string
  }

  interface SurfacePaletteColorOptions {
    lowest?: string
    lowestHover?: string
    low?: string
    lowHover?: string
    main?: string
    mainHover?: string
    high?: string
    highHover?: string
    highest?: string
    highestHover?: string
  }
  interface Palette {
    surface: Palette['primary']
    // surface: {
    // 	lowest?: string;
    // 	low?: string;
    // 	main: string;
    // 	high?: string;
    // 	highest?: string;
    // }
  }

  interface PaletteOptions {
    surface?: SurfacePaletteColorOptions
  }
}

const theme = createTheme({
  cssVariables: {
    colorSchemeSelector: 'class',
  },
  typography: {
    fontFamily: 'var(--font-roboto)',
    // Display Large
    h1: {
      fontSize: '3.5625rem',
      lineHeight: 1.123,
      fontWeight: 400,
      letterSpacing: '-0.015625rem',
    },
    // Display Medium
    h2: {
      fontSize: '2.8125rem',
      lineHeight: 1.156,
      fontWeight: 400,
      letterSpacing: '0',
    },
    // Display Small
    h3: {
      fontSize: '2.25rem',
      lineHeight: 1.222,
      fontWeight: 400,
      letterSpacing: '0',
    },
    // Headline Large
    h4: {
      fontSize: '2rem',
      lineHeight: 1.25,
      fontWeight: 400,
      letterSpacing: '0',
    },
    // Headline Medium
    h5: {
      fontSize: '1.75rem',
      lineHeight: 1.286,
      fontWeight: 400,
      letterSpacing: '0',
    },
    // Headline Small
    h6: {
      fontSize: '1.5rem',
      lineHeight: 1.333,
      fontWeight: 400,
      letterSpacing: '0',
    },
    // Title Large
    subtitle1: {
      fontSize: '1.375rem',
      lineHeight: 1.273,
      fontWeight: 400,
      letterSpacing: '0',
    },
    // Title Medium
    subtitle2: {
      fontSize: '1rem',
      lineHeight: 1.5,
      fontWeight: 500,
      letterSpacing: '0.009375rem',
    },
    // Body Large
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
      fontWeight: 400,
      letterSpacing: '0.03125rem',
    },
    // Body Medium
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.429,
      fontWeight: 400,
      letterSpacing: '0.015625rem',
    },
    // Body Small
    caption: {
      fontSize: '0.75rem',
      lineHeight: 1.333,
      fontWeight: 400,
      letterSpacing: '0.025rem',
    },
    // Label Large
    button: {
      fontSize: '0.875rem',
      lineHeight: 1.429,
      fontWeight: 500,
      letterSpacing: '0.00625rem',
    },
    // Label Small
    overline: {
      fontSize: '0.6875rem',
      lineHeight: 1.455,
      fontWeight: 500,
      letterSpacing: '0.03125rem',
      textTransform: 'uppercase' as const,
    },
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
        surface: {
          lowest: brown['50'],
          lowestHover: alpha(brown['50'], 0.7),
          low: brown['100'],
          lowHover: alpha(brown['100'], 0.7),
          main: brown['200'],
          mainHover: alpha(brown['200'], 0.7),
          high: brown['300'],
          highHover: alpha(brown['300'], 0.7),
          highest: brown['400'],
          highestHover: alpha(brown['400'], 0.7),
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
        surface: {
          lowest: brown['900'],
          lowestHover: alpha(brown['700'], 0.7),
          low: brown['800'],
          lowHover: alpha(brown['600'], 0.7),
          main: brown['700'],
          mainHover: alpha(brown['500'], 0.7),
          high: brown['600'],
          highHover: alpha(brown['400'], 0.7),
          highest: brown['500'],
          highestHover: alpha(brown['300'], 0.7),
        },
      },
    },
  },
  components: {
    // MuiPaper: {
    // 	styleOverrides: {
    // 		root: {
    // 			variants: [
    // 				{ props: { color: 'surface', elevation: 1 },
    //           style: { backgroundColor: brown['50'] },
    // 				},
    // 				{ props: { color: 'surface', elevation: 2 },
    //           style: { backgroundColor: brown['100'] },
    // 				},
    // 			]
    // 		}
    // 	}
    // },
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
            {
              props: { color: 'transparent' },
              style: { backgroundColor: 'transparent', color: 'inherit' },
            },
          ],
        },
      },
    },
    MuiToggleButtonGroup: {
      defaultProps: {
        variant: 'filled',
        color: 'secondary',
      },
      styleOverrides: {
        root: {
          gap: '0.25rem',
        },
        firstButton: {
          borderColor: 'transparent',
          borderRadius: '6px',
          borderTopLeftRadius: '40px',
          borderBottomLeftRadius: '40px',
          '&.Mui-disabled': {
            borderColor: 'transparent',
          },
        },
        middleButton: {
          borderColor: 'transparent',
          borderRadius: '6px',
          '&.Mui-disabled': {
            borderColor: 'transparent',
          },
        },
        lastButton: {
          borderColor: 'transparent',
          borderRadius: '6px',
          borderTopRightRadius: '40px',
          borderBottomRightRadius: '40px',
          '&.Mui-disabled': {
            borderColor: 'transparent',
          },
        },
      },
    },
    MuiToggleButton: {
      defaultProps: {
        variant: 'filled',
        color: 'secondary',
      },
      styleOverrides: {
        root: {
          variants: [
            {
              props: { variant: 'filled', color: 'primary' },
              style: ({ theme }) => ({
                backgroundColor: alpha(theme.palette.primary.main, 0.08),
                borderRadius: '6px',
                '&:hover': {
                  borderRadius: '12px',
                  backgroundColor: alpha(theme.palette.primary.main, 0.16),
                },
                '&.Mui-selected': {
                  borderRadius: '40px',
                  backgroundColor: theme.palette.primary.main,
                  color: theme.palette.primary.contrastText,
                },
                '&.Mui-selected:hover': {
                  borderRadius: '12px',
                  backgroundColor: alpha(theme.palette.primary.main, 0.84),
                  color: theme.palette.primary.contrastText,
                },
                '&.Mui-disabled': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.12),
                },
              }),
            },
            {
              props: { variant: 'filled', color: 'secondary' },
              style: ({ theme }) => ({
                backgroundColor: alpha(theme.palette.secondary.main, 0.12),
                borderRadius: '6px',
                borderColor: 'transparent',
                '&:hover': {
                  borderRadius: '12px',
                  backgroundColor: alpha(theme.palette.secondary.main, 0.24),
                },
                '&.Mui-selected': {
                  borderRadius: '40px',
                  backgroundColor: theme.palette.secondary.main,
                  color: theme.palette.secondary.contrastText,
                },
                '&.Mui-selected:hover': {
                  borderRadius: '12px',
                  backgroundColor: alpha(theme.palette.secondary.main, 0.84),
                  color: theme.palette.primary.contrastText,
                },
                '&.Mui-disabled': {
                  backgroundColor: alpha(theme.palette.secondary.main, 0.12),
                },
              }),
            },
          ],
        },
      },
    },
  },
})

export default theme
