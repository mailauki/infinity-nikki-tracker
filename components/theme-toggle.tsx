'use client'

import {
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  useColorScheme,
} from '@mui/material'
import { ChangeEvent } from 'react'

function ThemeToggle() {
  const { mode, setMode } = useColorScheme()
  if (!mode) {
    return null
  }

  function switchTheme(event: ChangeEvent<HTMLInputElement>) {
    setMode(event.target.value as 'system' | 'light' | 'dark')
  }

  return (
    <FormControl>
      <FormLabel id="theme-toggle" hidden>
        Theme
      </FormLabel>
      <RadioGroup
        aria-labelledby="theme-toggle"
        name="theme-toggle"
        row
        value={mode}
        onChange={switchTheme}
      >
        <FormControlLabel value="system" control={<Radio />} label="System" />
        <FormControlLabel value="light" control={<Radio />} label="Light" />
        <FormControlLabel value="dark" control={<Radio />} label="Dark" />
      </RadioGroup>
    </FormControl>
  )
}

export default ThemeToggle
