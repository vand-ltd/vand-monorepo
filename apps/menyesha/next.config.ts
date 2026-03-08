import { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import { composePlugins, withNx } from '@nx/next';

const nextConfig: NextConfig = {
  images: {
    domains: [process.env.NEXT_PUBLIC_IMAGE_DOMAIN || ''].filter(Boolean),
  },
};

const withNextIntl = createNextIntlPlugin();

const plugins = [withNx, withNextIntl];

export default composePlugins(...plugins)(nextConfig);
