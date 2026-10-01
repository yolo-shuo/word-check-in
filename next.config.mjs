/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'standalone', // Disabled for dev — causes missing vendor chunks
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
}

export default nextConfig
