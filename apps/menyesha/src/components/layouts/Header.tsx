'use client'

import Link from "next/link"
import Image from "next/image"
import { useState, useEffect, useRef, useMemo } from "react"
import { useTheme } from "next-themes"
import { ToggleMode } from "./ToggleMode"
import { SearchInput } from "./SearchInput"
import LanguageSwitcher from "./LanguageSwitcher"
import { Button } from "@/components/ui/button"
import { Menu, User, ChevronDown, ChevronRight, ChevronLeft } from "lucide-react"
import { BreakingNewsTicker } from "./BreakingNewsTicker"
import { useTranslations, useLocale } from "next-intl"
import { usePathname } from "next/navigation"
import { useClientDateTime } from "@/hooks/useClientDateTime"
import { useQuery } from "@tanstack/react-query"
import { getCategories } from "@org/api"

type SubCategory = {
  key: string;
  href: string;
  name: string;
};

type NavLink = {
  href: string;
  label: string;
  subcategories?: SubCategory[];
};

export const Header = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [expandedMobile, setExpandedMobile] = useState<string | null>(null)
  const { currentDate, currentTime, mounted } = useClientDateTime()
  const { resolvedTheme } = useTheme()
  const [logoMounted, setLogoMounted] = useState(false)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const dropdownTimeout = useRef<NodeJS.Timeout | null>(null)
  const navRef = useRef<HTMLElement>(null)
  const navScrollRef = useRef<HTMLDivElement>(null)
  const navItemRefs = useRef<Record<string, HTMLDivElement | null>>({})

  useEffect(() => setLogoMounted(true), [])

  // Check scroll overflow
  const updateScrollButtons = () => {
    const el = navScrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 0)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
  }

  const scrollNav = (direction: 'left' | 'right') => {
    const el = navScrollRef.current
    if (!el) return
    el.scrollBy({ left: direction === 'left' ? -150 : 150, behavior: 'smooth' })
  }

  const t = useTranslations('nav')
  const locale = useLocale();
  const pathname = usePathname();

  // Fetch categories from API to get locale-specific slugs
  const { data: categories } = useQuery({
    queryKey: ['categories', locale],
    queryFn: () => getCategories(locale),
  });

  // Build nav links dynamically from API categories
  const navLinks: NavLink[] = useMemo(() => {
    const links: NavLink[] = [{ href: '/', label: t('home') }];

    if (categories) {
      // Sort by createdAt ascending (first created comes first)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sorted = [...categories].sort((a: any, b: any) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sorted.forEach((cat: any) => {
        const subcategories: SubCategory[] = (cat.children || []).map((child: any) => ({
          key: child.slug,
          href: `/${child.slug}`,
          name: child.name,
        }));
        links.push({
          href: `/${cat.slug}`,
          label: cat.name,
          subcategories: subcategories.length > 0 ? subcategories : undefined,
        });
      });
    } else {
      // Fallback while loading — use English keys with translation labels
      const fallbackCategories = ['sports', 'entertainment', 'technology', 'business', 'news'];
      fallbackCategories.forEach((key) => {
        links.push({ href: `/${key}`, label: t(key) });
      });
    }

    return links;
  }, [categories, t]);

  useEffect(() => {
    updateScrollButtons()
    const el = navScrollRef.current
    if (!el) return
    el.addEventListener('scroll', updateScrollButtons)
    window.addEventListener('resize', updateScrollButtons)
    return () => {
      el.removeEventListener('scroll', updateScrollButtons)
      window.removeEventListener('resize', updateScrollButtons)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navLinks])

  const normalizePath = (path: string) =>
    path.endsWith('/') && path !== '/' ? path.slice(0, -1) : path;

  const handleMouseEnter = (href: string) => {
    if (dropdownTimeout.current) {
      clearTimeout(dropdownTimeout.current)
      dropdownTimeout.current = null
    }
    setActiveDropdown(href)
  }

  const handleMouseLeave = () => {
    dropdownTimeout.current = setTimeout(() => {
      setActiveDropdown(null)
    }, 150)
  }

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setActiveDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <>
      {/* Breaking News Ticker */}
      <BreakingNewsTicker />

      <header className="w-full bg-background border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-screen-xl mx-auto px-4 py-4">
          {/* Top row: Logo, Search, Actions */}
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 mb-4">
            {/* Logo */}
            <Link href="/">
              <Image
                src={logoMounted && resolvedTheme === 'dark' ? '/menyesha-logo-dark.svg' : '/menyesha-logo.svg'}
                alt="Menyesha Logo"
                width={160}
                height={40}
                className="h-10 w-auto object-contain"
              />
            </Link>

            {/* Search Bar */}
            <div className="hidden md:block max-w-md mx-auto w-full">
              <SearchInput />
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-3">
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
          <nav ref={navRef} className="hidden md:flex items-center justify-between border-t pt-3 gap-4">
            <div className="relative flex-1 min-w-0">
              {canScrollLeft && (
                <button
                  onClick={() => scrollNav('left')}
                  className="absolute left-0 top-0 bottom-0 z-10 w-7 flex items-center justify-center bg-gradient-to-r from-background via-background/90 to-transparent hover:from-background"
                >
                  <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
              {canScrollRight && (
                <button
                  onClick={() => scrollNav('right')}
                  className="absolute right-0 top-0 bottom-0 z-10 w-7 flex items-center justify-center bg-gradient-to-l from-background via-background/90 to-transparent hover:from-background"
                >
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
              <div ref={navScrollRef} className="flex items-center space-x-6 overflow-x-auto scrollbar-hide px-1">
              {navLinks.map((link) => {
                const isActive = normalizePath(pathname) === `/${locale}${link.href}` ||
                                (link.href === '/' && normalizePath(pathname) === `/${locale}`);
                const hasDropdown = !!link.subcategories;
                const isDropdownOpen = activeDropdown === link.href;

                return (
                  <div
                    key={link.href}
                    ref={(el) => { navItemRefs.current[link.href] = el; }}
                    onMouseEnter={() => hasDropdown ? handleMouseEnter(link.href) : undefined}
                    onMouseLeave={hasDropdown ? handleMouseLeave : undefined}
                  >
                    <Link
                      href={`/${locale}${link.href}`}
                      className={`text-sm font-medium transition-colors relative group flex items-center gap-1 whitespace-nowrap ${
                        isActive
                          ? 'text-brand-primary dark:text-brand-accent'
                          : 'text-muted-foreground hover:text-brand-primary dark:hover:text-brand-accent'
                      }`}
                    >
                      {link.label}
                      {hasDropdown && (
                        <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                      )}
                      {isActive && (
                        <div className="absolute -bottom-3 left-0 right-0 h-0.5 bg-brand-primary dark:bg-brand-accent"></div>
                      )}
                      <div className="absolute -bottom-3 left-0 right-0 h-0.5 bg-brand-primary dark:bg-brand-accent scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                    </Link>
                  </div>
                );
              })}
              </div>

              {/* Dropdown rendered outside scrollable container */}
              {activeDropdown && (() => {
                const link = navLinks.find((l) => l.href === activeDropdown);
                const el = navItemRefs.current[activeDropdown];
                if (!link?.subcategories || !el) return null;
                const rect = el.getBoundingClientRect();
                const navRect = navRef.current?.getBoundingClientRect();
                const left = rect.left - (navRect?.left || 0);
                return (
                  <div
                    className="absolute bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl py-1 min-w-[180px] z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                    style={{ top: rect.bottom - (navRect?.top || 0) + 4, left }}
                    onMouseEnter={() => handleMouseEnter(activeDropdown)}
                    onMouseLeave={handleMouseLeave}
                  >
                    <Link
                      href={`/${locale}${link.href}`}
                      className="flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors font-medium"
                      onClick={() => setActiveDropdown(null)}
                    >
                      {link.label}
                    </Link>
                    <div className="border-t border-gray-100 dark:border-gray-700 my-1" />
                    {link.subcategories.map((sub) => (
                      <Link
                        key={sub.key}
                        href={`/${locale}${link.href}${sub.href}`}
                        className="flex items-center px-4 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-brand-primary dark:hover:text-brand-accent transition-colors"
                        onClick={() => setActiveDropdown(null)}
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                );
              })()}
            </div>

            <div className="flex items-center space-x-3 text-xs text-muted-foreground flex-shrink-0">
              {mounted && (
                <>
                  <span>{currentDate}</span>
                  <span className="text-gray-300 dark:text-gray-600">|</span>
                  <span>{currentTime}</span>
                </>
              )}
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
            isOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0 border-t-0'
          }`}
        >
          <nav className="max-w-screen-xl mx-auto px-4 py-4 space-y-1">
            {navLinks.map((link) => {
              const isActive = normalizePath(pathname) === `/${locale}${link.href}` ||
                              (link.href === '/' && normalizePath(pathname) === `/${locale}`);
              const hasDropdown = !!link.subcategories;
              const isExpanded = expandedMobile === link.href;

              return (
                <div key={link.href}>
                  <div className="flex items-center">
                    <Link
                      href={`/${locale}${link.href}`}
                      className={`flex-1 text-sm font-medium py-3 px-4 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-brand-primary/10 text-brand-primary dark:text-brand-accent font-semibold'
                          : 'text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-brand-primary dark:hover:text-brand-accent'
                      }`}
                      onClick={() => setIsOpen(false)}
                    >
                      {link.label}
                    </Link>
                    {hasDropdown && (
                      <button
                        onClick={() => setExpandedMobile(isExpanded ? null : link.href)}
                        className="p-3 text-muted-foreground hover:text-brand-primary dark:hover:text-brand-accent transition-colors"
                      >
                        <ChevronRight className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                      </button>
                    )}
                  </div>

                  {/* Mobile Subcategories */}
                  {hasDropdown && isExpanded && (
                    <div className="ml-4 pl-4 border-l-2 border-gray-200 dark:border-gray-700 space-y-1 mb-2">
                      {link.subcategories!.map((sub) => (
                        <Link
                          key={sub.key}
                          href={`/${locale}${link.href}${sub.href}`}
                          className="block text-sm py-2.5 px-4 rounded-lg text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-brand-primary dark:hover:text-brand-accent transition-colors"
                          onClick={() => setIsOpen(false)}
                        >
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </header>
    </>
  )
}
