'use client'

import { Container } from '@/components/container'
import { Button } from '@/components/ui/button'
import { GithubLogo, PencilRuler } from '@phosphor-icons/react'
import { useTranslations } from 'next-intl'
// import { MainNav } from "@/components/main-nav";
// import { MobileNav } from "@/components/mobile-nav";
import { ModeToggle } from '@/components/mode-toggle'
// import { Search } from "@/components/search";
// import { Separator } from "@/components/ui/separator";
import { Link } from '@/src/i18n/navigation'

export function Header() {
  const t = useTranslations()

  return (
    <header className="bg-background border-border sticky top-0 z-50 w-full border-b">
      <Container className="flex h-14 items-center gap-2">
        {/* <MobileNav className="flex lg:hidden" /> */}
        <Button asChild variant="ghost" size="icon" className="hidden size-8 lg:flex">
          <Link href="/">
            <PencilRuler className="size-5" />
            <span className="sr-only">{t('header.title')}</span>
          </Link>
        </Button>
        {/* <MainNav className="hidden lg:flex" /> */}
        <div className="flex items-center">
          <Button asChild variant="ghost" size="sm">
            <Link href="/changelog">Changelog</Link>
          </Button>
        </div>
        <div className="ml-auto flex items-center gap-2 md:flex-1 md:justify-end">
          {/* <div className="hidden w-full flex-1 md:flex md:w-auto md:flex-none">
            <Search />
          </div>
          <Separator orientation="vertical" className="h-6 block" /> */}
          <Button asChild variant="ghost" size="icon" className="size-8" title="GitHub Repository">
            <a
              href="https://github.com/duy-the-developer/bitcraft.guide-web-next"
              target="_blank"
              rel="noopener noreferrer"
            >
              <GithubLogo className="size-5" />
            </a>
          </Button>
          <ModeToggle />
        </div>
      </Container>
    </header>
  )
}
