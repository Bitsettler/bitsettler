import { SITE_CONFIG } from '@/config/site-config'
import { Link } from '@/i18n/navigation'

export const Logo = () => {
  return (
    <Link href="/" className="text-xl font-bold">
      {SITE_CONFIG.name}
    </Link>
  )
}
