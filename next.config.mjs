/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required by Dockerfile: produces the self-contained .next/standalone output
  // (server.js + production-only node_modules) that the runner stage copies.
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['argon2'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'dicebear.com',
      },
    ],
  },
  sentry: {
    hideSourceMaps: false,
  },
}

export default nextConfig
