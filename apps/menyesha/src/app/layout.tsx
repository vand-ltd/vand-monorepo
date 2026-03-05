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
  title: 'Vand News - Your Trusted Source for Breaking News',
  description: 'Stay informed with the latest breaking news, analysis, and stories from around the world. Your trusted source for comprehensive news coverage.',
  keywords: 'news, breaking news, world news, politics, sports, technology, business',
  authors: [{ name: 'Vand News Team' }],
  creator: 'Vand News',
  publisher: 'Vand News',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: '/favicon.ico',
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
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://vandnews.com',
    siteName: 'Vand News',
    title: 'Vand News - Your Trusted Source for Breaking News',
    description: 'Stay informed with the latest breaking news, analysis, and stories from around the world.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vand News - Your Trusted Source for Breaking News',
    description: 'Stay informed with the latest breaking news, analysis, and stories from around the world.',
    creator: '@vandnews',
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
    <html className={`scroll-smooth ${inter.variable} ${playfair.variable}`} suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Vand News" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className={`min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 antialiased ${inter.className} overflow-x-hidden`}>
        {children}
      </body>
    </html>
  )
}
