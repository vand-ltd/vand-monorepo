'use client';

import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { getMe } from '@org/api';
import Image from 'next/image';
import {
  User,
  Mail,
  Phone,
  Shield,
  FileText,
  Send,
  CheckCircle,
  XCircle,
  Archive,
  Clock,
  Loader2,
} from 'lucide-react';
import { AuthGuard } from '@/components/AuthGuard';

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const u = useTranslations('user');

  const { data: me, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
  });

  const stats = me?.articleStats;

  return (
    <AuthGuard>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('title')}
          </h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            {t('welcome')}
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#003153] dark:text-[#F59E0B]" />
          </div>
        ) : me ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="bg-gradient-brand px-6 py-8 text-center">
                <div className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center mx-auto mb-4 border-2 border-white/30">
                  {me.internalProfile?.avatar ? (
                    <Image
                      src={me.internalProfile.avatar}
                      alt={me.fullName}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-white/20 flex items-center justify-center">
                      <User className="h-10 w-10 text-white" />
                    </div>
                  )}
                </div>
                <h2 className="text-xl font-bold text-white">{me.fullName}</h2>
                {me.internalProfile?.role?.displayName && (
                  <div className="flex items-center justify-center space-x-2 mt-2">
                    <Shield className="h-4 w-4 text-[#F59E0B]" />
                    <span className="text-sm text-gray-200">
                      {me.internalProfile.role.displayName}
                    </span>
                  </div>
                )}
              </div>

              <div className="px-6 py-6 space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[#003153]/10 dark:bg-[#003153]/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <User className="h-5 w-5 text-[#003153] dark:text-[#F59E0B]" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      {u('fullName')}
                    </p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {me.fullName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[#003153]/10 dark:bg-[#003153]/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail className="h-5 w-5 text-[#003153] dark:text-[#F59E0B]" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      {u('email')}
                    </p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {me.email}
                    </p>
                  </div>
                </div>

                {me.phone && (
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-[#003153]/10 dark:bg-[#003153]/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Phone className="h-5 w-5 text-[#003153] dark:text-[#F59E0B]" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        {u('phone')}
                      </p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {me.phone}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-50 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-5 w-5 text-[#3CB371]" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      {u('status')}
                    </p>
                    <p className="text-sm font-semibold text-[#3CB371]">
                      {u('active')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Article Stats */}
            {stats && (
              <div className="lg:col-span-2">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  {t('articleStats')}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <StatCard
                    icon={FileText}
                    label={t('totalArticles')}
                    value={stats.total}
                    color="bg-[#003153]/10 dark:bg-[#003153]/30"
                    iconColor="text-[#003153] dark:text-[#F59E0B]"
                  />
                  <StatCard
                    icon={Clock}
                    label={t('draftArticles')}
                    value={stats.draft}
                    color="bg-yellow-50 dark:bg-yellow-900/20"
                    iconColor="text-yellow-600 dark:text-yellow-400"
                  />
                  <StatCard
                    icon={CheckCircle}
                    label={t('publishedArticles')}
                    value={stats.published}
                    color="bg-green-50 dark:bg-green-900/20"
                    iconColor="text-green-600 dark:text-green-400"
                  />
                  <StatCard
                    icon={Send}
                    label={t('inReviewArticles')}
                    value={stats.inReview}
                    color="bg-blue-50 dark:bg-blue-900/20"
                    iconColor="text-blue-600 dark:text-blue-400"
                  />
                  <StatCard
                    icon={XCircle}
                    label={t('rejectedArticles')}
                    value={stats.rejected}
                    color="bg-red-50 dark:bg-red-900/20"
                    iconColor="text-red-600 dark:text-red-400"
                  />
                  <StatCard
                    icon={Archive}
                    label={t('archivedArticles')}
                    value={stats.archived}
                    color="bg-gray-50 dark:bg-gray-700/50"
                    iconColor="text-gray-600 dark:text-gray-400"
                  />
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </AuthGuard>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  iconColor,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: string;
  iconColor: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center space-x-3">
        <div
          className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center flex-shrink-0`}
        >
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        </div>
      </div>
    </div>
  );
}
