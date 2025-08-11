import { AppSidebar } from '@/components/app-sidebar'
import { Footer } from '@/components/footer'
import { Header } from '@/components/header'
import { ThemeProvider } from '@/components/theme-provider'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from '@/components/auth-provider'
import { ErrorBoundary } from '@/components/error-boundary'
import { I18N_CONFIG, type Locale } from '@/i18n/config'
import { getSearchGameData } from '@/lib/spacetime-db-new/modules/search/flows'
import { geistSans } from '@/styles/typography'
// Initialize app services (treasury polling, etc.)
import '@/lib/spacetime-db-new/modules/app-initialization'
import { Analytics } from '@vercel/analytics/react'
import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import {
  getMessages,
  getTranslations,
  setRequestLocale
} from 'next-intl/server'
import { notFound } from 'next/navigation'
import '../globals.css'

export function generateStaticParams() {
  return I18N_CONFIG.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params

  // Validate that the incoming `locale` parameter is valid
  if (!I18N_CONFIG.locales.includes(locale as Locale)) {
    notFound()
  }

  // Enable static rendering
  setRequestLocale(locale)

  const t = await getTranslations()

  return {
    title: {
      default: t('header.title'),
      template: '%s | BitSettler'
    },
    description: t('header.subtitle'),
    keywords: ['BitCraft', 'settlement management', 'crafting calculator', 'BitCraft guide', 'BitCraft tools', 'settlement dashboard', 'BitCraft compendium'],
    authors: [{ name: 'BitSettler Team' }],
    creator: 'BitSettler',
    publisher: 'BitSettler',
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL('https://bitsettler.io'),
    openGraph: {
      type: 'website',
      locale: locale,
      url: 'https://bitsettler.io',
      title: t('header.title'),
      description: t('header.subtitle'),
      siteName: 'BitSettler'
    },
    twitter: {
      card: 'summary_large_image',
      title: t('header.title'),
      description: t('header.subtitle'),
      creator: '@bitsettler'
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    icons: {
      icon: [
        { url: '/bitsettler-logo-16.svg', sizes: '16x16', type: 'image/svg+xml' },
        { url: '/bitsettler-logo-32.svg', sizes: '32x32', type: 'image/svg+xml' },
        { url: '/icon', sizes: '32x32', type: 'image/png' }
      ],
      apple: [
        { url: '/apple-icon', sizes: '180x180', type: 'image/png' }
      ],
      shortcut: '/bitsettler-logo-16.svg'
    },
    manifest: '/manifest.json'
  }
}

export type LocaleLayoutProps = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export default async function LocaleLayout({
  children,
  params
}: LocaleLayoutProps) {
  const { locale } = await params
  // Enable static rendering
  setRequestLocale(locale)

  // Validate that the incoming `locale` parameter is valid
  if (!I18N_CONFIG.locales.includes(locale as Locale)) {
    notFound()
  }

  const messages = await getMessages()

  const searchData = await getSearchGameData()

  return (
    <AuthProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <NextIntlClientProvider messages={messages}>
          <SidebarProvider>
            <AppSidebar searchData={searchData} />
            <SidebarInset className="flex min-h-screen flex-col">
              <Header />
              <main className="flex-1">
                <ErrorBoundary>
                  {children}
                </ErrorBoundary>
              </main>
              <Footer />
            </SidebarInset>
          </SidebarProvider>
          <Analytics />
          <Toaster />
        </NextIntlClientProvider>
      </ThemeProvider>
    </AuthProvider>
  )
}
