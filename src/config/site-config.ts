export const SITE_CONFIG = {
  name: 'Bitsettler',
  description:
    'A comprehensive crafting guide and settlement management system for BitCraft',
  url: 'https://bitsettler.io',
  ogImage: 'https://bitsettler.io/og.jpg',
  links: {
    twitter: 'https://x.com/bitsettler_io',
    github: 'https://github.com/coryniblett/bitsettler',
    discord: 'https://discord.gg/DYzfsbVyNw'
  },
  creator: 'Cory Niblett'
} as const

export type SiteConfig = typeof SITE_CONFIG
