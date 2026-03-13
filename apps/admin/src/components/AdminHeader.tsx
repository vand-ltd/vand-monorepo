'use client';

import { useTranslations, useLocale } from 'next-intl';
import { usePathname } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { ToggleMode } from './ToggleMode';
import { LanguageSwitcher } from './LanguageSwitcher';
import {
  LayoutDashboard,
  LogIn,
  LogOut,
  FileText,
  List,
  Menu,
  X,
  UserPlus,
  Users,
  Zap,
} from 'lucide-react';
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

  const isLoginPage = pathname.endsWith('/login');

  const navLinks = [
    { href: '/' as const, label: t('dashboard'), icon: LayoutDashboard, auth: true },
    { href: '/login' as const, label: t('login'), icon: LogIn, auth: false, hideWhenAuth: true },
    { href: '/articles' as const, label: t('articles'), icon: List, auth: true, adminOnly: true },
    { href: '/create-article' as const, label: t('createArticle'), icon: FileText, auth: true },
    { href: '/breaking-news' as const, label: t('breakingNews'), icon: Zap, auth: true },
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
      <div className="px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo - only on mobile or login page */}
          <div className={`flex items-center ${isLoginPage ? '' : 'md:invisible'}`}>
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-brand rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">V</span>
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {t('admin')}
              </span>
            </Link>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            <LanguageSwitcher />
            <ToggleMode />
            {isLoggedIn && !isLoginPage && (
              <button
                onClick={() => {
                  localStorage.removeItem('token');
                  localStorage.removeItem('userRole');
                  setIsLoggedIn(false);
                  window.location.href = `/${locale}/login`;
                }}
                className="hidden md:flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                title={t('logout')}
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
            {!isLoginPage && (
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
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && !isLoginPage && (
        <>
          {/* Overlay */}
          <div
            className="md:hidden fixed inset-0 bg-black/40 z-40"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <div className="md:hidden fixed top-14 left-0 bottom-0 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-50 overflow-y-auto">
            <nav className="px-3 py-4 space-y-1">
              {navLinks.map((link) => {
                const normalized = normalizePath(pathname);
                const target = `/${locale}${link.href === '/' ? '' : link.href}`;
                const isActive =
                  normalized === target || (link.href === '/' && normalized === `/${locale}`);

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-[#003153] text-white dark:bg-[#F59E0B] dark:text-gray-900'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <link.icon className="h-5 w-5" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>

            {isLoggedIn && (
              <div className="px-3 py-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('userRole');
                    setIsLoggedIn(false);
                    window.location.href = `/${locale}/login`;
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  <span>{t('logout')}</span>
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </header>
  );
}
