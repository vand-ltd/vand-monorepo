'use client';

import { useTranslations, useLocale } from 'next-intl';
import { usePathname } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { ToggleMode } from './ToggleMode';
import { LanguageSwitcher } from './LanguageSwitcher';
import { LayoutDashboard, LogIn, LogOut, FileText, List, Menu, X, UserPlus, Users } from 'lucide-react';
import { useState, useEffect } from 'react';

export function AdminHeader() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('token'));
    setUserRole(localStorage.getItem('userRole') || '');
  }, [pathname]);

  const navLinks = [
    { href: '/' as const, label: t('dashboard'), icon: LayoutDashboard, auth: true },
    { href: '/login' as const, label: t('login'), icon: LogIn, auth: false, hideWhenAuth: true },
    { href: '/articles' as const, label: t('articles'), icon: List, auth: true, adminOnly: true },
    { href: '/create-article' as const, label: t('createArticle'), icon: FileText, auth: true },
    { href: '/users' as const, label: t('users'), icon: Users, auth: true, adminOnly: true },
    { href: '/create-user' as const, label: t('createUser'), icon: UserPlus, auth: true, adminOnly: true },
  ].filter((link) => {
    if (link.auth && !isLoggedIn) return false;
    if (link.hideWhenAuth && isLoggedIn) return false;
    if (link.adminOnly && userRole.toLowerCase() !== 'admin') return false;
    return true;
  });

  const normalizePath = (path: string) =>
    path.endsWith('/') && path !== '/' ? path.slice(0, -1) : path;

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-brand rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">V</span>
            </div>
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              {t('admin')}
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => {
              const normalized = normalizePath(pathname);
              const target = `/${locale}${link.href === '/' ? '' : link.href}`;
              const isActive = normalized === target || (link.href === '/' && normalized === `/${locale}`);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#003153]/10 text-[#003153] dark:text-[#F59E0B]'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <link.icon className="h-4 w-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center space-x-3">
            <LanguageSwitcher />
            <ToggleMode />
            {isLoggedIn && (
              <button
                onClick={() => {
                  localStorage.removeItem('token');
                  localStorage.removeItem('userRole');
                  setIsLoggedIn(false);
                  window.location.href = `/${locale}/login`;
                }}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                title={t('logout')}
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">{t('logout')}</span>
              </button>
            )}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? (
                <X className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              ) : (
                <Menu className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              )}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <nav className="max-w-7xl mx-auto px-4 py-3 space-y-1">
            {navLinks.map((link) => {
              const normalized = normalizePath(pathname);
              const target = `/${locale}${link.href === '/' ? '' : link.href}`;
              const isActive = normalized === target || (link.href === '/' && normalized === `/${locale}`);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center space-x-2 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#003153]/10 text-[#003153] dark:text-[#F59E0B]'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <link.icon className="h-4 w-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
