import createNextIntlPlugin from 'next-intl/plugin';
import { composePlugins, withNx } from '@nx/next';

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.r2.dev',
      },
    ],
  },
};

const withNextIntl = createNextIntlPlugin();
const plugins = [withNx, withNextIntl];

export default composePlugins(...plugins)(nextConfig);
