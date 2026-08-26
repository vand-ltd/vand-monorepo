'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { Loader2, MailCheck, AlertCircle, ArrowLeft } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { verifyEmail, resendVerification } from '@org/api';
import { finalizeSession } from '@/lib/session';
import { Link, useRouter } from '@/i18n/navigation';
import { LOGO_DARK_PATH, LOGO_LIGHT_PATH, BRAND_NAME } from '@/lib/brand';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function errMessage(error: any, fallback: string) {
  const m = error?.response?.data?.message || fallback;
  return Array.isArray(m) ? m.join(', ') : m;
}

function VerifyEmailInner() {
  const t = useTranslations('verifyEmail');
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const started = useRef(false);
  const [resendEmail, setResendEmail] = useState('');

  const verifyMutation = useMutation({
    mutationFn: (tk: string) => verifyEmail(tk),
    onSuccess: async (data) => {
      const payload = data.data ?? data;
      // Verify logs the user in — persist the session, then head home.
      if (payload?.accessToken) await finalizeSession(payload.accessToken);
      setTimeout(() => router.push('/'), 1200);
    },
  });

  const resendMutation = useMutation({
    mutationFn: (email: string) => resendVerification(email),
  });

  // Auto-run once on mount when the link carried a token.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (token) verifyMutation.mutate(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const inputClass =
    'w-full h-10 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary';

  const verifying = !!token && (verifyMutation.isIdle || verifyMutation.isPending);
  const failed = !token || verifyMutation.isError;

  const resendForm = (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        resendMutation.mutate(resendEmail);
      }}
      className="space-y-3 text-left"
    >
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('emailLabel')}</label>
        <input
          type="email"
          value={resendEmail}
          onChange={(e) => setResendEmail(e.target.value)}
          placeholder={t('emailPlaceholder')}
          required
          className={inputClass}
        />
      </div>
      {resendMutation.isSuccess ? (
        <p className="text-sm text-green-600 dark:text-green-400">{t('resent')}</p>
      ) : (
        <button
          type="submit"
          disabled={resendMutation.isPending}
          className="w-full h-10 bg-brand-primary hover:bg-brand-secondary text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {resendMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('resending')}
            </>
          ) : (
            t('resend')
          )}
        </button>
      )}
    </form>
  );

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6 text-center">
        <Image
          src={mounted && resolvedTheme === 'dark' ? LOGO_DARK_PATH : LOGO_LIGHT_PATH}
          alt={BRAND_NAME}
          width={140}
          height={40}
          className="h-10 w-auto object-contain mx-auto"
        />

        {/* Verifying */}
        {verifying && (
          <div className="space-y-4 py-6">
            <Loader2 className="h-10 w-10 text-brand-primary dark:text-brand-accent mx-auto animate-spin" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('verifying')}</p>
          </div>
        )}

        {/* Success */}
        {verifyMutation.isSuccess && (
          <div className="space-y-4 py-6">
            <MailCheck className="h-12 w-12 text-brand-primary dark:text-brand-accent mx-auto" />
            <div className="space-y-1">
              <p className="text-base font-semibold text-gray-900 dark:text-white">{t('successTitle')}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('successBody')}</p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center justify-center h-10 px-5 bg-brand-primary hover:bg-brand-secondary text-white text-sm font-medium rounded-lg transition-colors"
            >
              {t('continue')}
            </Link>
          </div>
        )}

        {/* Failed / no token → offer a fresh link */}
        {failed && !verifyMutation.isSuccess && (
          <div className="space-y-5 py-2">
            <div className="space-y-3">
              <AlertCircle className="h-12 w-12 text-amber-500 mx-auto" />
              <div className="space-y-1">
                <p className="text-base font-semibold text-gray-900 dark:text-white">{t('failTitle')}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {token ? errMessage(verifyMutation.error, t('failBody')) : t('missingToken')}
                </p>
              </div>
            </div>
            {resendForm}
          </div>
        )}

        <div>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-brand-accent transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('backToLogin')}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-brand-primary dark:text-brand-accent animate-spin" />
        </div>
      }
    >
      <VerifyEmailInner />
    </Suspense>
  );
}
