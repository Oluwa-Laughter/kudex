import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Isolate the compiled browser-to-Anvil test server from normal application output.
  distDir: process.env.KUDEX_LOCAL_VAULT_TEST === '1' ? '.next-vault-test' : '.next',
  serverExternalPackages: ['@polkadot/api'],
  typescript: {
    ignoreBuildErrors: false,
  },
  experimental: {
    agentUpgrade: 'security',
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
        destination: '/app/rfq',
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
