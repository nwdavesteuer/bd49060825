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
    ]
  },
}

export default nextConfig