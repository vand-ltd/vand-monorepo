# Vand Monorepo

Nx monorepo containing the **Vand** family of web applications with shared internationalization (i18n) and dark mode support.

## Apps

| App | Description | Path |
|---|---|---|
| **menyesha** | Full-featured news/article site with i18n, dark mode, shadcn/ui | `apps/menyesha/` |
| **vand** | "Coming Soon" brand landing page with i18n and dark mode | `apps/vand/` |

## Shared Packages

| Package | Description | Path |
|---|---|---|
| **@org/i18n** | Shared i18n configuration, routing, and helpers | `packages/i18n/` |
| **@org/ui** | Shared UI primitives (ThemeProvider, cn utility) | `packages/ui/` |

---

## Tech Stack

- **Nx 22.5** — Monorepo tooling and task orchestration
- **Next.js 15.3+** — React framework (App Router)
- **React 19** — UI library
- **TypeScript 5.9** — Type safety
- **Tailwind CSS v4** — Utility-first styling (via `@tailwindcss/postcss`)
- **next-intl 4.3** — Internationalization (locales: `en`, `fr`, `rw`)
- **next-themes** — Dark/light mode toggle
- **shadcn/ui** — Component library with Radix UI primitives (menyesha only)
- **Embla Carousel** — Carousel component (menyesha only)

## Prerequisites

- **Node.js** >= 20
- **npm** (ships with Node.js)

---

## Getting Started

### 1. Install dependencies

```sh
npm install
```

### 2. Run a dev server

```sh
# Menyesha (news site)
npx nx dev @org/menyesha

# Vand (landing page)
npx nx dev @org/vand
```

### 3. Build for production

```sh
# Single app
npx nx build @org/menyesha
npx nx build @org/vand

# All apps
npx nx run-many --target=build
```

---

## Common Commands

| Command | Description |
|---|---|
| `npx nx dev @org/menyesha` | Start menyesha dev server |
| `npx nx dev @org/vand` | Start vand dev server |
| `npx nx build @org/menyesha` | Production build for menyesha |
| `npx nx build @org/vand` | Production build for vand |
| `npx nx run-many --target=build` | Build all apps |
| `npx nx run-many --target=dev` | Run all dev servers |
| `npx nx graph` | Visualize project dependency graph |
| `npx nx sync` | Sync TypeScript project references |

---

## Project Structure

```
vand-monorepo/
├── apps/
│   ├── menyesha/                  # News/article app
│   │   ├── messages/              # i18n translation files (en.json, fr.json, rw.json)
│   │   ├── public/                # Static assets (logos, favicon)
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── [locale]/      # Locale-based routing (layout + pages)
│   │   │   │   ├── layout.tsx     # Root layout (fonts, metadata)
│   │   │   │   └── globals.css    # Tailwind + brand CSS variables
│   │   │   ├── components/        # UI, layout, article components
│   │   │   ├── hooks/             # Custom React hooks
│   │   │   ├── i18n/              # App-specific i18n config
│   │   │   │   ├── routing.ts     # Uses createRouting() from @org/i18n
│   │   │   │   ├── navigation.ts  # Uses createNavigation() from @org/i18n
│   │   │   │   └── request.ts     # Uses createRequestConfig() from @org/i18n
│   │   │   ├── lib/               # Utilities (re-exports cn from @org/ui)
│   │   │   └── proxy.ts          # Uses createProxy() from @org/i18n
│   │   ├── next.config.ts         # withNx + withNextIntl
│   │   ├── postcss.config.mjs     # Tailwind v4 PostCSS config
│   │   └── tsconfig.json          # App-level TypeScript config
│   │
│   └── vand/                      # Landing page app
│       ├── messages/              # i18n translation files (en.json, fr.json, rw.json)
│       ├── src/
│       │   ├── app/
│       │   │   ├── [locale]/      # Locale-based routing (layout + page)
│       │   │   ├── layout.tsx     # Root layout (with suppressHydrationWarning)
│       │   │   └── globals.css    # Tailwind + dark mode variant
│       │   ├── i18n/              # App-specific i18n config
│       │   │   ├── routing.ts
│       │   │   ├── navigation.ts
│       │   │   └── request.ts
│       │   └── proxy.ts          # Locale routing proxy
│       ├── next.config.ts         # withNx + withNextIntl
│       ├── postcss.config.mjs
│       └── tsconfig.json
│
├── packages/
│   ├── i18n/                      # Shared i18n library (@org/i18n)
│   │   ├── src/index.ts           # locales, createRouting, createRequestConfig, etc.
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── ui/                        # Shared UI library (@org/ui)
│       ├── src/
│       │   ├── index.ts           # Re-exports ThemeProvider, cn
│       │   ├── theme-provider.tsx  # next-themes wrapper (client component)
│       │   └── utils.ts           # cn() = clsx + tailwind-merge
│       ├── package.json
│       └── tsconfig.json
│
├── nx.json                        # Nx workspace configuration
├── tsconfig.json                  # Root TypeScript config
├── tsconfig.base.json             # Shared TS compiler options
└── package.json                   # Root dependencies & npm workspaces
```

---

## Shared Packages Reference

### @org/i18n (`packages/i18n/`)

Centralizes i18n configuration so all apps use the same locales and helpers.

**Exports:**

| Export | Description |
|---|---|
| `locales` | `['en', 'fr', 'rw'] as const` — supported locale list |
| `defaultLocale` | `'en'` — fallback locale |
| `Locale` | TypeScript type: `'en' \| 'fr' \| 'rw'` |
| `createRouting()` | Creates next-intl routing config with shared locales |
| `createNavigation(routing)` | Re-export of `createNavigation` from `next-intl/navigation` |
| `createProxy(routing)` | Re-export of `createMiddleware` from `next-intl/middleware` (for `proxy.ts`) |
| `createRequestConfig(loadMessages)` | Creates server-side request config; each app passes its own message-loading function |

### @org/ui (`packages/ui/`)

Shared UI primitives for theming and styling utilities.

**Exports:**

| Export | Description |
|---|---|
| `ThemeProvider` | `next-themes` wrapper component (`'use client'`). Supports `attribute`, `defaultTheme`, `enableSystem` props |
| `cn(...inputs)` | Utility combining `clsx` + `tailwind-merge` for conditional class names |

---

## How i18n Works

### Data flow

```
User visits /fr/about
    │
    ▼
[Proxy] ── detects locale from URL/cookies/headers
    │
    ▼
[App Router] ── routes to /[locale]/about with params: { locale: 'fr' }
    │
    ▼
[Locale Layout] ── validates locale, loads messages/fr.json,
                    wraps children with NextIntlClientProvider + ThemeProvider
    │
    ▼
[Page Components] ── useTranslations('namespace') reads from messages
                      useLocale() returns 'fr'
```

### Supported locales

| Code | Language |
|---|---|
| `en` | English (default) |
| `fr` | French |
| `rw` | Kinyarwanda |

### Translation file structure

Each app has its own `messages/` directory with one JSON file per locale:

```
apps/my-app/messages/
├── en.json
├── fr.json
└── rw.json
```

Translation files use nested namespaces:

```json
{
  "nav": {
    "home": "Home",
    "about": "About"
  },
  "toggleTheme": {
    "light": "Light",
    "dark": "Dark"
  }
}
```

### Using translations in components

```tsx
'use client';
import { useTranslations } from 'next-intl';

export default function MyComponent() {
  const t = useTranslations('nav');
  return <p>{t('home')}</p>; // "Home" or "Accueil" or "Ahabanza"
}
```

### Using locale-aware navigation

```tsx
'use client';
import { Link } from '@/i18n/navigation';

export default function Nav() {
  return <Link href="/about">About</Link>; // Automatically includes locale prefix
}
```

---

## How Dark Mode Works

- `ThemeProvider` from `@org/ui` wraps the app in the `[locale]/layout.tsx`
- It uses `attribute="class"` — toggles a `dark` class on the `<html>` element
- Tailwind's `dark:` variant applies styles when `dark` class is present
- Default theme is `system` (respects OS preference)

### Using dark mode in styles

```tsx
<div className="bg-white dark:bg-gray-900 text-black dark:text-white">
  Content that adapts to theme
</div>
```

### Toggling the theme programmatically

```tsx
'use client';
import { useTheme } from 'next-themes';

export function ThemeToggle() {
  const { setTheme } = useTheme();
  return (
    <>
      <button onClick={() => setTheme('light')}>Light</button>
      <button onClick={() => setTheme('dark')}>Dark</button>
    </>
  );
}
```

---

## Adding a New App (Step-by-Step Guide)

Follow these steps to create a new app with full i18n and dark mode support.

### Step 1: Generate the app

```sh
npx nx generate @nx/next:application apps/my-app
```

### Step 2: Update `next.config.ts`

Add the `withNextIntl` plugin alongside `withNx`:

```ts
// apps/my-app/next.config.ts
import { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import { composePlugins, withNx } from '@nx/next';

const nextConfig: NextConfig = {};

const withNextIntl = createNextIntlPlugin();

const plugins = [withNx, withNextIntl];

export default composePlugins(...plugins)(nextConfig);
```

### Step 3: Create translation files

Create `apps/my-app/messages/` with a JSON file for each locale:

**`messages/en.json`**
```json
{
  "home": {
    "title": "Welcome",
    "description": "This is my app."
  },
  "toggleTheme": {
    "light": "Light",
    "dark": "Dark"
  }
}
```

**`messages/fr.json`**
```json
{
  "home": {
    "title": "Bienvenue",
    "description": "Ceci est mon application."
  },
  "toggleTheme": {
    "light": "Clair",
    "dark": "Sombre"
  }
}
```

**`messages/rw.json`**
```json
{
  "home": {
    "title": "Murakaza neza",
    "description": "Iyi ni porogaramu yanjye."
  },
  "toggleTheme": {
    "light": "Umucyo",
    "dark": "Umwijima"
  }
}
```

### Step 4: Create `src/i18n/` config files

**`src/i18n/routing.ts`**
```ts
import { createRouting } from "@org/i18n";

export const routing = createRouting();
```

**`src/i18n/navigation.ts`**
```ts
import { createNavigation } from "@org/i18n";
import { routing } from "./routing";

export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
```

**`src/i18n/request.ts`**
```ts
import { createRequestConfig } from "@org/i18n";

export default createRequestConfig(
  async (locale) => (await import(`../../messages/${locale}.json`)).default
);
```

### Step 5: Create `src/proxy.ts`

Next.js 16 uses `proxy.ts` instead of the deprecated `middleware.ts`:

```ts
import { createProxy } from "@org/i18n";
import { routing } from "./i18n/routing";

export default createProxy(routing);

export const config = {
  matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)'
};
```

### Step 6: Update the root layout

Add `suppressHydrationWarning` to `<html>` (required by next-themes to avoid hydration mismatch):

**`src/app/layout.tsx`**
```tsx
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My App",
  description: "My app description.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
```

### Step 7: Create the locale layout

This is the core file that wires up i18n and dark mode. Create `src/app/[locale]/layout.tsx`:

```tsx
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { notFound } from "next/navigation";
import { routing } from '@/i18n/routing';
import { ThemeProvider } from "@org/ui";

export default async function LocaleLayout({
  children, params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  let messages;
  try {
    messages = (await import(`../../../messages/${locale}.json`)).default;
  } catch {
    notFound();
  }

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        {children}
      </ThemeProvider>
    </NextIntlClientProvider>
  );
}
```

### Step 8: Create your first page

Create `src/app/[locale]/page.tsx`:

```tsx
'use client';

import { useTranslations } from 'next-intl';

export default function HomePage() {
  const t = useTranslations('home');

  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('description')}</p>
    </div>
  );
}
```

### Step 9: Update `globals.css`

Add the dark mode custom variant and the `@source` directive for shared package class detection:

```css
@import "tailwindcss";

@custom-variant dark (&:is(.dark *));

@source "../../../../packages/ui/src/**/*.{ts,tsx}";

body {
  margin: 0;
  padding: 0;
}
```

### Step 10: Verify

```sh
# Sync TypeScript project references
npx nx sync

# Build
npx nx build @org/my-app

# Dev server
npx nx dev @org/my-app
```

Visit `http://localhost:4200/en`, `http://localhost:4200/fr`, `http://localhost:4200/rw` to verify locale routing works.

---

## Architecture Notes

### What lives where

| Concern | Location | Why |
|---|---|---|
| Locale list & defaults | `@org/i18n` | Single source of truth for all apps |
| ThemeProvider & cn | `@org/ui` | Shared UI primitives, no duplication |
| Translation files (`messages/`) | Each app | Different apps have different content |
| Proxy (`proxy.ts`) | Each app | Next.js 16 requires this in the app's `src/` root |
| Request config (`i18n/request.ts`) | Each app | Imports messages relative to app file structure |
| Locale layout (`[locale]/layout.tsx`) | Each app | App-specific providers and layout components |
| `next.config.ts` | Each app | App-specific plugin composition |
| shadcn/ui components | Each app (if needed) | Tightly coupled to app styling |

### How `@org` packages work (npm workspaces)

The root `package.json` defines workspaces:

```json
"workspaces": [
  "packages/*",
  "apps/*"
]
```

Any folder inside `packages/` or `apps/` with a `package.json` becomes a local workspace package. When a package declares `"name": "@org/i18n"`, npm automatically symlinks it so any other package can `import { ... } from "@org/i18n"` — no registry publish needed.

| Import | Resolves to |
|---|---|
| `@org/i18n` | `packages/i18n/src/index.ts` |
| `@org/ui` | `packages/ui/src/index.ts` |
| `@org/menyesha` | `apps/menyesha/` |
| `@org/vand` | `apps/vand/` |

Running `npm install` creates the symlinks between them. The `@org` scope is just a naming convention — it can be changed to any scope (e.g., `@vand`).

### Key conventions

- **Dependencies** live in the root `package.json` (npm workspaces), not per-app
- **Path alias** `@/*` maps to `./src/*`, defined in each app's `tsconfig.json`
- Each app has its own `postcss.config.mjs`, `eslint.config.cjs`, and `tsconfig.json`
- **Brand colors**: primary `#003153`, secondary `#005F73`, accent `#F59E0B`
- Tailwind v4 uses `@source` directives in `globals.css` to scan shared packages for class names
- The `@custom-variant dark (&:is(.dark *))` line in `globals.css` is required for Tailwind v4 dark mode with the class strategy

### Adding a new locale

To add a new locale (e.g., `sw` for Swahili):

1. Update `packages/i18n/src/index.ts` — add `'sw'` to the `locales` array
2. Add `sw.json` to each app's `messages/` directory
3. Rebuild — `npx nx run-many --target=build`

---

## Adding a Shared Library

```sh
npx nx generate @nx/js:lib packages/my-lib --publishable --importPath=@org/my-lib
```

After creating, run `npm install` to link it (already covered by the `packages/*` workspace glob in root `package.json`).
