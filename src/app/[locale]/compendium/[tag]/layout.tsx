import { setRequestLocale } from 'next-intl/server'

export const dynamicParams = true
export const revalidate = false

export default async function CompendiumTagLayout({
  children,
  params
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  // Enable static rendering
  setRequestLocale(locale)

  return <>{children}</>
}
