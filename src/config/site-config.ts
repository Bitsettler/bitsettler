export const SITE_CONFIG = {
  name: 'Bitcraft.Guide',
  description: 'A comprehensive crafting guide and recipe visualizer for BitCraft',
  url: 'https://bitcraft.guide',
  ogImage: 'https://bitcraft.guide/og.jpg',
  links: {
    twitter: 'https://twitter.com/bitcraftguide',
    github: 'https://github.com/duy-the-developer/bitcraft.guide-web-next',
    discord: 'https://discord.gg/DYzfsbVyNw'
  },
  creator: 'Duy Nguyen'
} as const

export type SiteConfig = typeof SITE_CONFIG
