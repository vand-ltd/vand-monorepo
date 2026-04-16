// @ts-ignore
import "./globals.css";
import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const playfair = Playfair_Display({ 
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

export const metadata: Metadata = {
  keywords: 'menyesha, news, breaking news, Rwanda, Africa, world news, politics, sports, technology, business',
  authors: [{ name: 'Menyesha Team' }],
  creator: 'Menyesha',
  publisher: 'Menyesha',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: '/favicon.svg',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#1e40af' },
  ],
  colorScheme: 'light dark',
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html className={`scroll-smooth ${inter.variable} ${playfair.variable} overflow-x-clip`} suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Menyesha" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className={`min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 antialiased ${inter.className}`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
