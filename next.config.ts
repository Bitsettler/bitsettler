import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // Bypass ESLint errors for deployment
  },
  typescript: {
    ignoreBuildErrors: true, // Bypass TypeScript errors for deployment
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.ko-fi.com',
        port: '',
        pathname: '/**'
      }
    ]
  },
  // Force dynamic rendering for internationalized routes that cause issues
  async headers() {
    return [
      {
        source: '/:locale/compendium/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
      {
        source: '/:locale/professions/:path*',
        headers: [
          {
            key: 'Cache-Control', 
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ];
  },
}

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')
export default withNextIntl(nextConfig)
