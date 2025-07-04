export const I18N_CONFIG = {
  locales: ['en', 'fr', 'es'],
  defaultLocale: 'en'
} as const

export const languages = [
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'Français' },
  { code: 'es', name: 'Español' }
] as const

// Type exports for reuse throughout the application
export type Locale = (typeof I18N_CONFIG)['locales'][number]
export type Language = (typeof languages)[number]
