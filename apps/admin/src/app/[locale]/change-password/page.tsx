'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { Lock, Eye, EyeOff, ShieldCheck, Loader2 } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { changePassword, getActiveTerms } from '@org/api';
import { AuthGuard } from '@/components/AuthGuard';
import { finalizeSession } from '@/lib/session';
import { toast } from 'sonner';

export default function ChangePasswordPage() {
  const t = useTranslations('changePassword');
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [clientError, setClientError] = useState('');

  const { data: terms, isLoading: isLoadingTerms } = useQuery({
    queryKey: ['active-terms'],
    queryFn: getActiveTerms,
  });

  const mutation = useMutation({
    mutationFn: changePassword,
    onSuccess: async () => {
      toast.success(t('success'));
      const token = localStorage.getItem('token') ?? '';
      await finalizeSession(token);
      router.push('/');
    },
    onError: () => {
      toast.error(t('failed'));
    },
  });

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setClientError('');

    if (newPassword !== confirmPassword) {
      setClientError(t('passwordMismatch'));
      return;
    }
    if (!acceptTerms) {
      setClientError(t('acceptTermsRequired'));
      return;
    }

    mutation.mutate({ currentPassword, newPassword, acceptTerms });
  };

  return (
    <AuthGuard>
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-[#003153]/10 dark:bg-[#003153]/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="h-7 w-7 text-[#003153] dark:text-[#F59E0B]" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {t('title')}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('subtitle')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Current (temporary) password */}
            <div className="space-y-2">
              <label htmlFor="currentPassword" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('currentPasswordLabel')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  id="currentPassword"
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder={t('currentPasswordPlaceholder')}
                  required
                  className="w-full h-12 pl-10 pr-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003153] focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* New password */}
            <div className="space-y-2">
              <label htmlFor="newPassword" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('newPasswordLabel')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  id="newPassword"
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t('newPasswordPlaceholder')}
                  required
                  className="w-full h-12 pl-10 pr-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003153] focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm new password */}
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('confirmPasswordLabel')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('confirmPasswordPlaceholder')}
                  required
                  className="w-full h-12 pl-10 pr-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003153] focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Terms & Conditions */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('acceptTermsLabel')}
              </label>

              {isLoadingTerms ? (
                <div className="flex items-center justify-center h-32 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                </div>
              ) : terms?.content ? (
                <div className="h-40 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 px-4 py-3">
                  <div
                    className="prose prose-xs dark:prose-invert max-w-none text-xs"
                    dangerouslySetInnerHTML={{ __html: terms.content }}
                  />
                </div>
              ) : null}

              <div className="flex items-start space-x-3">
                <input
                  id="acceptTerms"
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 dark:border-gray-600 accent-[#003153]"
                />
                <label htmlFor="acceptTerms" className="text-sm text-gray-600 dark:text-gray-400 leading-snug">
                  {t('acceptTermsLabel')}
                  {terms?.version && (
                    <span className="ml-1 font-mono text-xs text-gray-400">(v{terms.version})</span>
                  )}
                </label>
              </div>
            </div>

            {clientError && (
              <p className="text-sm text-red-600 dark:text-red-400">{clientError}</p>
            )}

            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full h-12 bg-gradient-brand text-white font-semibold rounded-lg hover:opacity-90 transition-all transform hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#003153] focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
            >
              {mutation.isPending ? t('submitting') : t('submit')}
            </button>
          </form>

        </div>
      </div>
    </AuthGuard>
  );
}
