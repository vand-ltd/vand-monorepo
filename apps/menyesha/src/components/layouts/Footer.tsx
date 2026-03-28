'use client'

import Link from "next/link";
import Image from "next/image";
import { Youtube, Mail, MapPin } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";

const Footer = () => {
  const startYear = 2026;
  const currentYear = new Date().getFullYear();
  const yearDisplay = currentYear > startYear ? `${startYear} – ${currentYear}` : `${startYear}`;
  const t = useTranslations('footer');
  const tNav = useTranslations('nav');
  const locale = useLocale();

  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Main Footer Content */}
      <div className="max-w-screen-xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="mb-4">
              <Image
                src="/menyesha-logo-dark.svg"
                alt="Menyesha"
                width={120}
                height={40}
                className="h-8 w-auto object-contain"
              />
            </div>
            {/* <p className="text-sm text-gray-400 mb-5 leading-relaxed">
              {t('description')}
            </p> */}
            <div className="flex space-x-2">
              <a href="https://www.facebook.com/profile.php?id=61575594504264" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="bg-gray-800 hover:bg-brand-accent p-2 rounded-lg transition-colors">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd"/>
                </svg>
              </a>
              <a href="https://x.com/menyesha" target="_blank" rel="noopener noreferrer" aria-label="X" className="bg-gray-800 hover:bg-brand-accent p-2 rounded-lg transition-colors">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a href="https://youtube.com/@menyesha" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="bg-gray-800 hover:bg-brand-accent p-2 rounded-lg transition-colors">
                <Youtube className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wide mb-4">{t('contact')}</h4>
            <div className="space-y-3">
              <a href="mailto:menyesha@vand.rw" className="flex items-center space-x-2.5 text-sm text-gray-400 hover:text-brand-accent transition-colors">
                <Mail className="h-4 w-4 shrink-0" />
                <span>menyesha@vand.rw</span>
              </a>
              {/* <div className="flex items-center space-x-2.5 text-sm text-gray-400">
                <Phone className="h-4 w-4 shrink-0" />
                <span>+250 788 123 456</span>
              </div> */}
              <div className="flex items-center space-x-2.5 text-sm text-gray-400">
                <MapPin className="h-4 w-4 shrink-0" />
                <span>Kigali, Rwanda</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wide mb-4">{t('legal')}</h4>
            <ul className="space-y-2.5">
              <li>
                <Link href={`/${locale}/about`} className="text-sm text-gray-400 hover:text-brand-accent transition-colors">
                  {tNav('about')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/contact`} className="text-sm text-gray-400 hover:text-brand-accent transition-colors">
                  {tNav('contact')}
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-screen-xl mx-auto px-4 py-4">
          <p className="text-center text-xs text-gray-500">
            &copy; {yearDisplay} Menyesha. {t('allRightsReserved')}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
