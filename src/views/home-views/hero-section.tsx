import { Button } from '@/components/ui/button'
import { BitsettlerLogoLarge } from '@/components/icons/bitsettler-logo-large'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/badge'
import { ArrowRight } from 'lucide-react'

export function HeroSection() {
  const t = useTranslations()

  return (
    <div className="space-y-8 text-center py-12">
      {/* Featured Logo */}
      <div className="flex justify-center">
        <BitsettlerLogoLarge width={120} height={120} />
      </div>
      
      <div className="space-y-6">
        <div className="space-y-4">
          <h1 className="text-6xl font-bold tracking-tight">{t('header.title')}</h1>
          <Badge variant="secondary" className="text-sm px-3 py-1">
            🎮 The Ultimate BitCraft Companion
          </Badge>
          <p className="text-muted-foreground text-xl max-w-3xl mx-auto leading-relaxed">
            Complete settlement management platform with crafting calculator, real-time dashboard, 
            member tracking, and comprehensive game data - all in one place.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-3 pt-6">
          <Button asChild size="lg" className="text-base">
            <Link href="/en/settlement" className="flex items-center gap-2">
              Start Managing Your Settlement
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="text-base">
            <Link href="/calculator">Try the Calculator</Link>
          </Button>
          <Button asChild variant="ghost" size="lg" className="text-base">
            <Link href="/compendium">Browse Game Data</Link>
          </Button>
        </div>


      </div>
    </div>
  )
}
