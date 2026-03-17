'use client';

import { useTranslations, useLocale } from 'next-intl';
import { usePathname } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import {
  LayoutDashboard,
  LogIn,
  LogOut,
  FileText,
  List,
  UserPlus,
  Users,
  PanelLeftClose,
  PanelLeftOpen,
  Zap,
  FolderPlus,
  ScrollText,
} from 'lucide-react';
import { useState, useEffect } from 'react';

export function AdminSidebar() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('token'));
    setUserRole(localStorage.getItem('userRole') || '');
  }, [pathname]);

  // Hide sidebar on login page
  const isLoginPage = pathname.endsWith('/login');
  if (isLoginPage) return null;

  const navLinks = [
    { href: '/' as const, label: t('dashboard'), icon: LayoutDashboard, auth: true },
    { href: '/login' as const, label: t('login'), icon: LogIn, auth: false, hideWhenAuth: true },
    { href: '/articles' as const, label: t('articles'), icon: List, auth: true, adminOnly: true },
    { href: '/create-article' as const, label: t('createArticle'), icon: FileText, auth: true },
    { href: '/breaking-news' as const, label: t('breakingNews'), icon: Zap, auth: true },
    { href: '/categories' as const, label: t('categories'), icon: FolderPlus, auth: true, adminOnly: true },
    { href: '/users' as const, label: t('users'), icon: Users, auth: true, adminOnly: true },
    { href: '/create-user' as const, label: t('createUser'), icon: UserPlus, auth: true, adminOnly: true },
    { href: '/terms' as const, label: t('terms'), icon: ScrollText, auth: true, adminOnly: true },
  ].filter((link) => {
    if (link.auth && !isLoggedIn) return false;
    if (link.hideWhenAuth && isLoggedIn) return false;
    if (link.adminOnly && userRole.toLowerCase() !== 'admin') return false;
    return true;
  });

  const normalizePath = (path: string) =>
    path.endsWith('/') && path !== '/' ? path.slice(0, -1) : path;

  return (
    <aside
      className={`hidden md:flex flex-col h-screen sticky top-0 z-40 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-all duration-300 ${
        collapsed ? 'w-[68px]' : 'w-60'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
        <Link href="/" className="flex items-center space-x-2 overflow-hidden">
          <div className="w-8 h-8 bg-gradient-brand rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-sm">V</span>
          </div>
          {!collapsed && (
            <span className="text-lg font-bold text-gray-900 dark:text-white whitespace-nowrap">
              {t('admin')}
            </span>
          )}
        </Link>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navLinks.map((link) => {
          const normalized = normalizePath(pathname);
          const target = `/${locale}${link.href === '/' ? '' : link.href}`;
          const isActive =
            normalized === target || (link.href === '/' && normalized === `/${locale}`);

          return (
            <Link
              key={link.href}
              href={link.href}
              title={collapsed ? link.label : undefined}
              className={`flex items-center rounded-lg text-sm font-medium transition-colors ${
                collapsed ? 'justify-center px-2 py-2.5' : 'space-x-3 px-3 py-2.5'
              } ${
                isActive
                  ? 'bg-[#003153] text-white dark:bg-[#F59E0B] dark:text-gray-900'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <link.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{link.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="px-3 py-4 border-t border-gray-200 dark:border-gray-700 space-y-1 shrink-0">
        {/* Logout */}
        {isLoggedIn && (
          <button
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('userRole');
              setIsLoggedIn(false);
              window.location.href = `/${locale}/login`;
            }}
            title={collapsed ? t('logout') : undefined}
            className={`w-full flex items-center rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ${
              collapsed ? 'justify-center px-2 py-2.5' : 'space-x-3 px-3 py-2.5'
            }`}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{t('logout')}</span>}
          </button>
        )}

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`w-full flex items-center rounded-lg text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
            collapsed ? 'justify-center px-2 py-2.5' : 'space-x-3 px-3 py-2.5'
          }`}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-5 w-5 shrink-0" />
          ) : (
            <>
              <PanelLeftClose className="h-5 w-5 shrink-0" />
              <span>{t('collapse') || 'Collapse'}</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
