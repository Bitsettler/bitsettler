import { AppSidebar } from './app-sidebar'
import type { SearchData } from '@/lib/spacetime-db'

interface AppSidebarWithDataProps {
  searchData: SearchData
}

export function AppSidebarWithData({ searchData }: AppSidebarWithDataProps) {
  return <AppSidebar searchData={searchData} />
}