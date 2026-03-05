'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Globe } from 'lucide-react';

const languages = [
  { locale: 'en', label: 'EN' },
  { locale: 'fr', label: 'FR' },
  { locale: 'rw', label: 'RW' },
];

export function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLocale = e.target.value;
    const newPath = pathname.replace(`/${currentLocale}`, `/${newLocale}`);
    router.push(newPath);
  };

  return (
    <div className="flex items-center gap-1">
      <Globe className="h-4 w-4 text-gray-500 dark:text-gray-400" />
      <select
        value={currentLocale}
        onChange={handleChange}
        className="bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#003153] cursor-pointer"
      >
        {languages.map((lang) => (
          <option key={lang.locale} value={lang.locale}>
            {lang.label}
          </option>
        ))}
      </select>
    </div>
  );
}
