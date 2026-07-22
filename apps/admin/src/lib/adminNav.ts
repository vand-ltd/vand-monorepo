import {
  LayoutDashboard,
  LogIn,
  FileText,
  List,
  UserPlus,
  Users,
  Zap,
  FolderPlus,
  ScrollText,
  BadgeDollarSign,
  Fuel,
  Trophy,
} from 'lucide-react';

/**
 * Single source of truth for the admin navigation.
 *
 * Both the desktop sidebar (AdminSidebar) and the mobile drawer (AdminHeader)
 * render this list. Keep it that way — they previously held separate hardcoded
 * copies, which drifted and left newer links (terms, fuel prices, football)
 * unreachable on mobile.
 */
export const ADMIN_NAV_LINKS = [
  { href: '/', labelKey: 'dashboard', icon: LayoutDashboard, auth: true },
  { href: '/login', labelKey: 'login', icon: LogIn, auth: false, hideWhenAuth: true },
  { href: '/articles', labelKey: 'articles', icon: List, auth: true, adminOnly: true },
  { href: '/create-article', labelKey: 'createArticle', icon: FileText, auth: true },
  { href: '/breaking-news', labelKey: 'breakingNews', icon: Zap, auth: true },
  { href: '/categories', labelKey: 'categories', icon: FolderPlus, auth: true, adminOnly: true },
  { href: '/users', labelKey: 'users', icon: Users, auth: true, adminOnly: true },
  { href: '/create-user', labelKey: 'createUser', icon: UserPlus, auth: true, adminOnly: true },
  { href: '/terms', labelKey: 'terms', icon: ScrollText, auth: true, adminOnly: true },
  {
    href: '/create-sponsored-article',
    labelKey: 'createSponsoredArticle',
    icon: BadgeDollarSign,
    auth: true,
  },
  { href: '/fuel-prices', labelKey: 'fuelPrices', icon: Fuel, auth: true, adminOnly: true },
  {
    href: '/create-fuel-prices',
    labelKey: 'createFuelPrices',
    icon: Fuel,
    auth: true,
    adminOnly: true,
  },
  { href: '/football', labelKey: 'football', icon: Trophy, auth: true, adminOnly: true },
] as const;

export type AdminNavLink = (typeof ADMIN_NAV_LINKS)[number];

/** Applies the auth/role visibility rules to the shared nav list. */
export function visibleAdminNavLinks(opts: {
  isLoggedIn: boolean;
  userRole: string;
}): readonly AdminNavLink[] {
  const isAdmin = opts.userRole.toLowerCase() === 'admin';
  return ADMIN_NAV_LINKS.filter((link) => {
    if (link.auth && !opts.isLoggedIn) return false;
    if ('hideWhenAuth' in link && link.hideWhenAuth && opts.isLoggedIn) return false;
    if ('adminOnly' in link && link.adminOnly && !isAdmin) return false;
    return true;
  });
}

/** True when `pathname` points at `href` for the given locale. */
export function isAdminNavLinkActive(
  pathname: string,
  href: string,
  locale: string,
): boolean {
  const normalized =
    pathname.endsWith('/') && pathname !== '/' ? pathname.slice(0, -1) : pathname;
  const target = `/${locale}${href === '/' ? '' : href}`;
  return normalized === target || (href === '/' && normalized === `/${locale}`);
}
