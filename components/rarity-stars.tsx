'use client'
import { createSvgIcon, Stack } from '@mui/material'

const SparkleIcon = createSvgIcon(
  <svg
    fill="currentColor"
    height="24"
    viewBox="0 0 24 24"
    width="24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M11.296 1.924c.24-.656 1.168-.656 1.408 0l.717 1.958a11.25 11.25 0 0 0 6.697 6.697l1.958.717c.657.24.657 1.168 0 1.408l-1.958.717a11.25 11.25 0 0 0-6.697 6.697l-.717 1.958c-.24.657-1.168.657-1.408 0l-.717-1.958a11.25 11.25 0 0 0-6.697-6.697l-1.958-.717c-.656-.24-.656-1.168 0-1.408l1.958-.717a11.25 11.25 0 0 0 6.697-6.697z" />
  </svg>,
  'Sparkle'
)

export default function RarityStars({ rarity }: { rarity: number }) {
  return (
    <Stack direction="row" spacing={0.25}>
      {Array.from({ length: rarity }, (_, index) => (
        <SparkleIcon key={index} color="inherit" fontSize="inherit" sx={{ rotate: '15deg' }} />
      ))}
    </Stack>
  )
}
