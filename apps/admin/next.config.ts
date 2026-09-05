import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

// Workspace libraries ship as TypeScript source, so Next must transpile them.
// (@nx/next's withNx wires this up too; we set it explicitly so the build also
// works on hosts where withNx isn't installed — see the fallback below.)
const baseConfig: NextConfig = {
  transpilePackages: ['@org/api', '@org/i18n', '@org/ui'],
  images: {
    // Vercel's Image Optimization quota is exhausted on the free tier, and an
    // over-quota transform returns HTTP 402 — the image silently fails to render
    // wherever next/image is used, while plain <img> (cards, OG) still works.
    // Serving originals removes that failure mode entirely and takes image
    // transforms off the platform bill. Sources are already modestly sized and
    // sit behind Cloudflare, so the bandwidth cost is small.
    unoptimized: true,
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

// @nx/next is a dev-only build plugin. On a scoped install (e.g. Vercel building
// just this app) it may be absent — fall back to a plain Next build so the app
// still compiles. Local `nx build` keeps the full Nx integration.
function resolveConfig(): NextConfig | ((phase: string) => NextConfig | Promise<NextConfig>) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { composePlugins, withNx } = require('@nx/next');
    return composePlugins(withNx, withNextIntl)(baseConfig);
  } catch {
    return withNextIntl(baseConfig);
  }
}

export default resolveConfig();
