'use client'

import Link from "next/link";
import { Mail, MapPin, Megaphone } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { CONTACT_EMAIL, BRAND_NAME } from '@/lib/brand';
import { SOCIAL_LINKS } from '@org/ui';

const Footer = () => {
  const startYear = 2026;
  const currentYear = new Date().getFullYear();
  const yearDisplay = currentYear > startYear ? `${startYear} – ${currentYear}` : `${startYear}`;
  const t = useTranslations('footer');
  const tNav = useTranslations('nav');
  const tData = useTranslations('dataHub');
  const locale = useLocale();

  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Main Footer Content */}
      <div className="max-w-screen-xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Social Media */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wide mb-4">{t('socialMedia')}</h4>
            <div className="flex space-x-2">
              <a href={SOCIAL_LINKS.facebook.url} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="bg-gray-800 hover:bg-brand-accent p-2 rounded-lg transition-colors">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd"/>
                </svg>
              </a>
              <a href={SOCIAL_LINKS.x.url} target="_blank" rel="noopener noreferrer" aria-label="X" className="bg-gray-800 hover:bg-brand-accent p-2 rounded-lg transition-colors">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a href={SOCIAL_LINKS.instagram.url} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="bg-gray-800 hover:bg-brand-accent p-2 rounded-lg transition-colors">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
              </a>
              <a href={SOCIAL_LINKS.tiktok.url} target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="bg-gray-800 hover:bg-brand-accent p-2 rounded-lg transition-colors">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                </svg>
              </a>
              <a href={SOCIAL_LINKS.threads.url} target="_blank" rel="noopener noreferrer" aria-label="Threads" className="bg-gray-800 hover:bg-brand-accent p-2 rounded-lg transition-colors">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18.263 11.097c-.03-3.486-1.92-5.586-5.111-5.586-2.13 0-3.922.963-4.863 2.499l2.062 1.438c.535-.843 1.272-1.543 2.628-1.543 1.528 0 2.318.85 2.544 2.431a15 15 0 0 0-2.236-.173c-4.125 0-6.068 1.867-6.068 4.336s1.943 3.99 4.804 3.99c3.139 0 5.013-2.115 5.781-4.735.798.361 1.348 1.204 1.348 2.47 0 3.387-3.907 5.232-7.22 5.232-4.885 0-8.077-3.207-8.077-8.424 0-6.392 4.223-10.487 9.9-10.487 3.808 0 5.69 1.671 6.97 3.914l2.108-1.475C21.44 2.078 18.331 0 13.663 0 6.227 0 1.168 5.277 1.168 12.934c0 7 4.953 11.066 10.856 11.066 4.878 0 9.809-2.846 9.809-7.716 0-2.545-1.46-4.231-3.569-5.187m-6.33 4.855c-1.077 0-2.026-.512-2.026-1.453 0-1.483 1.822-1.934 3.606-1.934.678 0 1.34.045 1.927.173-.422 1.927-1.671 3.215-3.508 3.214Z"/>
                </svg>
              </a>
              <a href={SOCIAL_LINKS.youtube.url} target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="bg-gray-800 hover:bg-brand-accent p-2 rounded-lg transition-colors">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
              <a href={SOCIAL_LINKS.whatsapp.url} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp Channel" className="bg-gray-800 hover:bg-brand-accent p-2 rounded-lg transition-colors">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wide mb-4">{t('contact')}</h4>
            <div className="space-y-3">
              <a href={`mailto:${CONTACT_EMAIL}`} className="flex items-center space-x-2.5 text-sm text-gray-400 hover:text-brand-accent transition-colors">
                <Mail className="h-4 w-4 shrink-0" />
                <span>{CONTACT_EMAIL}</span>
              </a>
              <Link href={`/${locale}/advertise`} className="flex items-center space-x-2.5 text-sm text-gray-400 hover:text-brand-accent transition-colors">
                <Megaphone className="h-4 w-4 shrink-0" />
                <span>{tNav('advertise')}</span>
              </Link>
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

          {/* Data */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wide mb-4">{tData('title')}</h4>
            <ul className="space-y-2.5">
              <li>
                <Link href={`/${locale}/data/fuel-prices`} className="text-sm text-gray-400 hover:text-brand-accent transition-colors">
                  {tData('fuelPricesTitle')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/data`} className="text-sm text-gray-400 hover:text-brand-accent transition-colors">
                  {tData('viewAll')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/football`} className="text-sm text-gray-400 hover:text-brand-accent transition-colors">
                  {tNav('scores')}
                </Link>
              </li>
            </ul>
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
              <li>
                <Link href={`/${locale}/privacy-policy`} className="text-sm text-gray-400 hover:text-brand-accent transition-colors">
                  {tNav('privacyPolicy')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/terms-of-service`} className="text-sm text-gray-400 hover:text-brand-accent transition-colors">
                  {tNav('termsOfService')}
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-screen-xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-center gap-x-3 gap-y-1.5 text-xs text-gray-500">
          <p>&copy; {yearDisplay} {BRAND_NAME}. {t('allRightsReserved')}</p>
          <span className="hidden sm:inline text-gray-700" aria-hidden>&middot;</span>
          <a
            href="https://vand.rw"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 transition-colors hover:text-brand-accent"
          >
            {t('vandProduct')}
            <span className="inline-flex h-4 w-4 items-center justify-center rounded bg-gradient-to-br from-[#003153] to-[#005F73] text-[9px] font-bold text-white">
              V
            </span>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
