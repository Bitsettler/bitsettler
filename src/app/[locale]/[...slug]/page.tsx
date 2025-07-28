'use client'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Link } from '@/i18n/navigation'
import { HouseIcon, MagnifyingGlassIcon } from '@phosphor-icons/react'
import { useTranslations } from 'next-intl'

export default function NotFound() {
  const t = useTranslations()

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-200px)] items-center justify-center px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-4">
          <div className="bg-muted mx-auto flex h-20 w-20 items-center justify-center rounded-full">
            <span className="text-muted-foreground text-4xl font-bold">
              404
            </span>
          </div>
          <CardTitle className="text-2xl">{t('notFound.title')}</CardTitle>
          <CardDescription className="text-lg">
            {t('notFound.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/">
                <HouseIcon className="mr-2 h-4 w-4" />
                {t('notFound.goHome')}
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/compendium">
                <MagnifyingGlassIcon className="mr-2 h-4 w-4" />
                {t('notFound.browseCompendium')}
              </Link>
            </Button>
          </div>
          <div className="text-muted-foreground pt-4 text-sm">
            <p>{t('notFound.helpText')}</p>
            <div className="mt-2 flex justify-center space-x-4">
              <Link href="/changelog" className="hover:underline">
                {t('sidebar.changelog')}
              </Link>
              <Link href="/calculator" className="hover:underline">
                {t('sidebar.calculator')}
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
