import { Container } from '@/components/container'
import { HeroSection } from './hero-section'
import { ItemsSection } from './items-section'
import { NewsSection } from './news-section'
import { ProfessionsSection } from './professions-section'

interface Item {
  id: string
  name: string
  slug: string
  category: string
  tier: number
  rarity: string
  icon_asset_name: string
}

interface HomeViewProps {
  items: Item[]
  cargo?: any[]
  resources?: any[]
}

export function HomeView({ items, cargo = [], resources = [] }: HomeViewProps) {
  return (
    <Container>
      <div className="space-y-16 py-8">
        {/* Hero Section */}
        <section>
          <HeroSection items={items} />
        </section>

        {/* Latest Bitcraft News */}
        <section>
          <NewsSection />
        </section>

        {/* Items & Equipment Section */}
        <section>
          <ItemsSection items={items} cargo={cargo} resources={resources} />
        </section>

        {/* Professions Section */}
        <section>
          <ProfessionsSection />
        </section>
      </div>
    </Container>
  )
}
