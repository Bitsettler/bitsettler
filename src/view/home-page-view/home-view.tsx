import { Container } from '@/components/container'
import { HeroSection } from './hero-section'

interface Item {
  id: number
  name: string
  slug: string
  category: string
}

interface HomeViewProps {
  items: Item[]
}

export function HomeView({ items }: HomeViewProps) {
  return (
    <Container className="flex min-h-[calc(100vh-4rem)] flex-col items-center py-40">
      <HeroSection items={items} />
    </Container>
  )
}
