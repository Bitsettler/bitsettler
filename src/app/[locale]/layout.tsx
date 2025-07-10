import { AppSidebar } from '@/components/app-sidebar'
import { Footer } from '@/components/footer'
import { Header } from '@/components/header'
import { ThemeProvider } from '@/components/theme-provider'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Toaster } from '@/components/ui/sonner'
import { SITE_CONFIG } from '@/config/site-config'
import { I18N_CONFIG, type Locale } from '@/i18n/config'
import { geistSans } from '@/styles/typography'
import {
  BookOpen,
  Calculator,
  DiscordLogo,
  Envelope,
  GithubLogo,
  Hammer,
  Heart,
  House,
  Info,
  Shuffle,
  TwitterLogo
} from '@phosphor-icons/react/dist/ssr'
import { Analytics } from '@vercel/analytics/react'
import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import '../globals.css'

export function generateStaticParams() {
  return I18N_CONFIG.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params

  // Validate that the incoming `locale` parameter is valid
  if (!I18N_CONFIG.locales.includes(locale as Locale)) {
    notFound()
  }

  // Enable static rendering
  setRequestLocale(locale)

  const t = await getTranslations()

  return {
    title: t('header.title'),
    description: t('header.subtitle')
  }
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  // Validate that the incoming `locale` parameter is valid
  if (!I18N_CONFIG.locales.includes(locale as Locale)) {
    notFound()
  }

  // Enable static rendering
  setRequestLocale(locale)

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages()

  // Sidebar navigation content migrated from previous Sidebar component
  const sidebarNavigation = [
    {
      translationLabel: 'sidebar.navigation',
      children: [
        { translationKey: 'sidebar.mainPage', href: '/', icon: House },
        { translationKey: 'sidebar.aboutUs', href: '/about', icon: Info },
        { translationKey: 'sidebar.randomPage', href: '/random', icon: Shuffle },
        { translationKey: 'sidebar.contactUs', href: '/contact', icon: Envelope },
        { translationKey: 'sidebar.donate', href: '/donate', icon: Heart }
      ]
    },
    {
      translationLabel: 'sidebar.recentChanges',
      children: [{ translationKey: 'sidebar.changelog', href: '/changelog', icon: BookOpen }],
      description: 'sidebar.recentChangesDescription'
    },
    {
      translationLabel: 'sidebar.guides',
      children: [],
      description: 'sidebar.guidesComingSoon'
    },
    {
      translationLabel: 'sidebar.tools',
      children: [
        { translationKey: 'sidebar.calculator', href: '/calculator', icon: Calculator },
        { translationKey: 'sidebar.projects', href: '/projects', icon: Hammer, comingSoon: true }
      ]
    },
    {
      translationLabel: 'sidebar.community',
      children: [
        {
          translationKey: 'sidebar.bitcraftGuideDiscord',
          href: SITE_CONFIG.links.discord,
          icon: DiscordLogo,
          external: true
        },
        {
          translationKey: 'sidebar.bitcraftGuideGithub',
          href: SITE_CONFIG.links.github,
          icon: GithubLogo,
          external: true
        },
        {
          translationKey: 'sidebar.bitcraftGuideTwitter',
          href: SITE_CONFIG.links.twitter,
          icon: TwitterLogo,
          external: true
        }
      ]
    }
  ]

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${geistSans.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <NextIntlClientProvider messages={messages}>
            <SidebarProvider>
              <AppSidebar />
              <SidebarInset>
                <Header />
                <main>{children}</main>
                <Footer />
              </SidebarInset>
            </SidebarProvider>
            <Analytics />
            <Toaster />
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
