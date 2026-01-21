import type { NextConfig } from "next";
import path from "path";

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
    ],
  },
};

export default nextConfig;
