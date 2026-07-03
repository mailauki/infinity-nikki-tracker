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
  images: {
    // Vercel's image optimizer (/_next/image) returns 402
    // OPTIMIZED_IMAGE_REQUEST_PAYMENT_REQUIRED in production once the plan's
    // image-optimization quota is exhausted, so every optimized variant thumbnail
    // 404s in the browser while the source files serve fine (200) from Supabase.
    // Bypass the optimizer: next/image emits a plain <img> with the original src.
    // The `optimized` prop on the eureka cards becomes a harmless no-op.
    unoptimized: true,
    formats: ['image/avif', 'image/webp'],
    // Grid thumbnails render at Avatar sizes (xs 24 … xl 140, see lib/theme.ts);
    // these candidates cover those at 1x/2x DPR so srcset picks a small file.
    imageSizes: [24, 40, 48, 56, 80, 94, 112, 140, 188, 280],
    remotePatterns: [
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
