import { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import { composePlugins, withNx } from '@nx/next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https' as const,
        hostname: '*.r2.dev',
      },
      {
        protocol: 'https' as const,
        hostname: 'storage.vand.rw',
      },
    ],
  },
};

const withNextIntl = createNextIntlPlugin();

const plugins = [withNx, withNextIntl];

export default composePlugins(...plugins)(nextConfig);
