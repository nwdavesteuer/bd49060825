/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  productionBrowserSourceMaps: false,
  trailingSlash: false,
  async redirects() {
    return [
      { source: '/', destination: '/mobile-messages', permanent: false },
      { source: '/audio-comparison', destination: '/mobile-messages', permanent: false },
      { source: '/diagnostic', destination: '/mobile-messages', permanent: false },
      { source: '/emotions-explorer', destination: '/mobile-messages', permanent: false },
      { source: '/love-letters', destination: '/mobile-messages', permanent: false },
      { source: '/love-notes-2016', destination: '/mobile-messages', permanent: false },
      { source: '/love-notes-selector', destination: '/mobile-messages', permanent: false },
      { source: '/navigation', destination: '/mobile-messages', permanent: false },
      { source: '/photo-timeline', destination: '/mobile-messages', permanent: false },
      { source: '/test-audio', destination: '/mobile-messages', permanent: false },
      { source: '/visual-heatmap', destination: '/mobile-messages', permanent: false },
      { source: '/word-evolution', destination: '/mobile-messages', permanent: false },
      { source: '/simple/:path*', destination: '/mobile-messages', permanent: false },
      { source: '/test/:path*', destination: '/mobile-messages', permanent: false },
      // Disable Google-related pages/apis
      { source: '/api/google-photos', destination: '/api/disabled', permanent: false },
      { source: '/api/icloud', destination: '/api/disabled', permanent: false },
      { source: '/api/iphone-photos', destination: '/api/disabled', permanent: false },
      { source: '/api/local-photos', destination: '/api/disabled', permanent: false },
      { source: '/google', destination: '/mobile-messages', permanent: false },
      { source: '/icloud', destination: '/mobile-messages', permanent: false },
    ]
  },
}

export default nextConfig