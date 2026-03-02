import { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import { composePlugins, withNx } from '@nx/next';

const nextConfig: NextConfig = {};

const withNextIntl = createNextIntlPlugin();

const plugins = [withNx, withNextIntl];

export default composePlugins(...plugins)(nextConfig);
