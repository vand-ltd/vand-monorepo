import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vand - Coming Soon",
  description: "Something great is coming soon.",
  icons: {
    icon: '/favicon.svg',
  },
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
