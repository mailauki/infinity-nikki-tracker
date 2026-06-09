import fs from 'fs'
import path from 'path'

import type { NextConfig } from 'next'

// Walk up from __dirname to find the directory containing node_modules/next,
// then use its parent as the Turbopack root. This works from both the main
// repo and git worktrees, which don't have their own node_modules.
let workspaceRoot = __dirname
while (!fs.existsSync(path.join(workspaceRoot, 'node_modules', 'next'))) {
  const parent = path.dirname(workspaceRoot)
  if (parent === workspaceRoot) break
  workspaceRoot = parent
}

const nextConfig: NextConfig = {
  cacheComponents: true,
  turbopack: {
    root: workspaceRoot,
  },
  headers: async () => [
    {
      // Prevent Safari from caching Turbopack dev chunks, which causes
      // ChunkLoadError reload loops when chunks are invalidated during development
      source: '/_next/static/chunks/:path*',
      headers: [{ key: 'Cache-Control', value: 'no-store' }],
    },
  ],
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
