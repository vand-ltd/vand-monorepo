'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

export const ToggleMode = () => {
  const { resolvedTheme, setTheme } = useTheme();
  const t = useTranslations('toggleTheme');

  const toggle = () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  const label = resolvedTheme === 'dark' ? t('light') : t('dark');

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      title={label}
      className="relative group"
    >
      <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
      <span className="sr-only">{label}</span>
      <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 dark:bg-gray-100 px-2 py-1 text-[10px] text-white dark:text-gray-900 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        {label}
      </span>
    </Button>
  );
};
