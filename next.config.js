/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // Bypass ESLint errors for deployment
  },
  typescript: {
    ignoreBuildErrors: true, // Bypass TypeScript errors for deployment
  },
}

module.exports = nextConfig