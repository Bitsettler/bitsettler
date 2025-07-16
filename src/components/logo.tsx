import { SITE_CONFIG } from '@/config/site-config'
import { Link } from '@/i18n/navigation'
import { TreeViewIcon } from './icons/tree-view-icon'

export const Logo = () => {
  return (
    <Link href="/" className="text-xl font-bold">
      <div className="flex items-center gap-2">
        <TreeViewIcon />
        <span>{SITE_CONFIG.name}</span>
      </div>
    </Link>
  )
}
