import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'

export function HeroSection() {
  const t = useTranslations()

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h1 className="text-6xl font-bold">{t('header.title')}</h1>
        <p className="text-muted-foreground text-xl">{t('header.subtitle')}</p>
        <Button asChild>
          <Link href="/calculator">Try the Calculator!</Link>
        </Button>
      </div>
    </div>
  )
}
