import cargo from '@/data/cargo.json'
import items from '@/data/items.json'
import resources from '@/data/resources.json'
import { HomeView } from '@/view/home-page-view/home-view'

export default function Home() {
  return <HomeView items={items} cargo={cargo} resources={resources} />
}
