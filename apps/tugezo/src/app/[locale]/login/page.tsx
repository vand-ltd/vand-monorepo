'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { ArrowLeft, Loader2, MailCheck } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { login, signup, resendVerification } from '@org/api';
import { finalizeSession } from '@/lib/session';
import { Link, useRouter } from '@/i18n/navigation';
import { LOGO_DARK_PATH, LOGO_LIGHT_PATH, BRAND_NAME } from '@/lib/brand';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function errMessage(error: any, fallback: string) {
  const m = error?.response?.data?.message || fallback;
  return Array.isArray(m) ? m.join(', ') : m;
}

export default function LoginPage() {
  const locale = useLocale();
  const t = useTranslations('login');
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [tab, setTab] = useState<'login' | 'register'>('login');

  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // After signup we show a "check your email" panel; keep the address so the
  // resend button knows where to send.
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  // Login blocked with 403 (unverified) → offer a resend for that email.
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

  const loginMutation = useMutation({
    mutationFn: () => login(loginEmail, loginPassword),
    onSuccess: async (data) => {
      const payload = data.data ?? data;
      await finalizeSession(payload.accessToken);
      router.push('/');
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      // 403 = account exists but email not yet verified.
      if (error?.response?.status === 403) setUnverifiedEmail(loginEmail);
    },
  });

  const signupMutation = useMutation({
    mutationFn: () =>
      signup({ fullName, email, password, phone: phone || undefined, language: locale }),
    onSuccess: () => {
      setRegisteredEmail(email);
      setFullName('');
      setEmail('');
      setPhone('');
      setPassword('');
    },
  });

  const resendMutation = useMutation({
    mutationFn: (targetEmail: string) => resendVerification(targetEmail),
  });

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUnverifiedEmail(null);
    loginMutation.mutate();
  };

  const handleRegister = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    signupMutation.mutate();
  };

  const switchTab = (next: 'login' | 'register') => {
    setTab(next);
    setRegisteredEmail(null);
    setUnverifiedEmail(null);
    loginMutation.reset();
    signupMutation.reset();
    resendMutation.reset();
  };

  const inputClass =
    'w-full h-10 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary';

  // Shared resend button (used by the 403 notice and the check-email panel).
  const resendButton = (targetEmail: string) => (
    <button
      type="button"
      onClick={() => resendMutation.mutate(targetEmail)}
      disabled={resendMutation.isPending}
      className="text-sm font-medium text-brand-primary dark:text-brand-accent hover:underline disabled:opacity-50"
    >
      {resendMutation.isPending
        ? t('resending')
        : resendMutation.isSuccess
          ? t('resent')
          : t('resend')}
    </button>
  );

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <Image
            src={mounted && resolvedTheme === 'dark' ? LOGO_DARK_PATH : LOGO_LIGHT_PATH}
            alt={BRAND_NAME}
            width={140}
            height={40}
            className="h-10 w-auto object-contain mx-auto mb-6"
          />
        </div>

        {/* Tabs */}
        <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <button
            onClick={() => switchTab('login')}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              tab === 'login'
                ? 'bg-brand-primary text-white'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {t('loginTab')}
          </button>
          <button
            onClick={() => switchTab('register')}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              tab === 'register'
                ? 'bg-brand-primary text-white'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {t('registerTab')}
          </button>
        </div>

        {/* Login Form */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('email')}</label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder={t('emailPlaceholder')}
                required
                className={inputClass}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('password')}</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder={t('passwordPlaceholder')}
                required
                className={inputClass}
              />
            </div>

            {/* Errors */}
            {loginMutation.isError &&
              (unverifiedEmail ? (
                <div className="rounded-lg border border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-900/20 p-3 text-sm text-amber-800 dark:text-amber-200 space-y-2">
                  <p>{t('verifyNeeded')}</p>
                  {resendButton(unverifiedEmail)}
                </div>
              ) : (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {errMessage(loginMutation.error, t('loginFailed'))}
                </p>
              ))}

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full h-10 bg-brand-primary hover:bg-brand-secondary text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('loggingIn')}
                </>
              ) : (
                t('loginTab')
              )}
            </button>
          </form>
        )}

        {/* Register Form */}
        {tab === 'register' &&
          (registeredEmail ? (
            <div className="text-center space-y-4 py-6">
              <MailCheck className="h-12 w-12 text-brand-primary dark:text-brand-accent mx-auto" />
              <div className="space-y-1">
                <p className="text-base font-semibold text-gray-900 dark:text-white">
                  {t('checkEmailTitle')}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('checkEmailBody', { email: registeredEmail })}
                </p>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {t('noEmail')} {resendButton(registeredEmail)}
              </div>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('fullName')}</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={t('fullNamePlaceholder')}
                  required
                  className={inputClass}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('email')}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('emailPlaceholder')}
                  required
                  className={inputClass}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('password')}</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('passwordMin')}
                  required
                  minLength={8}
                  className={inputClass}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('phone')}</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t('phonePlaceholder')}
                  className={inputClass}
                />
              </div>

              {signupMutation.isError && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {errMessage(signupMutation.error, t('registerFailed'))}
                </p>
              )}

              <button
                type="submit"
                disabled={signupMutation.isPending}
                className="w-full h-10 bg-brand-primary hover:bg-brand-secondary text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {signupMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('submitting')}
                  </>
                ) : (
                  t('submit')
                )}
              </button>
            </form>
          ))}

        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-brand-accent transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('backToHome')}
          </Link>
        </div>
      </div>
    </div>
  );
}
