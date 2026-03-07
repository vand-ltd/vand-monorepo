'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Mail, Lock, Eye, EyeOff, Shield, LayoutDashboard, FileText } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { login } from '@org/api';

export default function LoginPage() {
  const t = useTranslations('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => login(email, password),
    onSuccess: (data) => {
      console.log('Login successful:', data);
    },
    onError: (error) => {
      console.error('Login failed:', error);
    },
  })
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  };

  const features = [
    { icon: Shield, title: 'Secure Access', desc: 'Enterprise-grade security' },
    { icon: LayoutDashboard, title: 'Full Control', desc: 'Manage all platform settings' },
    { icon: FileText, title: 'Content Management', desc: 'Create and publish articles' },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Left Side - Branding */}
        <div className="hidden lg:flex flex-col justify-center space-y-8 p-8">
          <div className="space-y-6">
            <div className="w-16 h-16 bg-gradient-brand rounded-2xl flex items-center justify-center">
              <span className="text-white font-bold text-2xl">V</span>
            </div>
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white leading-tight">
              {t('welcomeHeading')}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
              {t('welcomeDescription')}
            </p>

            <div className="space-y-4 mt-8">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="bg-[#003153]/10 dark:bg-[#003153]/30 p-3 rounded-lg">
                    <feature.icon className="h-6 w-6 text-[#003153] dark:text-[#F59E0B]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{feature.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex items-center justify-center">
          <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
            <div className="text-center mb-8">
              <div className="lg:hidden w-12 h-12 bg-gradient-brand rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-lg">V</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {t('title')}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {t('subtitle')}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('emailLabel')}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('emailPlaceholder')}
                    required
                    className="w-full h-12 pl-10 pr-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003153] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('passwordLabel')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('passwordPlaceholder')}
                    required
                    className="w-full h-12 pl-10 pr-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003153] focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input
                    id="remember"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 accent-[#003153]"
                  />
                  <label htmlFor="remember" className="text-sm text-gray-600 dark:text-gray-400">
                    {t('rememberMe')}
                  </label>
                </div>
                <button type="button" className="text-sm text-[#003153] hover:text-[#005F73] dark:text-[#F59E0B]">
                  {t('forgotPassword')}
                </button>
              </div>

              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full h-12 bg-gradient-brand text-white font-semibold rounded-lg hover:opacity-90 transition-all transform hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#003153] focus:ring-offset-2"
              >
                {loginMutation.isPending ? 'Signing in ...' : t('signIn')}
              </button>
              {loginMutation.isError && (
                <p className="text-sm text-red-600 mt-2">
                  {/* {t('loginError')} */}
                  Invalid email or password. Please try again.
                </p>
              )}
            </form>

            <div className="mt-6 text-center">
              <Link href="/" className="text-sm text-[#003153] hover:text-[#005F73] dark:text-[#F59E0B]">
                &larr; {t('backToDashboard')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
