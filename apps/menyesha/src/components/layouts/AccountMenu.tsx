'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Header account control. Session lives in localStorage (read by the axios
// client), so there's no context — we read the token on mount and whenever the
// route changes (covers the post-login redirect) or another tab logs in/out.
export function AccountMenu() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname();
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const read = () => setLoggedIn(!!localStorage.getItem('token'));
    read();
    window.addEventListener('storage', read);
    return () => window.removeEventListener('storage', read);
  }, [pathname]);

  if (!loggedIn) {
    return (
      <Link href={`/${locale}/login`} aria-label={t('login')}>
        <Button variant="ghost" size="icon">
          <User className="h-5 w-5" />
        </Button>
      </Link>
    );
  }

  // Logout is client-side: drop the stored session and send the reader home.
  // (No server revoke endpoint yet — mirrors the admin app.)
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('avatarUrl');
    localStorage.removeItem('authorSlug');
    setLoggedIn(false);
    window.location.href = `/${locale}`;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t('account')}>
          <User className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={logout}
          className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
        >
          <LogOut className="mr-2 h-4 w-4" />
          {t('logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
