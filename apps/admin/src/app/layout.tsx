// @ts-ignore
import "./globals.css";
import type { Metadata } from "next";
import { QueryProvider } from "@org/api";

export const metadata: Metadata = {
  title: "Vand Admin",
  description: "Admin dashboard for Vand.",
  icons: { icon: '/favicon.svg' },
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
