import { Box, Typography } from '@mui/material'
import Image from 'next/image'

export function Hero() {
  return (
    <Box sx={{ position: 'relative', height: 'calc(100vh - 192px)', mx: -3, mt: -3 }}>
      <Image
        src="https://static.wikia.nocookie.net/infinity-nikki/images/7/78/Infinity_Nikki_Key_Art.png/revision/latest?cb=20241206171432"
        alt="Infinity Nikki Hero Image"
        sizes="100vw"
        className="object-cover object-[70%_center]"
        fill
      />
      <Box className="absolute bottom-0 right-0 z-20 flex w-full flex-col items-center py-40">
        <Typography variant="h3" component="h1">
          Infinity Nikki Tracker
        </Typography>
        <Typography variant="subtitle1" fontSize={20} className="mx-auto max-w-sm px-4 text-center">
          Track your collection from your favorite cozy open-world game Infinity Nikki
        </Typography>
      </Box>
      <Box className="absolute bottom-0 right-0 z-10 h-[50%] w-full bg-gradient-to-t from-background from-50% to-transparent to-80%" />
    </Box>
  )
}
