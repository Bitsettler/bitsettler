import { HeroSection } from './hero-section'

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
}

export function HomeView({ items }: HomeViewProps) {
  return (
    <div className="flex min-h-[calc(100vh-141px)] flex-col items-center justify-center p-8">
      <HeroSection items={items} />
    </div>
  )
}
