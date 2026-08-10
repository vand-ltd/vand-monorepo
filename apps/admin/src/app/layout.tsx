// @ts-ignore
import "./globals.css";
import type { Metadata } from "next";
import { QueryProvider } from "@org/api";

export const metadata: Metadata = {
  title: "Vand Admin",
  description: "Admin dashboard for Vand.",
  // ?v=2 busts browser + CDN favicon caches (favicons are cached per-URL and
  // survive incognito). Bump the number whenever the icon changes.
  icons: { icon: [{ url: '/favicon.svg?v=2', type: 'image/svg+xml' }] },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
