'use client';

import { AdminGuard } from '@/components/AdminGuard';
import { AdsManager } from '@/components/ads/AdsManager';

export default function AdsPage() {
  return (
    <AdminGuard>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Ads</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage advertisers, campaigns and creatives. Ads are targeted by placement, section,
            page type and language.
          </p>
        </div>
        <AdsManager />
      </div>
    </AdminGuard>
  );
}
