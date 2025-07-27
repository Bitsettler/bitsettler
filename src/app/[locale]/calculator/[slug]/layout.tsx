import { setRequestLocale } from 'next-intl/server'
import { LocaleLayoutProps } from '../../layout'

export const dynamicParams = true
export const revalidate = false

export default async function CalculatorLayout({
  children,
  params
}: LocaleLayoutProps) {
  const { locale } = await params
  setRequestLocale(locale)

  return <>{children}</>
}
