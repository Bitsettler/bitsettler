import { SITE_CONFIG } from '@/config/site-config'
import { Link } from '@/i18n/navigation'
import { BitsettlerLogoIcon } from './icons/bitsettler-logo-icon'

export const Logo = () => {
  return (
    <Link href="/" className="text-xl font-bold">
      <div className="flex items-center gap-2">
        <BitsettlerLogoIcon width={28} height={28} />
        <span>{SITE_CONFIG.name}</span>
      </div>
    </Link>
  )
}
