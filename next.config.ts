import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: false,
  },
  async redirects() {
    return [
      {
        source: '/app',
        destination: '/app/overview',
        permanent: true,
      },
      {
        source: '/dashboard',
        destination: '/app/overview',
        permanent: true,
      },
      {
        source: '/dashboard/vaults',
        destination: '/app/vaults',
        permanent: true,
      },
      {
        source: '/dashboard/rfq',
        destination: '/app/marketplace',
        permanent: true,
      },
      {
        source: '/dashboard/governance',
        destination: '/app/protection',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
