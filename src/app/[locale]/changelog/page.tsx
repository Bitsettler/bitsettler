import { Container } from '@/components/container'
import { DynamicChangelog } from '@/components/changelog/dynamic-changelog'
import { parseChangelog } from '@/lib/changelog-parser'
import { SITE_CONFIG } from '@/config/site-config'
import { I18N_CONFIG } from '@/i18n/config'
import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'

export function generateStaticParams() {
  return I18N_CONFIG.locales.map((locale) => ({ locale }))
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Changelog - ${SITE_CONFIG.name}`,
    description: `Track the latest updates and improvements to ${SITE_CONFIG.name}`
  }
}

export default async function ChangelogPage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  // Enable static rendering
  setRequestLocale(locale)

  // Parse changelog from CHANGELOG.md
  const versions = parseChangelog()

  return (
    <div className="bg-background min-h-screen">
      <Container className="py-8">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-foreground mb-4 text-4xl font-bold">
              Changelog
            </h1>
            <p className="text-muted-foreground text-lg">
              Track the latest updates and improvements to {SITE_CONFIG.name}
            </p>
          </div>

          {/* Dynamic Changelog Content */}
          <DynamicChangelog versions={versions} />
        </div>
      </Container>
    </div>
  )
}