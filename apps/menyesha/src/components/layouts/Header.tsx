'use client'

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { ToggleMode } from "./ToggleMode"
import { SearchInput } from "./SearchInput"
import LanguageSwitcher from "./LanguageSwitcher"
import { Button } from "@/components/ui/button"
import { Menu, Bell, User, TrendingUp } from "lucide-react"
import { useTranslations, useLocale } from "next-intl"
import { usePathname } from "next/navigation"
import { useClientDateTime } from "@/hooks/useClientDateTime"


export const Header = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { currentDate, currentTime, mounted } = useClientDateTime()
  
  const t = useTranslations('nav')
  const locale = useLocale();
  const pathname = usePathname();


  const navLinks = [
    { href: '/', label: t('home') },
    { href: '/politics', label: 'Politics' },
    { href: '/business', label: 'Business' },
    { href: '/technology', label: 'Technology' },
    { href: '/sports', label: 'Sports' },
    { href: '/world', label: 'World' },
    { href: '/about', label: t('about') },
  ]

  const normalizePath = (path: string) =>
    path.endsWith('/') && path !== '/' ? path.slice(0, -1) : path;


  return (
    <>
      {/* Breaking News Ticker */}
      <div className="bg-gradient-breaking-news text-white py-2 overflow-hidden">
        <div className="max-w-screen-xl mx-auto px-4 flex items-center">
          <div className="flex items-center space-x-2 mr-4 whitespace-nowrap">
            <TrendingUp className="h-4 w-4" />
            <span className="font-bold text-sm">BREAKING</span>
          </div>
          <div className="overflow-hidden">
            <div className="animate-marquee whitespace-nowrap text-sm">
              Major economic summit reaches historic agreement • AI breakthrough announced by tech giants • Climate summit yields promising results • Sports championship breaks viewership records
            </div>
          </div>
        </div>
      </div>

      <header className="w-full bg-background border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-screen-xl mx-auto px-4 py-4">
          {/* Top row: Logo, Search, Actions */}
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 mb-4">
            {/* Logo */}
            <Link href="/">
              <Image
                src="/vand-logo.svg"
                alt="Vand News Logo"
                width={100}
                height={100}
                className="h-12 w-auto object-contain"
              />
            </Link>

            {/* Search Bar */}
            <div className="hidden md:block max-w-md mx-auto w-full">
              <SearchInput />
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-error rounded-full"></span>
              </Button>
              <Link href={`/${locale}/login`}>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
              <ToggleMode />
              <LanguageSwitcher />
              <Button 
                variant="ghost" 
                size="icon" 
                className="md:hidden"
                onClick={() => setIsOpen(!isOpen)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Navigation Bar */}
          <nav className="hidden md:flex items-center justify-between border-t pt-3">
            <div className="flex items-center space-x-8">
              {navLinks.map((link) => {
                const isActive = normalizePath(pathname) === `/${locale}${link.href}` || 
                                (link.href === '/' && normalizePath(pathname) === `/${locale}`);
                
                return (
                  <Link
                    key={link.href}
                    href={`/${locale}${link.href}`}
                    className={`text-sm font-medium transition-colors relative group ${
                      isActive
                        ? 'text-brand-primary dark:text-brand-accent'
                        : 'text-muted-foreground hover:text-brand-primary dark:hover:text-brand-accent'
                    }`}
                  >
                    {link.label}
                    {isActive && (
                      <div className="absolute -bottom-3 left-0 right-0 h-0.5 bg-brand-primary dark:bg-brand-accent"></div>
                    )}
                    <div className="absolute -bottom-3 left-0 right-0 h-0.5 bg-brand-primary dark:bg-brand-accent scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                  </Link>
                );
              })}
            </div>
            
            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
              <div className="flex items-center space-x-1">
                <div className="h-2 w-2 bg-success rounded-full animate-pulse"></div>
                <span>Live</span>
              </div>
              {mounted && (
                <>
                  <span>{currentDate}</span>
                  <span>{currentTime}</span>
                </>
              )}
              <div className="flex items-center space-x-1 text-brand-primary">
                <span>☀️</span>
                <span className="font-medium">24°C</span>
                <span className="opacity-75">Kigali</span>
              </div>
            </div>
          </nav>

          {/* Mobile Search */}
          <div className="md:hidden mt-3">
            <SearchInput />
          </div>
        </div>

        {/* Mobile Navigation */}
        <div
          className={`md:hidden border-t bg-background overflow-hidden transition-all duration-300 ease-in-out ${
            isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 border-t-0'
          }`}
        >
          <nav className="max-w-screen-xl mx-auto px-4 py-4 space-y-1">
            {navLinks.map((link) => {
              const isActive = normalizePath(pathname) === `/${locale}${link.href}` ||
                              (link.href === '/' && normalizePath(pathname) === `/${locale}`);

              return (
                <Link
                  key={link.href}
                  href={`/${locale}${link.href}`}
                  className={`block text-sm font-medium py-3 px-4 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-brand-primary/10 text-brand-primary dark:text-brand-accent font-semibold'
                      : 'text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-brand-primary dark:hover:text-brand-accent'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
    </>
  )
}
