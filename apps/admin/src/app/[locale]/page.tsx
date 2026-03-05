'use client';

import { useTranslations } from 'next-intl';
import { User, Mail, Phone, Shield, CheckCircle } from 'lucide-react';

const adminUser = {
  fullName: 'Ericky vand',
  email: 'ericky@vand.rw',
  phone: '0781234567',
};

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const u = useTranslations('user');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {t('title')}
        </h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          {t('welcome')}
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden max-w-lg">
        <div className="bg-gradient-brand px-6 py-8 text-center">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-white/30">
            <User className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white">{adminUser.fullName}</h2>
          <div className="flex items-center justify-center space-x-2 mt-2">
            <Shield className="h-4 w-4 text-[#F59E0B]" />
            <span className="text-sm text-gray-200">{u('adminRole')}</span>
          </div>
        </div>

        <div className="px-6 py-6 space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#003153]/10 dark:bg-[#003153]/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <User className="h-5 w-5 text-[#003153] dark:text-[#F59E0B]" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{u('fullName')}</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{adminUser.fullName}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#003153]/10 dark:bg-[#003153]/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <Mail className="h-5 w-5 text-[#003153] dark:text-[#F59E0B]" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{u('email')}</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{adminUser.email}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#003153]/10 dark:bg-[#003153]/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <Phone className="h-5 w-5 text-[#003153] dark:text-[#F59E0B]" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{u('phone')}</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{adminUser.phone}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-50 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <CheckCircle className="h-5 w-5 text-[#3CB371]" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{u('status')}</p>
              <p className="text-sm font-semibold text-[#3CB371]">{u('active')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
