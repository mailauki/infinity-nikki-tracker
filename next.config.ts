import path from 'path'

import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  cacheComponents: true,
  turbopack: {
    root: path.join(__dirname, '..'), // Sets the root to the parent directory
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'static.wikia.nocookie.net',
        port: '',
        pathname: '/infinity-nikki/**',
      },
      {
        protocol: 'https',
        hostname: 'ykfuevyqpjvtxidjnhxm.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/images/**',
      },
    ],
  },
}

export default nextConfig
