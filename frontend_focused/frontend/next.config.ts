import path from 'node:path';
import type { NextConfig } from 'next';

const apiInternalUrl = process.env.API_INTERNAL_URL ?? 'http://localhost:8000';

const nextConfig: NextConfig = {
  // Pin the workspace root so a stray lockfile in a parent directory is never picked up.
  turbopack: { root: path.resolve(__dirname) },
  skipTrailingSlashRedirect: true,
  // Keeps the development badge out of demos and screen recordings; errors still show.
  devIndicators: false,
  async rewrites() {
    return [
      {
        source: '/api/:path*/',
        destination: `${apiInternalUrl}/api/:path*/`,
      },
    ];
  },
};

export default nextConfig;
