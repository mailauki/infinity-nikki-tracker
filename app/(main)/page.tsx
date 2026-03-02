import { Hero } from '@/components/hero'
import { Container } from '@mui/material'

export default function Home() {
  return (
    <Container disableGutters sx={{ overflow: 'hidden', flex: 1, height: '100%' }}>
      <Hero />
    </Container>
  )
}
