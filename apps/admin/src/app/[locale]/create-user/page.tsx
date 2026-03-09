'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createUser, getRoles } from '@org/api';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AdminGuard } from '@/components/AdminGuard';
import { Link } from '@/i18n/navigation';
import { ArrowLeft, UserPlus, Loader2 } from 'lucide-react';

export default function CreateUserPage() {
  const t = useTranslations('createUser');
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [roleId, setRoleId] = useState('');

  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: getRoles,
  });

  const mutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      toast.success(t('userCreated'));
      router.push('/');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || t('userFailed');
      toast.error(message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ fullName, email, phone, roleId });
  };

  const isValid = fullName.trim() && email.trim() && phone.trim() && roleId;

  return (
    <AdminGuard>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{t('backToDashboard')}</span>
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-[#003153] to-[#005F73] rounded-lg flex items-center justify-center">
                <UserPlus className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  {t('pageTitle')}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('pageSubtitle')}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                {t('fullNameLabel')}
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t('fullNamePlaceholder')}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-[#003153] dark:focus:ring-[#F59E0B] focus:border-transparent outline-none transition-colors"
                required
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                {t('emailLabel')}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('emailPlaceholder')}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-[#003153] dark:focus:ring-[#F59E0B] focus:border-transparent outline-none transition-colors"
                required
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                {t('phoneLabel')}
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t('phonePlaceholder')}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-[#003153] dark:focus:ring-[#F59E0B] focus:border-transparent outline-none transition-colors"
                required
              />
            </div>

            <div>
              <label
                htmlFor="roleId"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                {t('roleLabel')}
              </label>
              {rolesLoading ? (
                <div className="flex items-center space-x-2 text-gray-400 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">{t('loadingRoles')}</span>
                </div>
              ) : (
                <select
                  id="roleId"
                  value={roleId}
                  onChange={(e) => setRoleId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#003153] dark:focus:ring-[#F59E0B] focus:border-transparent outline-none transition-colors"
                  required
                >
                  <option value="">{t('selectRole')}</option>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {roles.map((role: any) => (
                    <option key={role.id} value={role.id}>
                      {role.displayName || role.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={!isValid || mutation.isPending}
                className="w-full flex items-center justify-center space-x-2 px-6 py-3 rounded-lg bg-gradient-to-r from-[#003153] to-[#005F73] text-white font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{t('creating')}</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    <span>{t('createButton')}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminGuard>
  );
}
