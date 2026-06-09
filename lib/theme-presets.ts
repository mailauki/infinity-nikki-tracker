import { alpha } from '@mui/material/styles'
import { blueGrey } from '@mui/material/colors'
import { ColorTheme } from './types/eureka'

export interface ColorThemePreset {
  label: string
  description: string
  light: {
    primary: string
    secondary: string
    tertiary: string
    background: string
    text: { primary: string; secondary: string }
    divider: string
    surface: {
      dim: string
      main: string
      bright: string
      containerLowest: string
      containerLow: string
      container: string
      containerHigh: string
      containerHighest: string
    }
  }
  dark: {
    primary: string
    secondary: string
    tertiary: string
    background: string
    text: { primary: string; secondary: string }
    divider: string
    surface: {
      dim: string
      main: string
      bright: string
      containerLowest: string
      containerLow: string
      container: string
      containerHigh: string
      containerHighest: string
    }
  }
}

export const COLOR_THEME_PRESETS: Record<ColorTheme, ColorThemePreset> = {
  default: {
    label: 'Terracotta',
    description: 'Warm earthy tones',
    light: {
      primary: '#8F4C33',
      secondary: '#77574C',
      tertiary: '#3D6736',
      background: '#FFF8F6',
      text: { primary: '#180F0C', secondary: '#41332E' },
      divider: '#D8C2BB',
      surface: {
        dim: '#E8D6D1',
        main: '#FFF8F6',
        bright: '#FFF8F6',
        containerLowest: '#FFFFFF',
        containerLow: '#FFF1EC',
        container: '#FCEAE4',
        containerHigh: '#F7E4DF',
        containerHighest: '#F1DFD9',
      },
    },
    dark: {
      primary: '#FFB59A',
      secondary: '#E7BEAF',
      tertiary: '#A2CF95',
      background: '#1a110e',
      text: { primary: '#f1dfd9', secondary: '#d8c2bb' },
      divider: '#53433e',
      surface: {
        dim: '#1A110E',
        main: '#1A110E',
        bright: '#423733',
        containerLowest: '#140C09',
        containerLow: '#231A16',
        container: '#271E1A',
        containerHigh: '#322824',
        containerHighest: '#3D322F',
      },
    },
  },
  moonlight: {
    label: 'Moonlight',
    description: 'Soft purples and lavender',
    light: {
      primary: '#6750A4',
      secondary: '#625B71',
      tertiary: '#7D5260',
      background: '#FFFBFE',
      text: { primary: '#1C1B1F', secondary: '#49454F' },
      divider: '#CAC4D0',
      surface: {
        dim: '#DED8E1',
        main: '#FFFBFE',
        bright: '#FFFBFE',
        containerLowest: '#FFFFFF',
        containerLow: '#F7F2FA',
        container: '#F3EDF7',
        containerHigh: '#ECE6F0',
        containerHighest: '#E6E0E9',
      },
    },
    dark: {
      primary: '#D0BCFF',
      secondary: '#CCC2DC',
      tertiary: '#EFB8C8',
      background: '#141218',
      text: { primary: '#E6E0E9', secondary: '#CAC4D0' },
      divider: '#49454F',
      surface: {
        dim: '#141218',
        main: '#141218',
        bright: '#3B383E',
        containerLowest: '#0F0D13',
        containerLow: '#1D1B20',
        container: '#211F26',
        containerHigh: '#2B2930',
        containerHighest: '#36343B',
      },
    },
  },
  cherry: {
    label: 'Cherry Blossom',
    description: 'Deep rose and soft pink',
    light: {
      primary: '#9C4063',
      secondary: '#775860',
      tertiary: '#7E5700',
      background: '#FFF8F8',
      text: { primary: '#21191B', secondary: '#514347' },
      divider: '#E0C1C8',
      surface: {
        dim: '#EDD4D8',
        main: '#FFF8F8',
        bright: '#FFF8F8',
        containerLowest: '#FFFFFF',
        containerLow: '#FFF0F2',
        container: '#FCE8EC',
        containerHigh: '#F7E2E6',
        containerHighest: '#F1DCE1',
      },
    },
    dark: {
      primary: '#FFB1C8',
      secondary: '#E5BDBE',
      tertiary: '#F5BC3E',
      background: '#1A1012',
      text: { primary: '#F1DCE1', secondary: '#E0C1C8' },
      divider: '#534248',
      surface: {
        dim: '#1A1012',
        main: '#1A1012',
        bright: '#433438',
        containerLowest: '#130B0D',
        containerLow: '#22191B',
        container: '#271D1F',
        containerHigh: '#32282A',
        containerHighest: '#3E3235',
      },
    },
  },
  forest: {
    label: 'Forest',
    description: 'Lush greens and earth',
    light: {
      primary: '#3A6A2F',
      secondary: '#52634F',
      tertiary: '#38656A',
      background: '#F6FBF1',
      text: { primary: '#111E0E', secondary: '#364B30' },
      divider: '#BDC9B6',
      surface: {
        dim: '#D6DBCF',
        main: '#F6FBF1',
        bright: '#F6FBF1',
        containerLowest: '#FFFFFF',
        containerLow: '#EFF5EA',
        container: '#E8F2E3',
        containerHigh: '#E3ECDE',
        containerHighest: '#DDE7D8',
      },
    },
    dark: {
      primary: '#9CD489',
      secondary: '#B0CBA6',
      tertiary: '#80D0D9',
      background: '#0E1610',
      text: { primary: '#DDE7D8', secondary: '#BDC9B6' },
      divider: '#3F4F3C',
      surface: {
        dim: '#0E1610',
        main: '#0E1610',
        bright: '#2F3B2C',
        containerLowest: '#091210',
        containerLow: '#161E13',
        container: '#1A2217',
        containerHigh: '#252D21',
        containerHighest: '#30382C',
      },
    },
  },
}

export function buildColorSchemes(preset: ColorThemePreset) {
  const { light, dark } = preset
  return {
    light: {
      palette: {
        primary: { main: light.primary },
        secondary: { main: light.secondary },
        tertiary: { main: light.tertiary },
        neutral: { main: '#877371' },
        success: { main: '#695E2F' },
        error: { main: '#BA1A1A' },
        info: { main: blueGrey[600] },
        background: { default: light.background, paper: light.background },
        text: light.text,
        divider: light.divider,
        surface: {
          dim: light.surface.dim,
          dimHover: alpha(light.surface.dim, 0.7),
          main: light.surface.main,
          mainHover: alpha(light.surface.main, 0.7),
          bright: light.surface.bright,
          brightHover: alpha(light.surface.bright, 0.7),
          containerLowest: light.surface.containerLowest,
          containerLowestHover: alpha(light.surface.containerLowest, 0.7),
          containerLow: light.surface.containerLow,
          containerLowHover: alpha(light.surface.containerLow, 0.7),
          container: light.surface.container,
          containerHover: alpha(light.surface.container, 0.7),
          containerHigh: light.surface.containerHigh,
          containerHighHover: alpha(light.surface.containerHigh, 0.7),
          containerHighest: light.surface.containerHighest,
          containerHighestHover: alpha(light.surface.containerHighest, 0.7),
        },
      },
    },
    dark: {
      palette: {
        primary: { main: dark.primary },
        secondary: { main: dark.secondary },
        tertiary: { main: dark.tertiary },
        neutral: { main: '#D5BAB6' },
        success: { main: '#D5C68E' },
        error: { main: '#FFB4AB' },
        info: { main: blueGrey[400] },
        background: { default: dark.background, paper: dark.background },
        text: dark.text,
        divider: dark.divider,
        surface: {
          dim: dark.surface.dim,
          dimHover: alpha(dark.surface.dim, 0.7),
          main: dark.surface.main,
          mainHover: alpha(dark.surface.main, 0.7),
          bright: dark.surface.bright,
          brightHover: alpha(dark.surface.bright, 0.7),
          containerLowest: dark.surface.containerLowest,
          containerLowestHover: alpha(dark.surface.containerLowest, 0.7),
          containerLow: dark.surface.containerLow,
          containerLowHover: alpha(dark.surface.containerLow, 0.7),
          container: dark.surface.container,
          containerHover: alpha(dark.surface.container, 0.7),
          containerHigh: dark.surface.containerHigh,
          containerHighHover: alpha(dark.surface.containerHigh, 0.7),
          containerHighest: dark.surface.containerHighest,
          containerHighestHover: alpha(dark.surface.containerHighest, 0.7),
        },
      },
    },
  }
}
