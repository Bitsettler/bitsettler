'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import * as React from 'react'

export function ThemeProvider({ children, ...props }: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider {...props} themes={['light', 'dark', 'bitcraft-dark']}>
      {children}
    </NextThemesProvider>
  )
}
